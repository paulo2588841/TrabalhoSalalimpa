import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';
import { StoreProvider } from '../src/store';
describe('Experiência pública e prévia local', () => {
  it('mostra os nomes corretos, falas e ausência de pesquisa', () => {
    location.hash = ''; render(<StoreProvider><App /></StoreProvider>);
    expect(screen.getByText('Dados da pesquisa ainda não informados')).toBeInTheDocument();
    expect(screen.getAllByText('Victor')).toHaveLength(2);
    expect(screen.getByText(/Modo demonstrativo local/)).toBeInTheDocument();
    expect(screen.queryByText('Sincronizado')).not.toBeInTheDocument();
  });
  it('navega pelas seis falas na apresentação', async () => {
    render(<StoreProvider><App /></StoreProvider>); fireEvent.click(screen.getByRole('button', { name: /Iniciar apresentação/ }));
    const next = await screen.findByRole('button', { name: 'Próxima' });
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    for (let i = 0; i < 5; i++) fireEvent.click(next);
    expect(next).toBeDisabled(); expect(screen.getByRole('heading', { name: /^Iohana\s*\.$/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' }); expect(screen.getByRole('heading', { name: /^Lucas\s*\.$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sair da apresentação' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('edita conteúdo na prévia e publica apenas na sessão', async () => {
    location.hash = '#/admin'; render(<StoreProvider><App /></StoreProvider>);
    fireEvent.click(await screen.findByRole('button', { name: /Explorar prévia local/ }));
    fireEvent.change(screen.getByLabelText('Subtítulo'), { target: { value: 'Texto revisado pelo grupo' } });
    expect(screen.getByText('Alterações gerais não salvas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar conteúdo inicial' }));
    await waitFor(() => expect(screen.getByText(/Nenhum dado foi enviado ao Firebase/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Papéis'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(screen.getByText('Textos gerais atualizados')).toBeInTheDocument());
    location.hash = ''; window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(await screen.findByText('Texto revisado pelo grupo')).toBeInTheDocument();
    fireEvent.click(await screen.findByText('Ver dados em tabela acessível'));
    expect(await screen.findByRole('cell', { name: '12' })).toBeInTheDocument();
  });
});
