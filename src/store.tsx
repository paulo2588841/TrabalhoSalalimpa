import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from './firebase';
import { assertVersion, initialPublished, validateContent } from './content';
import type { Content, Published } from './content';
import { withContentionRetry } from './transactions';

export type Status = 'demo' | 'connecting' | 'synced' | 'offline' | 'missing' | 'error';
export type Admin = { uid: string; name: 'Paulo' | 'Maria' };
export type Editing = { uid: string; name: string; expiresAt: number; sessionId: string };
export type HistoryEntry = Published & { id: string; reason: string };
type Store = {
  published: Published; status: Status; error: string; user: User | null; admin: Admin | null; authLoading: boolean;
  editing: Record<string, Editing>; presenceError: string; sessionId: string;
  save: (content: Content, version: number, reason?: string) => Promise<void>;
  saveSpeech: (index: number, speech: Content['speeches'][number], revision: number) => Promise<void>;
  lease: (index: number, release?: boolean) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState(initialPublished);
  const latest = useRef(published); latest.current = published;
  const [sessionId] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<Status>(db ? 'connecting' : 'demo');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Record<string, Editing>>({});
  const [presenceError, setPresenceError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [authLoading, setAuthLoading] = useState(!!auth);
  useEffect(() => {
    if (!db) return;
    const offline = () => setStatus('offline');
    const online = () => setStatus('connecting');
    window.addEventListener('offline', offline); window.addEventListener('online', online);
    const unsubscribe = onSnapshot(doc(db, 'published', 'content'), { includeMetadataChanges: true }, snapshot => {
      if (!snapshot.exists()) { setStatus(snapshot.metadata.fromCache ? 'connecting' : 'missing'); return; }
      const data = snapshot.data();
      if (!validateContent(data.content) || !Number.isInteger(data.version) || data.schemaVersion !== 1 || !data.speechVersions) { setError('O conteúdo publicado tem formato inválido. Contate os organizadores.'); setStatus('error'); return; }
      const next = { content: data.content, version: data.version, speechVersions: data.speechVersions, updatedAt: data.updatedAt?.toMillis() ?? null, updatedBy: data.updatedBy };
      latest.current = next; setPublished(next);
      setStatus(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites || !navigator.onLine ? 'offline' : 'synced'); setError('');
    }, () => { setError('Não foi possível receber o conteúdo. Verifique a conexão e as regras do Firebase.'); setStatus('error'); });
    const stopEditing = Array.from({ length: 6 }, (_, i) => onSnapshot(doc(db!, 'editing', String(i)), snapshot => {
      setEditing(previous => { const next = { ...previous }; if (snapshot.exists()) next[String(i)] = { ...snapshot.data(), expiresAt: snapshot.data().expiresAt.toMillis() } as Editing; else delete next[String(i)]; return next; });
    }, () => { setPresenceError('Indicadores de edição indisponíveis.'); }));
    return () => { unsubscribe(); stopEditing.forEach(stop => stop()); window.removeEventListener('offline', offline); window.removeEventListener('online', online); };
  }, []);
  useEffect(() => {
    if (!auth || !db) return;
    let stopAdmin = () => {};
    const stopAuth = onAuthStateChanged(auth, next => {
      stopAdmin(); setUser(next); setAdmin(null); setAuthLoading(!!next);
      if (next) stopAdmin = onSnapshot(doc(db!, 'admins', next.uid), snapshot => {
        const a = snapshot.data();
        setAdmin(a?.active === true && ['Paulo', 'Maria'].includes(a.name) ? { uid: next.uid, name: a.name } : null);
        setAuthLoading(false);
      }, () => { setAdmin(null); setAuthLoading(false); });
    }, () => { setAuthLoading(false); setAdmin(null); });
    return () => { stopAuth(); stopAdmin(); };
  }, []);
  function authorized() {
    if (!admin || !auth?.currentUser) throw new Error('Sua conta não tem permissão para editar.');
    if (!navigator.onLine) throw new Error('Sem conexão. Seu rascunho está pendente neste dispositivo. Reconecte para tentar novamente.');
    return admin;
  }
  function write(transaction: Transaction, current: Published, content: Content, speechVersions: Published['speechVersions'], actor: Admin, reason: string) {
    const historyRef = doc(collection(db!, 'history'));
    const next = { content, speechVersions, version: current.version + 1, updatedAt: serverTimestamp(), updatedBy: { uid: actor.uid, name: actor.name } };
    transaction.set(doc(db!, 'published', 'content'), { ...next, schemaVersion: 1, historyId: historyRef.id });
    transaction.set(historyRef, { ...next, reason });
  }
  async function save(content: Content, expectedVersion: number, reason = 'content') {
    if (!validateContent(content)) throw new Error('Preencha os textos e use números inteiros entre 0 e 1.000.000.');
    if (!db) {
      assertVersion(latest.current.version, expectedVersion);
      const next = { ...latest.current, content: structuredClone(content), version: expectedVersion + 1, updatedAt: Date.now(), updatedBy: { uid: '', name: 'Prévia local' } };
      latest.current = next; setPublished(next); return;
    }
    const actor = authorized();
    await withContentionRetry(() => runTransaction(db!, async transaction => {
      const snapshot = await transaction.get(doc(db!, 'published', 'content'));
      const current = snapshot.exists() ? snapshot.data() as Published : initialPublished;
      assertVersion(current.version, expectedVersion);
      const speeches = reason === 'restore' ? content.speeches : current.content.speeches;
      const versions = { ...current.speechVersions };
      speeches.forEach((speech, i) => { if (JSON.stringify(speech) !== JSON.stringify(current.content.speeches[i])) versions[`s${i}`]++; });
      write(transaction, current, { ...content, speeches }, versions, actor, reason);
    }));
  }
  async function saveSpeech(index: number, speech: Content['speeches'][number], revision: number) {
    const actor = authorized();
    await withContentionRetry(() => runTransaction(db!, async transaction => {
      const snapshot = await transaction.get(doc(db!, 'published', 'content'));
      const lock = await transaction.get(doc(db!, 'editing', String(index)));
      const current = snapshot.exists() ? snapshot.data() as Published : initialPublished;
      assertVersion(current.speechVersions[`s${index}`], revision);
      if (lock.data()?.uid !== actor.uid || lock.data()?.sessionId !== sessionId || lock.data()!.expiresAt.toMillis() <= Date.now()) throw new Error('Seu bloqueio de edição expirou. Reabra a fala e revise o rascunho.');
      const content = structuredClone(current.content); content.speeches[index] = speech;
      if (!validateContent(content)) throw new Error('Preencha título e fala dentro dos limites indicados.');
      write(transaction, current, content, { ...current.speechVersions, [`s${index}`]: revision + 1 }, actor, 'speech');
    }));
  }
  async function lease(index: number, release = false) {
    const actor = authorized();
    const ref = doc(db!, 'editing', String(index));
    await runTransaction(db!, async transaction => {
      const snapshot = await transaction.get(ref); const old = snapshot.data();
      if (release) { if (old?.uid === actor.uid && old?.sessionId === sessionId) transaction.delete(ref); return; }
      if (old && old.expiresAt.toMillis() > Date.now() && (old.uid !== actor.uid || old.sessionId !== sessionId)) throw new Error(`${old.name} está editando esta fala em outra sessão. Aguarde a liberação.`);
      transaction.set(ref, { uid: actor.uid, name: actor.name, sessionId, expiresAt: Timestamp.fromMillis(Date.now() + 30000), updatedAt: serverTimestamp() });
    });
  }
  return <Context.Provider value={{ published, status, error, user, admin, authLoading, editing, presenceError, sessionId, save, saveSpeech, lease }}>{children}</Context.Provider>;
}
export function useStore() { const context = useContext(Context); if (!context) throw new Error('StoreProvider ausente'); return context; }
export const logout = () => auth ? signOut(auth) : Promise.resolve();
