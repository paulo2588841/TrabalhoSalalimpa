import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, Leaf, X } from 'lucide-react';
import type { Content } from './content';
import { siteName } from './content';
export default function Presentation({ speeches, onClose }: { speeches: Content['speeches']; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [hint, setHint] = useState('');
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement; dialog.showModal();
    return () => { dialog.close(); if (document.fullscreenElement === dialog) void document.exitFullscreen(); previous?.focus(); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') setIndex(i => Math.min(5, i + 1)); if (event.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1)); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, []);
  const speech = speeches[index];
  return <dialog className="presentation" aria-label={`Apresentação do projeto ${siteName}`} ref={ref} onCancel={e => { e.preventDefault(); onClose(); }}>
    <header><span className="brand"><Leaf /><span className="brand-name">{siteName}</span><small>EM APRESENTAÇÃO</small></span><div className="flex gap-2"><button className="icon-button" aria-label="Ativar tela cheia" onClick={() => { if (ref.current?.requestFullscreen) void ref.current.requestFullscreen().catch(() => setHint('A apresentação já ocupa toda a área disponível.')); else setHint('A apresentação já ocupa toda a área disponível.'); }}><Expand /></button><button className="icon-button" aria-label="Sair da apresentação" onClick={onClose}><X /></button></div></header>
    <div className="slide" key={index}><span className="eyebrow light">{String(index + 1).padStart(2, '0')} / 06 · {speech.topic}</span><h2>{speech.name}<span>.</span></h2><p>“{speech.text}”</p></div>
    <footer><button className="button presentation-button" onClick={() => setIndex(i => i - 1)} disabled={index === 0}><ArrowLeft size={18} />Anterior</button><div className="slide-dots">{speeches.map((s, i) => <button key={s.name} aria-label={`Ir para a fala de ${s.name}`} aria-current={i === index ? 'step' : undefined} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} />)}</div><button className="button presentation-button" onClick={() => setIndex(i => i + 1)} disabled={index === 5}>Próxima<ArrowRight size={18} /></button></footer>
    <span className="presentation-hint" role="status">{hint || 'Use as setas do teclado para navegar · Esc para sair'}</span>
  </dialog>;
}
