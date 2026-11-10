import { describe, expect, it } from 'vitest';
import { assertVersion, chartRows, ConflictError, defaultContent, formatDate, validateContent } from '../src/content';
describe('Conteúdo público', () => {
  it('preserva seis integrantes e a grafia Victor', () => { expect(validateContent(defaultContent)).toBe(true); expect(defaultContent.members.map(m => m.name)).toEqual(['Paulo','Maria','Brenda','Victor','Lucas','Iohana']); expect(defaultContent.speeches[3].name).toBe('Victor'); });
  it('não contém dados de pesquisa inventados', () => { expect(chartRows(defaultContent).every(row => row.value === null)).toBe(true); });
  it('distingue zero de valor não informado', () => { const c = structuredClone(defaultContent); c.residues.papers = 0; expect(validateContent(c)).toBe(true); expect(chartRows(c)[0].value).toBe(0); expect(chartRows(c)[1].value).toBeNull(); });
  it.each([-1, 1.5, 1000001, NaN])('rejeita número inválido %s', value => { const c = structuredClone(defaultContent); c.residues.papers = value; expect(validateContent(c)).toBe(false); });
  it('rejeita campos e falas inválidos', () => { const c = structuredClone(defaultContent); c.speeches[0].text = '  '; expect(validateContent(c)).toBe(false); expect(validateContent(null)).toBe(false); expect(validateContent({})).toBe(false); });
  it('bloqueia uma versão desatualizada', () => { expect(() => assertVersion(2, 1)).toThrow(ConflictError); expect(() => assertVersion(2, 2)).not.toThrow(); });
  it('formata horário em São Paulo e estado inicial', () => { expect(formatDate(null)).toBe('Ainda não publicado'); expect(formatDate(Date.UTC(2026, 0, 1, 15))).toContain('12:00'); });
});
