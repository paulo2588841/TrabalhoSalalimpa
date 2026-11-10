import { useEffect, useRef, useState } from 'react';
import { Check, Copy, LockKeyhole, Pencil, RefreshCw, X } from 'lucide-react';
import { useStore } from './store';
import { errorMessage, useNow } from './components';
import type { Content } from './content';

export const DEBOUNCE_MS = 550;
export default function LiveEditor({ index }: { index: number }) {
  const { published, editing, admin, sessionId, status, lease, saveSpeech } = useStore();
  const speech = published.content.speeches[index];
  const revision = published.speechVersions[`s${index}`];
  const [draft, setDraft] = useState(speech);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [stalled, setStalled] = useState(false);
  const [tick, setTick] = useState(0);
  const latest = useRef(draft); latest.current = draft;
  const baseline = useRef(speech);
  const baseRevision = useRef(revision);
  const inFlight = useRef(false);
  const activeRef = useRef(false);
  const leaseRef = useRef(lease); leaseRef.current = lease;
  const now = useNow();
  const lock = editing[String(index)];
  const other = lock && lock.expiresAt > now && (lock.uid !== admin?.uid || lock.sessionId !== sessionId);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline.current);
  const draftKey = `sala-limpa:${import.meta.env.VITE_FIREBASE_PROJECT_ID}:${admin?.uid}:speech:${index}`;
  useEffect(() => { if (!active) { setDraft(speech); baseline.current = speech; baseRevision.current = revision; } }, [speech, revision, active]);
  useEffect(() => {
    if (!active) return;
    if (dirty) sessionStorage.setItem(draftKey, JSON.stringify({ speech: draft, revision: baseRevision.current }));
    const unload = (e: BeforeUnloadEvent) => { if (JSON.stringify(latest.current) !== JSON.stringify(baseline.current)) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [active, dirty, draft, draftKey]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => { void leaseRef.current(index).catch(e => { setMessage(errorMessage(e)); setStalled(true); }); }, 10000);
    return () => clearInterval(id);
  }, [active, index]);
  useEffect(() => () => { if (activeRef.current) void leaseRef.current(index, true).catch(() => {}); }, [index]);
  async function flush() {
    if (inFlight.current || JSON.stringify(latest.current) === JSON.stringify(baseline.current)) return true;
    inFlight.current = true; setBusy(true); setMessage('');
    const pending = structuredClone(latest.current);
    try {
      await saveSpeech(index, pending, baseRevision.current);
      baseRevision.current++; baseline.current = pending;
      if (JSON.stringify(latest.current) === JSON.stringify(pending)) sessionStorage.removeItem(draftKey);
      return true;
    } catch (e) { setMessage(errorMessage(e)); setStalled(true); return false; }
    finally { inFlight.current = false; setBusy(false); setTick(t => t + 1); }
  }
  useEffect(() => {
    if (!active || !dirty || stalled || busy || status === 'offline' || status === 'error') return;
    const id = setTimeout(() => { void flush(); }, DEBOUNCE_MS);
    return () => clearTimeout(id);
    // O rascunho e tick disparam a próxima gravação; inFlight serializa as transações.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, active, dirty, stalled, busy, status, tick]);
  async function begin() {
    setMessage(''); setBusy(true);
    try {
      await lease(index);
      baseline.current = speech; baseRevision.current = revision;
      const stored = sessionStorage.getItem(draftKey);
      if (stored) {
        const recovered = JSON.parse(stored) as { speech: Content['speeches'][number]; revision: number };
        setDraft(recovered.speech); latest.current = recovered.speech; baseRevision.current = recovered.revision;
        setStalled(true); setMessage('Rascunho pendente recuperado. Revise o texto e tente sincronizar; se a versão mudou, copie o rascunho antes de carregar a versão atual.');
      } else { setDraft(speech); setStalled(false); }
      activeRef.current = true; setActive(true);
    } catch (e) { setMessage(errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function finish() {
    if (inFlight.current) return;
    if (dirty && !await flush()) return;
    try { await lease(index, true); activeRef.current = false; setActive(false); setStalled(false); }
    catch (e) { setMessage(errorMessage(e)); }
  }
  return <article className={`live-editor ${active ? 'live-active' : ''}`}>
    <div className="live-editor-heading"><div><span className="eyebrow">FALA 0{index + 1}</span><h3>{speech.name} <small>· {speech.topic}</small></h3></div>{active ? <span className={`status ${dirty ? 'pending' : ''}`} role="status">{busy ? 'Sincronizando…' : dirty ? 'Alterações pendentes' : 'Salvo'}{!dirty && <Check size={13} />}</span> : <button className="button button-small button-outline" disabled={!!other || busy || published.version === 0} onClick={() => void begin()}>{other ? <LockKeyhole size={14} /> : <Pencil size={14} />}{other ? `${lock.name} está editando…` : 'Editar ao vivo'}</button>}</div>
    {active ? <><label>Título da etapa<input value={draft.topic} maxLength={100} onChange={e => setDraft({ ...draft, topic: e.target.value })} /></label><label>Texto da fala<textarea className={dirty ? 'pending-text' : ''} rows={5} value={draft.text} maxLength={2000} onChange={e => setDraft({ ...draft, text: e.target.value })} /></label><div className="editor-help"><span>{draft.text.length}/2000 · Salvamento após 550 ms de pausa</span><button className="text-button" disabled={busy} onClick={() => void finish()}><X size={14} />Concluir edição</button></div>{(stalled || status === 'offline' || status === 'error') && <div className="pending-actions"><p role="alert">{message || 'Sem conexão. O rascunho está preservado nesta aba e ainda não foi compartilhado.'}</p><button className="button button-small button-outline" disabled={busy} onClick={() => { void lease(index).then(() => { setStalled(false); setMessage(''); setTick(t => t + 1); }).catch(e => setMessage(errorMessage(e))); }}><RefreshCw size={14} />Tentar sincronizar</button><button className="text-button" onClick={() => { void navigator.clipboard.writeText(draft.text).then(() => setMessage('Rascunho copiado.')).catch(() => setMessage('Selecione e copie o texto manualmente.')); }}><Copy size={13} />Copiar rascunho</button><button className="text-button" onClick={() => { if (confirm('Descartar o rascunho pendente e carregar a versão salva mais recente?')) { baseline.current = speech; baseRevision.current = revision; setDraft(speech); latest.current = speech; sessionStorage.removeItem(draftKey); setStalled(false); setMessage(''); } }}>Carregar versão atual</button></div>}</> : <p className="live-preview">{speech.text}</p>}
    {!active && message && <p className="feedback error" role="alert">{message}</p>}
  </article>;
}
