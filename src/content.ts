export const siteName = 'TrabalhoSalalimpa';
export const people = ['Paulo', 'Maria', 'Brenda', 'Victor', 'Lucas', 'Iohana'] as const;
export const residueKeys = ['papers', 'packages', 'pencil', 'cups', 'bottles'] as const;
export const residueLabels = ['Papéis', 'Embalagens', 'Pontas de lápis', 'Copos descartáveis', 'Garrafas plásticas'];
export type Content = {
  hero: { title: string; subtitle: string; description: string; cta: string };
  awareness: string[];
  members: { name: string; role: string }[];
  speeches: { name: string; topic: string; text: string }[];
  residues: Record<(typeof residueKeys)[number], number | null>;
};
export type SpeechVersions = Record<string, number>;
export type Published = { content: Content; version: number; speechVersions: SpeechVersions; updatedAt: number | null; updatedBy: { uid: string; name: string } };
export const defaultContent: Content = {
  hero: { title: siteName, subtitle: 'Pequenas atitudes, grandes mudanças.', description: 'Nosso objetivo é incentivar os alunos do Ensino Fundamental a manter as salas limpas, organizadas e agradáveis para todos.', cta: 'Conheça nosso projeto' },
  awareness: ['Lugar de lixo é na lixeira.', 'Uma sala limpa é melhor para aprender.', 'Cuidar da escola é responsabilidade de todos.'],
  members: people.map((name) => ({ name, role: name === 'Paulo' ? 'Organizador' : name === 'Maria' ? 'Administradora e organizadora' : 'Integrante' })),
  speeches: [
    { name: 'Paulo', topic: 'Abertura', text: 'Bom dia! Nosso grupo vai apresentar um trabalho sobre o lixo nas salas do Ensino Fundamental. Nosso objetivo é mostrar a importância de manter o ambiente escolar limpo.' },
    { name: 'Maria', topic: 'O problema', text: 'Quando os alunos jogam papéis e embalagens no chão, a sala fica suja e desorganizada. Isso prejudica o ambiente que todos utilizamos.' },
    { name: 'Brenda', topic: 'Consequências', text: 'O lixo acumulado pode causar mau cheiro, atrair insetos e deixar o ambiente desagradável. Por isso, precisamos cuidar da limpeza.' },
    { name: 'Victor', topic: 'Gráfico', text: 'Neste gráfico, mostramos os tipos de resíduos encontrados nas salas. Com os resultados da pesquisa, podemos identificar qual deles aparece com mais frequência.' },
    { name: 'Lucas', topic: 'Soluções', text: 'Para melhorar essa situação, devemos usar as lixeiras, evitar desperdícios e recolher os materiais que caírem no chão.' },
    { name: 'Iohana', topic: 'Encerramento', text: 'Concluímos que manter a escola limpa depende da colaboração de todos. Pequenas atitudes fazem uma grande diferença. Obrigado pela atenção!' },
  ],
  residues: { papers: null, packages: null, pencil: null, cups: null, bottles: null },
};
export const initialPublished: Published = { content: defaultContent, version: 0, speechVersions: { s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 }, updatedAt: null, updatedBy: { uid: '', name: 'Conteúdo inicial' } };
export function validateContent(value: unknown): value is Content {
  if (!value || typeof value !== 'object') return false;
  const c = value as Content;
  const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  return !!c.hero && text(c.hero.title, 60) && text(c.hero.subtitle, 160) && text(c.hero.description, 800) && text(c.hero.cta, 60)
    && Array.isArray(c.awareness) && c.awareness.length === 3 && c.awareness.every(v => text(v, 200))
    && Array.isArray(c.members) && c.members.length === 6 && c.members.every((v, i) => v?.name === people[i] && text(v.role, 100))
    && Array.isArray(c.speeches) && c.speeches.length === 6 && c.speeches.every((v, i) => v?.name === people[i] && text(v.topic, 100) && text(v.text, 2000))
    && !!c.residues && residueKeys.every(k => c.residues[k] === null || (Number.isInteger(c.residues[k]) && c.residues[k]! >= 0 && c.residues[k]! <= 1000000));
}
export function chartRows(content: Content) {
  return residueKeys.map((key, i) => ({ name: residueLabels[i], value: content.residues[key] }));
}
export class ConflictError extends Error { constructor() { super('O conteúdo mudou enquanto você editava. Carregue a versão mais recente antes de salvar.'); this.name = 'ConflictError'; } }
export function assertVersion(actual: number, expected: number) { if (actual !== expected) throw new ConflictError(); }
export function formatDate(time: number | null) { return time ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(time) : 'Ainda não publicado'; }
