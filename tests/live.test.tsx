import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { initialPublished } from '../src/content';
const mock = vi.hoisted(() => ({ store: {} as Record<string, unknown>, save: vi.fn(), lease: vi.fn() }));
vi.mock('../src/store', () => ({ useStore: () => mock.store }));
import LiveEditor, { DEBOUNCE_MS } from '../src/LiveEditor';
describe('Edição ao vivo', () => {
  beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); mock.save.mockReset().mockResolvedValue(undefined); mock.lease.mockReset().mockResolvedValue(undefined); mock.store = { published: { ...structuredClone(initialPublished), version: 1 }, editing: {}, admin: { uid: 'paulo', name: 'Paulo' }, sessionId: 'tab', status: 'synced', lease: mock.lease, saveSpeech: mock.save }; });
  afterEach(() => vi.useRealTimers());
  async function open() { render(<LiveEditor index={0} />); await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Editar ao vivo' }))); }
  it('agrupa teclas por 550 ms e salva a última versão', async () => {
    await open(); const input = screen.getByLabelText('Texto da fala');
    fireEvent.change(input, { target: { value: 'Primeira alteração' } });
    await act(async () => vi.advanceTimersByTimeAsync(400)); expect(mock.save).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Texto final revisado' } });
    await act(async () => vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1)); expect(mock.save).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(mock.save).toHaveBeenCalledTimes(1); expect(mock.save).toHaveBeenCalledWith(0, expect.objectContaining({ text: 'Texto final revisado' }), 0);
    expect(screen.getByText('Salvo')).toBeInTheDocument();
  });
  it('preserva alterações pendentes quando a transação falha', async () => {
    mock.save.mockRejectedValue(new Error('Sem conexão.')); await open();
    fireEvent.change(screen.getByLabelText('Texto da fala'), { target: { value: 'Rascunho offline' } });
    await act(async () => vi.advanceTimersByTimeAsync(550));
    expect(screen.getByText('Sem conexão.')).toBeInTheDocument(); expect(screen.getByDisplayValue('Rascunho offline')).toBeInTheDocument();
    expect(sessionStorage.length).toBe(1); expect(screen.getByRole('button', { name: 'Tentar sincronizar' })).toBeInTheDocument();
  });
  it('bloqueia edição quando Maria possui a fala', () => {
    mock.store.editing = { 0: { uid: 'maria', name: 'Maria', sessionId: 'outra-aba', expiresAt: Date.now() + 20000 } };
    render(<LiveEditor index={0} />); expect(screen.getByRole('button', { name: /Maria está editando/ })).toBeDisabled();
  });
});
