import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defaultContent, initialPublished } from '../src/content';
import { withContentionRetry } from '../src/transactions';
let env: RulesTestEnvironment;
type TestFirestore = ReturnType<ReturnType<RulesTestEnvironment['authenticatedContext']>['firestore']>;
let paulo: TestFirestore; let maria: TestFirestore; let visitor: TestFirestore; let stranger: TestFirestore;
const seed = () => ({ ...structuredClone(initialPublished), schemaVersion: 1, historyId: 'seed', updatedAt: Timestamp.fromMillis(1) });
async function acquire(db: TestFirestore, uid: string, name: string, i = 0, sessionId = uid) {
  return setDoc(doc(db, 'editing', String(i)), { uid, name, sessionId, expiresAt: Timestamp.fromMillis(Date.now() + 30000), updatedAt: serverTimestamp() });
}
async function commit(db: TestFirestore, uid: string, name: string, mutate: (d: ReturnType<typeof seed>) => void, expected?: number) {
  return withContentionRetry(() => runTransaction(db, async t => {
    const ref = doc(db, 'published', 'content'); const snapshot = await t.get(ref);
    const previous = snapshot.exists() ? snapshot.data() as ReturnType<typeof seed> : seed();
    if (expected !== undefined && previous.version !== expected) throw new Error('Conflito de versão');
    const data = structuredClone(previous); mutate(data);
    const history = doc(collection(db, 'history'));
    const next = { ...data, version: previous.version + 1, updatedAt: serverTimestamp(), updatedBy: { uid, name }, historyId: history.id };
    t.set(ref, next);
    t.set(history, { content: next.content, speechVersions: next.speechVersions, version: next.version, updatedAt: next.updatedAt, updatedBy: next.updatedBy, reason: 'content' });
  }));
}
describe('Regras Firestore e colaboração com emulador real', () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({ projectId: 'demo-sala-limpa', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules','utf8') } });
    paulo = env.authenticatedContext('uid-paulo').firestore(); maria = env.authenticatedContext('uid-maria').firestore(); visitor = env.unauthenticatedContext().firestore(); stranger = env.authenticatedContext('uid-estranho').firestore();
  });
  beforeEach(async () => { await env.clearFirestore(); await env.withSecurityRulesDisabled(async c => {
    await setDoc(doc(c.firestore(),'admins','uid-paulo'),{name:'Paulo',active:true}); await setDoc(doc(c.firestore(),'admins','uid-maria'),{name:'Maria',active:true}); await setDoc(doc(c.firestore(),'published','content'),seed());
  }); });
  afterAll(async () => { await env?.cleanup(); });
  it('permite somente leitura pública do conteúdo publicado', async () => {
    await assertSucceeds(getDoc(doc(visitor,'published','content'))); await assertFails(getDocs(collection(visitor,'published')));
    await assertFails(getDoc(doc(visitor,'admins','uid-paulo'))); await assertFails(getDocs(collection(visitor,'history')));
    await assertFails(setDoc(doc(visitor,'published','content'),seed())); await assertFails(setDoc(doc(visitor,'outro','dado'),{public:true}));
  });
  it('ninguém pode criar sua própria permissão ou alterar administradores', async () => {
    await assertFails(setDoc(doc(stranger,'admins','uid-estranho'),{name:'Paulo',active:true}));
    await assertFails(setDoc(doc(paulo,'admins','uid-paulo'),{name:'Paulo',active:false}));
    await assertSucceeds(getDoc(doc(paulo,'admins','uid-paulo'))); await assertFails(getDoc(doc(paulo,'admins','uid-maria')));
    await assertFails(commit(stranger,'uid-estranho','Paulo',d => { d.content.hero.title='Inválido'; }));
  });
  it('Paulo e Maria salvam conteúdo com histórico atômico', async () => {
    await assertSucceeds(commit(paulo,'uid-paulo','Paulo',d => { d.content.hero.subtitle='Conteúdo do Paulo'; }));
    await assertSucceeds(commit(maria,'uid-maria','Maria',d => { d.content.residues.papers=7; }));
    expect((await getDoc(doc(visitor,'published','content'))).data()?.content.residues.papers).toBe(7);
    expect((await getDocs(collection(paulo,'history'))).size).toBe(2);
  });
  it('rejeita números inválidos, campos extras e autor forjado', async () => {
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.residues.papers=-1; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.residues.papers=1.5; }));
    await assertFails(commit(paulo,'uid-paulo','Maria',d => { d.content.hero.title='Forjado'; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { Object.assign(d.content,{privateToken:'nunca'}); }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.hero.title='   '; }));
  });
  it('não permite publicação sem uma nova versão e histórico', async () => {
    const data = { ...seed(), version: 1, updatedAt: serverTimestamp(), updatedBy: { uid:'uid-paulo',name:'Paulo' } };
    await assertFails(setDoc(doc(paulo,'published','content'),data));
    const batch = writeBatch(paulo); batch.set(doc(paulo,'history','avulso'), { content:defaultContent, speechVersions:initialPublished.speechVersions, version:1,updatedAt:serverTimestamp(),updatedBy:{uid:'uid-paulo',name:'Paulo'},reason:'content' }); await assertFails(batch.commit());
  });
  it('bloqueia a mesma fala e impede escrita de quem não tem o bloqueio', async () => {
    await assertSucceeds(acquire(paulo,'uid-paulo','Paulo')); await assertFails(acquire(maria,'uid-maria','Maria'));
    await assertFails(acquire(paulo,'uid-paulo','Paulo',0,'outra-aba'));
    await assertFails(commit(maria,'uid-maria','Maria',d => { d.content.speeches[0].text='Conflito'; d.speechVersions.s0++; }));
    await assertSucceeds(commit(paulo,'uid-paulo','Paulo',d => { d.content.speeches[0].text='Fala revisada\ncom duas linhas.'; d.speechVersions.s0++; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.speeches[0].text='Sem revisão'; }));
    expect((await getDoc(doc(visitor,'editing','0'))).data()?.name).toBe('Paulo');
  });
  it('permite editar falas diferentes em paralelo e preserva ambas', async () => {
    await acquire(paulo,'uid-paulo','Paulo',0); await acquire(maria,'uid-maria','Maria',1);
    await Promise.all([
      commit(paulo,'uid-paulo','Paulo',d => { d.content.speeches[0].text='Paulo ao vivo'; d.speechVersions.s0++; }),
      commit(maria,'uid-maria','Maria',d => { d.content.speeches[1].text='Maria ao vivo'; d.speechVersions.s1++; }),
    ]);
    const content = (await getDoc(doc(visitor,'published','content'))).data()?.content;
    expect(content.speeches[0].text).toBe('Paulo ao vivo'); expect(content.speeches[1].text).toBe('Maria ao vivo');
  });
  it('detecta versão antiga antes de sobrescrever', async () => {
    await commit(paulo,'uid-paulo','Paulo',d => { d.content.hero.title='Nova versão'; },0);
    await expect(commit(maria,'uid-maria','Maria',d => { d.content.hero.title='Velha versão'; },0)).rejects.toThrow('Conflito de versão');
  });
  it('entrega onSnapshot ao visitante sem login após uma edição', async () => {
    const update = new Promise<string>((resolve,reject) => { const stop = onSnapshot(doc(visitor,'published','content'), s => { if(s.data()?.version===1) { stop(); resolve(s.data()?.content.hero.subtitle); } },reject); });
    await commit(maria,'uid-maria','Maria',d => { d.content.hero.subtitle='Atualização recebida ao vivo'; });
    expect(await update).toBe('Atualização recebida ao vivo');
  });
  it('não aceita bloqueios públicos ou com duração ilimitada', async () => {
    await assertFails(acquire(visitor,'uid-paulo','Paulo'));
    await assertFails(setDoc(doc(paulo,'editing','0'),{uid:'uid-paulo',name:'Paulo',sessionId:'a',expiresAt:Timestamp.fromMillis(Date.now()+3600000),updatedAt:serverTimestamp()}));
  });
  it('inicializa um documento ausente junto com seu histórico', async () => {
    await env.withSecurityRulesDisabled(c => deleteDoc(doc(c.firestore(),'published','content')));
    await assertSucceeds(commit(paulo,'uid-paulo','Paulo',() => {},0));
    expect((await getDoc(doc(visitor,'published','content'))).data()?.version).toBe(1);
  });
  it('permite tomar um bloqueio expirado e nega histórico mutável', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(),'editing','0'),{uid:'uid-paulo',name:'Paulo',sessionId:'velha',expiresAt:Timestamp.fromMillis(1),updatedAt:Timestamp.fromMillis(1)}));
    await assertSucceeds(acquire(maria,'uid-maria','Maria'));
    await commit(maria,'uid-maria','Maria',d => { d.content.speeches[0].text='Nova sessão'; d.speechVersions.s0++; });
    const entries = await getDocs(collection(maria,'history')); const ref = entries.docs[0].ref;
    await assertFails(updateDoc(ref,{reason:'restore'})); await assertFails(deleteDoc(ref));
  });
  it('restaura as seis falas em uma única transação com bloqueios', async () => {
    for(let i=0;i<6;i++) await acquire(paulo,'uid-paulo','Paulo',i);
    await assertSucceeds(commit(paulo,'uid-paulo','Paulo',d => {
      d.content.hero={title:'Título restaurado',subtitle:'Subtítulo restaurado',description:'Descrição restaurada',cta:'Conhecer agora'};
      d.content.awareness=['Primeira mensagem restaurada','Segunda mensagem restaurada','Terceira mensagem restaurada'];
      d.content.residues={papers:15,packages:2,pencil:3,cups:4,bottles:5};
      d.content.members.forEach(m=>{m.role='Função restaurada';});
      d.content.speeches.forEach((s,i) => { s.topic='Etapa restaurada'; s.text=`Versão restaurada de ${s.name}`; d.speechVersions[`s${i}`]++; });
    }));
    expect((await getDoc(doc(visitor,'published','content'))).data()?.content.speeches.every((s:{text:string}) => s.text.startsWith('Versão restaurada'))).toBe(true);
  });
  it('aplica a revogação de UID no banco imediatamente', async () => {
    await env.withSecurityRulesDisabled(c => updateDoc(doc(c.firestore(),'admins','uid-paulo'),{active:false}));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => {d.content.hero.title='Revogado';}));
    await assertFails(acquire(paulo,'uid-paulo','Paulo'));
  });
  it('rejeita falas, funções e revisões malformadas mesmo na transação com histórico', async () => {
    await acquire(paulo,'uid-paulo','Paulo');
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.speeches[0].text='   '; d.speechVersions.s0++; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { Object.assign(d.content.speeches[0],{extra:'não permitido'}); d.speechVersions.s0++; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.members[0].role=''; }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.content.members.push({name:'Outra pessoa',role:'Integrante'}); }));
    await assertFails(commit(paulo,'uid-paulo','Paulo',d => { d.speechVersions.s0=0.5; }));
  });
});
