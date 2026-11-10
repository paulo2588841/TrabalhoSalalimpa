// Em uma disputa pelo documento, o emulador pode avaliar as regras de versão
// antes de devolver ABORTED. Uma nova transação relê o estado e mantém todas
// as verificações de revisão, autorização e bloqueio; nenhuma regra é contornada.
export async function withContentionRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await operation(); }
    catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt >= 3 || !['permission-denied', 'firestore/permission-denied', 'aborted'].includes(code ?? '')) throw error;
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}
