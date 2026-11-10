import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, CloudOff, LoaderCircle, Radio, X } from 'lucide-react';
import { useStore } from './store';

export function StatusBadge() {
  const { status } = useStore();
  const labels = { demo: 'Demonstração local', connecting: 'Conectando', synced: 'Sincronizado', offline: 'Sem sincronização', missing: 'Aguardando publicação', error: 'Falha de conexão' };
  const Icon = status === 'synced' ? Check : status === 'connecting' ? LoaderCircle : status === 'demo' || status === 'missing' ? Radio : CloudOff;
  return <span className={`status status-${status}`} role="status"><Icon size={13} />{labels[status]}</span>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement; dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={title} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Fechar janela" onClick={onClose}><X /></button></div>{children}
  </dialog>;
}
export function useNow() { const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []); return now; }
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'; }
