import { describe, expect, it, vi } from 'vitest';
import { withContentionRetry } from '../src/transactions';
import { ConflictError } from '../src/content';
describe('Concorrência de transações', () => {
  it('relê o estado em uma transação nova após disputa no servidor', async () => { const action = vi.fn().mockRejectedValueOnce({code:'permission-denied'}).mockResolvedValue('salvo'); expect(await withContentionRetry(action)).toBe('salvo'); expect(action).toHaveBeenCalledTimes(2); });
  it('não tenta sobrescrever um conflito de revisão', async () => { const action=vi.fn().mockRejectedValue(new ConflictError()); await expect(withContentionRetry(action)).rejects.toThrow(ConflictError); expect(action).toHaveBeenCalledTimes(1); });
  it('limita novas tentativas e preserva a negativa de permissão', async () => { const error={code:'permission-denied'}; const action=vi.fn().mockRejectedValue(error); await expect(withContentionRetry(action)).rejects.toBe(error); expect(action).toHaveBeenCalledTimes(4); });
});
