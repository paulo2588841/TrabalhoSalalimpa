import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Check, ChevronRight, CirclePlay, Earth, Leaf, LockKeyhole, Menu, Recycle, Sparkles, Sprout, Trash2, Users, X } from 'lucide-react';
import { useStore } from './store';
import { chartRows, formatDate } from './content';
import { StatusBadge, useNow } from './components';
import Illustration from './Illustration';
const ResearchChart = lazy(() => import('./Chart'));
const Presentation = lazy(() => import('./Presentation'));
const AdminPanel = lazy(() => import('./Admin'));

export default function App() {
  const { published, status, error, editing, presenceError } = useStore();
  const [adminRoute, setAdminRoute] = useState(location.hash.startsWith('#/admin'));
  const [menu, setMenu] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const now = useNow();
  useEffect(() => { const change = () => { setAdminRoute(location.hash.startsWith('#/admin')); setMenu(false); }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  const { content } = published;
  const rows = chartRows(content);
  const measured = rows.filter(row => row.value !== null);
  const total = measured.reduce((sum, row) => sum + (row.value ?? 0), 0);
  const icons = [Trash2, BookOpen, Users];
  return <>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header"><div className="container nav-row">
      <a href="#inicio" className="brand" aria-label="Sala Limpa, início"><span className="brand-icon"><Sprout size={23} /></span>SALA LIMPA<span className="brand-period">.</span></a>
      <nav className={menu ? 'main-nav open' : 'main-nav'} aria-label="Navegação principal"><a href="#projeto">O projeto</a><a href="#pesquisa">Nossa pesquisa</a><a href="#equipe">A equipe</a><a href="#apresentacao">Apresentação</a></nav>
      <a className="admin-link" href={adminRoute ? '#inicio' : '#/admin'}><LockKeyhole size={14} />{adminRoute ? 'Voltar ao site' : 'Área do grupo'}<ArrowUpRight size={14} /></a>
      <button className="icon-button mobile-menu" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </div></header>
    {adminRoute ? <main id="conteudo"><Suspense fallback={<div className="container loading">Carregando painel…</div>}><AdminPanel /></Suspense></main> : <main id="conteudo">
      {status === 'demo' && <div className="demo-strip"><span className="container"><span className="tiny-dot" />Modo demonstrativo local · Firebase não configurado. Alterações nesta prévia não são compartilhadas.</span></div>}
      {(error || presenceError) && <div className="connection-strip" role="alert">{error || presenceError}</div>}
      <section className="hero container" id="inicio"><div className="hero-copy animate-in">
        <span className="eyebrow"><span className="tiny-dot" /> UM PROJETO PARA CUIDAR DO QUE É NOSSO</span>
        <h1>{content.hero.title === 'SALA LIMPA' ? <>SALA<br /><span>LIMPA</span><span className="title-dot">.</span></> : content.hero.title}</h1>
        <h2>{content.hero.subtitle}</h2><p>{content.hero.description}</p>
        <a className="button button-primary" href="#projeto">{content.hero.cta}<ArrowUpRight size={18} /></a>
        <div className="hero-footnote"><div className="mini-avatars"><span>P</span><span>M</span><span>B</span><span>V</span><span>L</span><span>I</span></div><span>6 vozes. Um mesmo propósito.</span></div>
      </div><div className="hero-visual animate-in"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="visual-top-label"><Sparkles size={15} />Um novo olhar para a nossa sala</div><Illustration /><div className="illustration-note"><span className="note-icon"><Leaf size={20} /></span><div><strong>O cuidado começa aqui.</strong><span>Na escola. Na sala. Em cada um de nós.</span></div><Check size={15} /></div><span className="art-coordinate">MENOS LIXO. MAIS CONSCIÊNCIA.</span></div></section>
      <div className="container hero-divider"><span>BOAS ATITUDES TRANSFORMAM AMBIENTES</span><ArrowDown size={16} /><StatusBadge /></div>

      <section className="section container" id="projeto"><div className="section-heading"><div><span className="eyebrow">01 / NOSSO PROPÓSITO</span><h2>Uma sala melhor.<br /><span>Uma atitude de cada vez.</span></h2></div><p>O espaço onde aprendemos também merece cuidado. E cada um de nós faz parte dessa mudança.</p></div>
        <div className="principles">{content.awareness.map((text, i) => { const Icon = icons[i]; return <article className={`principle principle-${i}`} key={i}><div className="principle-top"><span className="principle-icon"><Icon size={24} strokeWidth={1.7} /></span><span>0{i + 1}</span></div><h3>{text}</h3><p>{['Antes de ir embora, dê uma olhada ao redor. O destino certo faz toda a diferença.', 'Um ambiente organizado convida à concentração, à convivência e a novas descobertas.', 'Pequenos gestos individuais se tornam uma grande mudança quando estamos juntos.'][i]}</p><div className="principle-bottom"><span>{['DESCARTE CONSCIENTE', 'BEM-ESTAR NA ESCOLA', 'COMPROMISSO COLETIVO'][i]}</span><ArrowUpRight size={18} /></div></article>; })}</div>
      </section>

      <section className="research-section" id="pesquisa"><div className="container research-grid"><div className="research-copy"><span className="eyebrow">02 / OBSERVAR PARA TRANSFORMAR</span><h2>O que a nossa<br />sala tem a dizer?</h2><p>Vamos olhar de perto para os resíduos que encontramos. Entender o problema é o primeiro passo para mudar hábitos.</p><div className="research-note"><BarChart3 size={21} /><span>{measured.length ? 'Dados cadastrados pelos organizadores do projeto.' : 'Uma pesquisa em construção, com transparência em cada etapa.'}</span></div><div className="research-meta"><span><span className="tiny-dot" />{measured.length ? `${measured.length} de 5 categorias informadas` : 'Aguardando coleta de dados'}</span><span>Ensino Fundamental</span></div></div>
        <div className="research-card"><div className="chart-heading"><div><span className="eyebrow">LEVANTAMENTO DA TURMA</span><h3>Quais resíduos mais encontramos nas salas?</h3></div><span className="chart-symbol"><Recycle size={23} /></span></div>
          {measured.length ? <><Suspense fallback={<div className="chart loading">Carregando gráfico…</div>}><ResearchChart content={content} /></Suspense><details className="data-table"><summary>Ver dados em tabela acessível</summary><table><caption>Resíduos encontrados, em unidades</caption><thead><tr><th scope="col">Resíduo</th><th scope="col">Quantidade</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.value ?? 'Não informado'}</td></tr>)}</tbody></table></details><div className="chart-footer"><span>Total informado</span><strong>{total.toLocaleString('pt-BR')} <small>unidades</small></strong></div></> : <div className="empty-chart"><div className="empty-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div><span className="empty-chart-icon"><BarChart3 size={24} /></span><h4>Dados da pesquisa ainda não informados</h4><p>Assim que os organizadores cadastrarem os resultados, o gráfico aparecerá aqui.</p><span className="empty-badge">Sem dados inventados. Só informação de verdade.</span></div>}
          <div className="chart-update"><span className="tiny-dot" />{status === 'demo' ? 'Prévia local · sem sincronização' : status === 'synced' ? `Atualizado em ${formatDate(published.updatedAt)}` : 'Aguardando conexão e publicação'}</div>
        </div></div></section>

      <section className="section container" id="equipe"><div className="section-heading"><div><span className="eyebrow">03 / QUEM FAZ ACONTECER</span><h2>Juntos pela<br /><span>mesma mudança.</span></h2></div><p>Seis integrantes, diferentes ideias e um compromisso em comum: cuidar da nossa escola.</p></div><div className="team-grid">{content.members.map((member, i) => <article className={`member member-${i}`} key={member.name}><span className="member-index">0{i + 1}<ArrowUpRight size={15} /></span><div className="avatar">{member.name[0]}<span><Leaf size={12} /></span></div><h3>{member.name}</h3><p>{member.role}</p>{i < 2 && <span className="member-tag">ORGANIZAÇÃO</span>}</article>)}</div></section>

      <section className="presentation-section" id="apresentacao"><div className="container"><div className="section-heading"><div><span className="eyebrow">04 / NOSSA VOZ, NOSSO PROJETO</span><h2>Uma ideia que merece<br /><span>ser compartilhada.</span></h2></div><div className="presentation-intro"><p>Conheça as falas do nosso grupo e acompanhe cada etapa da apresentação.</p><button className="button button-outline" onClick={() => setPresenting(true)}><CirclePlay size={18} />Iniciar apresentação<ArrowUpRight size={17} /></button></div></div><div className="speech-grid">{content.speeches.map((speech, i) => { const lock = editing[String(i)]; const active = lock && lock.expiresAt > now; return <article className={`speech-card ${active ? 'being-edited' : ''}`} key={speech.name}><div className="speech-header"><span className={`speech-avatar color-${i}`}>{speech.name[0]}</span><div><h3>{speech.name}</h3><span>{speech.topic}</span></div><span className="speech-number">0{i + 1}</span></div><p>“{speech.text}”</p><div className="speech-state" role="status">{active ? <><span className="typing-dots"><i /><i /><i /></span>{lock.name} está editando…</> : <><Check size={12} />{status === 'demo' ? 'Texto padrão · prévia local' : status === 'synced' ? 'Versão salva' : 'Último texto disponível'}</>}</div></article>; })}</div></div></section>
      <section className="container closing-section"><div className="closing-card"><div className="closing-art" aria-hidden="true"><Earth size={190} strokeWidth={.7} /><Leaf size={70} /></div><span className="eyebrow light">O PRÓXIMO PASSO É DE TODOS NÓS</span><h2>Uma sala melhor<br />começa com a gente<span>.</span></h2><p>Use a lixeira. Evite o desperdício. Cuide do nosso espaço.</p><a href="#projeto" className="button button-light">Vamos fazer a diferença<ArrowRight size={17} /></a><span className="closing-stamp"><Sprout size={17} />CUIDAR É UM ATO COLETIVO</span></div></section>
    </main>}
    <footer className="site-footer container"><div><a href="#inicio" className="brand"><Sprout size={23} />SALA LIMPA<span className="brand-period">.</span></a><p>Pequenas atitudes, grandes mudanças.</p></div><span>Projeto escolar · Ensino Fundamental<br /><small>SALA LIMPA 1.0 · Feito para transformar atitudes.</small></span><a href="#/admin">Área do grupo<ChevronRight size={15} /></a></footer>
    {presenting && <Suspense fallback={<div role="status">Abrindo apresentação…</div>}><Presentation speeches={content.speeches} onClose={() => setPresenting(false)} /></Suspense>}
  </>;
}
