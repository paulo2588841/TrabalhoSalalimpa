import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowLeft, Check, History, LockKeyhole, LogOut, Radio, RotateCcw, Save } from 'lucide-react';
import { auth, db } from './firebase';
import { defaultContent, formatDate, residueKeys, residueLabels } from './content';
import type { Content } from './content';
import { logout, useStore } from './store';
import type { HistoryEntry } from './store';
import { errorMessage, Modal, StatusBadge } from './components';
import LiveEditor from './LiveEditor';

const general = (c: Content) => JSON.stringify({ ...c, speeches: [] });
export default function AdminPanel() {
  const store = useStore();
  const { published, admin, user, authLoading, save, status } = store;
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  const [demo, setDemo] = useState(false); const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState(() => structuredClone(published.content));
  const [base, setBase] = useState(published);
  const dirty = general(draft) !== general(base.content);
  const conflict = dirty && general(published.content) !== general(base.content);
  const canEdit = !!admin || (status === 'demo' && demo);
  useEffect(() => { if (!dirty) { setDraft(structuredClone(published.content)); setBase(published); } }, [published, dirty]);
  useEffect(() => { const fn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', fn); return () => window.removeEventListener('beforeunload', fn); }, [dirty]);
  useEffect(() => {
    const leave = (e: MouseEvent) => { const link = (e.target as Element).closest?.('a'); if (dirty && link && link.hash !== '#/admin' && !confirm('Há alterações gerais não salvas. Deseja sair do painel?')) { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener('click', leave, true); return () => document.removeEventListener('click', leave, true);
  }, [dirty]);
  async function login(e: FormEvent) {
    e.preventDefault(); if (!auth) return; setBusy(true); setMessage('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
    catch { setFailed(true); setMessage('Não foi possível entrar. Verifique o e-mail, a senha e a conexão.'); }
    finally { setBusy(false); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage(''); setBusy(true);
    try {
      if (conflict) throw new Error('Outro administrador alterou os textos gerais. Carregue a versão atual antes de salvar.');
      await save(draft, published.version); setBase({ ...published, content: structuredClone(draft) });
      setFailed(false); setMessage(status === 'demo' ? 'Prévia atualizada nesta sessão. Nenhum dado foi enviado ao Firebase.' : 'Alterações publicadas com sucesso.');
    } catch (e) { setFailed(true); setMessage(errorMessage(e)); } finally { setBusy(false); }
  }
  async function restore(content: Content, description: string) {
    if (!confirm(`${description} Esta ação cria uma nova versão e fica visível para todos. Continuar?`)) return;
    setBusy(true); setMessage(''); const acquired: number[] = []; const expected = published.version;
    try {
      if (db) for (let i = 0; i < 6; i++) if (JSON.stringify(content.speeches[i]) !== JSON.stringify(published.content.speeches[i])) { await store.lease(i); acquired.push(i); }
      await save(content, expected, 'restore'); setDraft(structuredClone(content)); setBase({ ...published, content });
      setFailed(false); setMessage(status === 'demo' ? 'Valores padrão restaurados na prévia local.' : 'Versão restaurada e registrada no histórico.'); setHistoryOpen(false);
    } catch (e) { setFailed(true); setMessage(errorMessage(e)); }
    finally { for (const i of acquired) await store.lease(i, true).catch(() => {}); setBusy(false); }
  }
  if (authLoading) return <div className="container loading" role="status">Verificando acesso…</div>;
  if (!canEdit) return <div className="login-wrap"><div className="login-card"><span className="login-icon"><LockKeyhole size={27} /></span><span className="eyebrow">ÁREA DO GRUPO</span><h1>O cuidado também<br />acontece por aqui.</h1><p>Espaço de edição exclusivo para Paulo e Maria.</p>{status === 'demo' ? <div className="demo-notice"><h2>Firebase ainda não configurado</h2><p>A prévia permite explorar os editores nesta sessão. Login, colaboração e histórico real ficam disponíveis após a configuração.</p><button className="button button-primary" onClick={() => setDemo(true)}>Explorar prévia local<ArrowLeft size={16} className="rotate-180" /></button></div> : user ? <div className="feedback error"><p>Esta conta não possui autorização administrativa. O responsável deve cadastrar seu UID no Firebase Console.</p><button className="button button-outline" onClick={() => void logout()}>Sair desta conta</button></div> : <form onSubmit={e => void login(e)}><label>E-mail<input autoComplete="username" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Senha<input autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></label><button className="button button-primary w-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar no painel'}<LockKeyhole size={16} /></button></form>}{message && <p role="alert" className="feedback error">{message}</p>}<a href="#inicio" className="text-button"><ArrowLeft size={15} />Voltar ao projeto</a></div></div>;
  function hero(key: keyof Content['hero'], value: string) { setDraft({ ...draft, hero: { ...draft.hero, [key]: value } }); }
  return <div className="container admin-page"><div className="admin-heading"><div><span className="eyebrow">PAINEL DO PROJETO</span><h1>Olá, {admin?.name ?? 'visitante'}<span>.</span></h1><p>{status === 'demo' ? 'Prévia local de edição · sem autenticação ou compartilhamento.' : 'Seu cuidado com o conteúdo chega a toda a turma.'}</p></div><div className="admin-controls"><StatusBadge />{admin && <button className="button button-small button-outline" onClick={() => { if (!dirty || confirm('Há alterações gerais não salvas. Deseja sair?')) void logout().catch(e => { setFailed(true); setMessage(errorMessage(e)); }); }}><LogOut size={15} />Sair</button>}</div></div>
    <div className="admin-summary"><span><Check size={16} />{status === 'demo' ? 'Alterações apenas nesta sessão' : `Última edição: ${published.updatedBy.name} · ${formatDate(published.updatedAt)}`}</span><button className="text-button" disabled={!db} onClick={() => setHistoryOpen(true)}><History size={16} />Histórico de versões</button></div>
    {message && <p className={`feedback ${failed ? 'error' : 'success'}`} role={failed ? 'alert' : 'status'}>{message}</p>}
    <form onSubmit={e => void submit(e)}><section className="admin-section"><div className="admin-section-heading"><span className="step-number">01</span><div><h2>Textos do projeto</h2><p>Edite a apresentação e as informações públicas.</p></div></div><div className="form-grid"><label>Título principal<input value={draft.hero.title} onChange={e => hero('title', e.target.value)} maxLength={60} required /></label><label>Subtítulo<input value={draft.hero.subtitle} onChange={e => hero('subtitle', e.target.value)} maxLength={160} required /></label><label className="full-span">Descrição<textarea rows={3} value={draft.hero.description} onChange={e => hero('description', e.target.value)} maxLength={800} required /></label><label>Texto do botão<input value={draft.hero.cta} onChange={e => hero('cta', e.target.value)} maxLength={60} required /></label></div><h3 className="form-subtitle">Mensagens de conscientização</h3><div className="form-grid">{draft.awareness.map((text, i) => <label key={i}>Mensagem {i + 1}<input value={text} maxLength={200} required onChange={e => setDraft({ ...draft, awareness: draft.awareness.map((v, j) => j === i ? e.target.value : v) })} /></label>)}</div><h3 className="form-subtitle">Informações dos integrantes</h3><div className="form-grid">{draft.members.map((m, i) => <label key={m.name}>Função de {m.name}<input value={m.role} required maxLength={100} onChange={e => setDraft({ ...draft, members: draft.members.map((v, j) => j === i ? { ...v, role: e.target.value } : v) })} /></label>)}</div></section>
    <section className="admin-section"><div className="admin-section-heading"><span className="step-number">02</span><div><h2>Resultados da pesquisa</h2><p>Quantidade em unidades. Deixe em branco enquanto não houver coleta; zero significa uma contagem real de zero.</p></div></div><div className="form-grid residue-inputs">{residueKeys.map((key, i) => <label key={key}>{residueLabels[i]}<input type="number" min={0} max={1000000} step={1} placeholder="Não informado" value={draft.residues[key] ?? ''} onChange={e => setDraft({ ...draft, residues: { ...draft.residues, [key]: e.target.value === '' ? null : Number(e.target.value) } })} /></label>)}</div></section>
    <div className="save-bar"><div><span className={`status ${dirty ? 'pending' : ''}`}>{dirty ? 'Alterações gerais não salvas' : 'Textos gerais atualizados'}</span>{conflict && <span className="conflict-warning">Há uma nova versão dos textos gerais.</span>}</div><div className="flex flex-wrap gap-3">{conflict && <button type="button" className="button button-outline button-small" onClick={() => { if (confirm('Descartar alterações gerais e carregar os textos atuais?')) { setDraft(structuredClone(published.content)); setBase(published); } }}>Carregar versão atual</button>}<button className="button button-primary" disabled={busy || conflict || (!dirty && published.version > 0)}><Save size={16} />{busy ? 'Salvando…' : published.version === 0 ? 'Publicar conteúdo inicial' : 'Salvar alterações'}</button></div></div></form>
    <section className="admin-section"><div className="admin-section-heading"><span className="step-number">03</span><div><h2>Falas · edição colaborativa</h2><p>{db ? 'Escolha uma fala. As mudanças são publicadas após 550 ms de pausa na digitação.' : 'A edição ao vivo exige Firebase. A prévia exibe os textos padrão sem simular presença ou colaboração.'}</p></div><Radio className="live-radio" size={23} /></div>{!db ? <div className="demo-speeches">{draft.speeches.map((s, i) => <label key={s.name}>{s.name} · {s.topic}<textarea rows={4} value={s.text} maxLength={2000} onChange={e => { const speeches = draft.speeches.map((v, j) => i === j ? { ...v, text: e.target.value } : v); setDraft({ ...draft, speeches }); }} /></label>)}<button type="button" className="button button-outline" onClick={() => { void save(draft, published.version).then(() => { setFailed(false); setMessage('Falas atualizadas somente nesta sessão local.'); }).catch(e => { setFailed(true); setMessage(errorMessage(e)); }); }}>Aplicar falas na prévia local</button></div> : <>{published.version === 0 && <p className="feedback">Publique o conteúdo inicial acima para começar a edição colaborativa.</p>}<div className="live-editors">{published.content.speeches.map((s, i) => <LiveEditor key={s.name} index={i} />)}</div></>}</section>
    <div className="reset-row"><div><h3>Restaurar os valores padrão</h3><p>Textos, falas e gráfico retornam ao conteúdo original do projeto.</p></div><button className="button button-outline button-small" disabled={busy} onClick={() => void restore(structuredClone(defaultContent), 'Restaurar todos os valores padrão?')}><RotateCcw size={15} />Restaurar padrões</button></div>
    {historyOpen && <VersionHistory onClose={() => setHistoryOpen(false)} onRestore={(content) => void restore(content, 'Restaurar este conteúdo do histórico?')} busy={busy} />}
  </div>;
}
function VersionHistory({ onClose, onRestore, busy }: { onClose: () => void; onRestore: (content: Content) => void; busy: boolean }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]); const [error, setError] = useState('');
  useEffect(() => onSnapshot(query(collection(db!, 'history'), orderBy('version', 'desc'), limit(30)), snapshot => { setEntries(snapshot.docs.map(d => ({ ...d.data(), id: d.id, updatedAt: d.data().updatedAt?.toMillis() ?? null }) as HistoryEntry)); }, () => setError('Não foi possível carregar o histórico.')), []);
  return <Modal title="Histórico de versões" onClose={onClose} wide><p className="muted">As 30 versões mais recentes. Restaurar cria uma nova versão; falas em edição por outra sessão não são sobrescritas.</p>{error && <p role="alert" className="feedback error">{error}</p>}{!entries.length && !error && <p className="feedback">Ainda não há versões registradas.</p>}<div className="history-list">{entries.map(entry => <article key={entry.id}><div><strong>Versão {entry.version} · {entry.updatedBy.name}</strong><p>{formatDate(entry.updatedAt)} · {entry.reason === 'speech' ? 'Edição de fala' : entry.reason === 'restore' ? 'Restauração' : 'Textos e pesquisa'}</p><details><summary>Ver conteúdo desta versão</summary><p>{entry.content.hero.subtitle}</p>{entry.content.speeches.map(s => <p key={s.name}><strong>{s.name}:</strong> {s.text}</p>)}</details></div><button className="button button-outline button-small" disabled={busy} onClick={() => onRestore(entry.content)}><RotateCcw size={14} />Restaurar</button></article>)}</div></Modal>;
}
