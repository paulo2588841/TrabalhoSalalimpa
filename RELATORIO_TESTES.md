# Relatório de entrega — SALA LIMPA 1.0

Verificação realizada em 9 de novembro de 2026, em Windows, com Node.js 24.22.1, npm 11.6.2, Java 27 e Microsoft Edge em execução automatizada sem janela. O projeto está em `E:\TRABALHO\sala-limpa`.

## Resultado implementado

Portal público, gráfico e tabela acessível, seis integrantes e falas com **Victor** corrigido, apresentação com navegação, prévia local identificada, Firebase Authentication, Firestore com `onSnapshot`, painel administrativo, edição colaborativa com pausa de 550 ms, bloqueio de fala, rascunhos pendentes, controle de versões e histórico restaurável. O workflow de GitHub Pages e o guia de configuração estão incluídos.

## Verificações executadas

| Verificação | Resultado observado |
| --- | --- |
| Instalação com npm | Concluída; `package-lock.json` gerado e atualizado |
| `npm run build` | TypeScript sem erros e compilação Vite concluída |
| Build com `VITE_BASE_PATH=/sala-limpa/` | Base de GitHub Pages e seis referências de assets verificadas; build local com `/` restaurado depois |
| `npm test` | **19 testes passaram**, em quatro arquivos |
| `vitest run --config vitest.rules.config.ts` | **15 testes passaram**, com Firestore Emulator ativo |
| `scripts/browser-qa.mjs` | Passou em **1440, 768, 390 e 320 px**, sem rolagem horizontal e sem erros JavaScript |
| Auditoria axe no portal e painel | **Nenhuma violação reportada** nas regras automáticas WCAG 2 A/AA e 2.1 AA selecionadas |
| `scripts/live-qa.mjs` | Integração completa aprovada com Auth e Firestore emulados e três contextos independentes do navegador |
| `npm audit --omit=dev` | **0 vulnerabilidades reportadas** nas dependências de produção |
| Firestore real, projeto `sala-limpa-10-32aef5` | Dois visitantes anônimos receberam o conteúdo inicial por `onSnapshot`; escrita anônima e leitura do histórico negadas |
| Authentication real | Provedor de e-mail/senha confirmado com tentativa de login de teste sem criação de usuário |
| GitHub Actions | Instalação, testes, regras, build e deploy aprovados na execução [42738908838](https://github.com/paulo2588841/sala-limpa/actions/runs/42738908838) |
| Site publicado | HTTP 200, Firebase sincronizado, tela de login disponível e largura móvel de 390 px sem rolagem horizontal ou erros JavaScript |

Neste ambiente o npm foi executado pela sua CLI local em `.tools/package/bin/npm-cli.js`, pois o executável npm não estava no PATH. Os scripts do projeto continuam sendo os comandos npm convencionais. Os emuladores foram iniciados pela Firebase CLI; na rodada final os testes foram executados contra os serviços já ativos. Os comandos `npm run test:rules` e `npm run test:live` incluem essa inicialização para repetição em outro computador.

### O que foi exercitado

- Conteúdo padrão completo, ausência de resultados inventados, diferença entre zero e não informado, limites numéricos e grafia dos nomes.
- Edição na prévia, gráfico com valores cadastrados, tabela, menu móvel, apresentação, limites das seis falas, setas do teclado, fechamento e preferência por movimento reduzido.
- Agrupamento de teclas por 550 ms, preservação de rascunho após falha, exclusão de edição simultânea da mesma fala e novas tentativas limitadas após disputa de gravação.
- Leitura pública somente nos caminhos permitidos, negativa de escrita anônima, negativa de autoautorização, proibição de alterar administradores pelo cliente, revogação e validação de campos.
- Histórico atômico e imutável pelo cliente, bloqueio expirado, versões antigas rejeitadas, falas diferentes gravadas em paralelo e restauração das seis falas na mesma transação.
- Na interface: login individual de Paulo e Maria, publicação inicial, atualização ao visitante sem login, presença, bloqueio, edição de falas distintas, perda de rede simulada pelo navegador, recuperação e restauração de versão.

Os testes revelaram e permitiram corrigir rolagem causada por ornamentos, contrastes insuficientes, excesso de expressões nas regras e disputa entre transações. A validação das regras é dividida entre publicação e histórico idêntico, ambos obrigatórios na mesma transação, e evita revalidar dados que permaneceram iguais. Cada nova tentativa de gravação relê o banco e mantém as verificações de revisão, UID e bloqueio.

Os relatórios locais de navegador e integração estão em `qa/browser-report.json` e `qa/live-report.json`, com capturas na mesma pasta. Essa pasta é ignorada pelo Git. Os testes e os scripts para reproduzi-los fazem parte do projeto entregue.

## Limites e etapas manuais

1. **Firebase de produção configurado.** Projeto `sala-limpa-10-32aef5`, app Web, banco Standard em `southamerica-east1`, regras e provedor de e-mail/senha foram criados. O banco confirmou cota gratuita elegível e atualizações em tempo real habilitadas. O faturamento não foi vinculado. As contas de Paulo e Maria e seus documentos `admins/{uid}` ficam para criação manual no Console, conforme solicitado; o passo a passo está em `ATIVAR_ADMINISTRADORES.md`.
2. **GitHub Pages publicado e verificado.** O repositório público `paulo2588841/sala-limpa` recebeu o código, as seis variáveis Firebase foram cadastradas e o workflow concluiu build e deploy com sucesso. O endereço é `https://paulo2588841.github.io/sala-limpa/`. As atualizações seguintes podem ser acompanhadas na aba Actions.
3. A integração completa das duas contas foi verificada nos emuladores. No Firebase de produção, foram verificados leitura pública por dois clientes, `onSnapshot`, bloqueio de escrita anônima, proteção do histórico e disponibilidade do provedor de senha. **O login dos administradores reais e dois dispositivos físicos ainda dependem da criação manual das contas e da conferência na escola.**
4. A auditoria completa do npm ainda reporta **14 alertas moderados em dependências de desenvolvimento transitivas**. Não há alertas altos ou críticos após a atualização aplicada, e a auditoria de produção retornou zero. Não foi feito downgrade automático de ferramentas nem aplicado `audit fix --force`.
5. A verificação de acessibilidade automática não equivale a uma auditoria manual completa com leitores de tela. A apresentação foi testada como diálogo ocupando o viewport; a API de tela cheia exclusiva do navegador não foi exercitada automaticamente.
6. Não há transações offline: rascunhos de fala ficam no armazenamento da aba; o público vê o último texto confirmado. Bloqueios duram 30 segundos sem renovação e dependem do relógio do dispositivo para solicitar a reserva, com limites impostos pelo servidor.
7. O histórico mostra as 30 versões mais recentes, mas não apaga versões antigas automaticamente. Gravações e ouvintes consomem a cota do Firestore; o responsável acompanha o uso no Console.

## Como abrir e publicar

Para desenvolvimento: `npm install` e `npm run dev`. Para servir a compilação: `npm run build` e `npm run preview`. Abra a URL informada pelo Vite. Neste workspace também há `INICIAR.cmd` e `INICIAR.ps1`.

O painel usa `#/admin`, compatível com GitHub Pages. A base é configurável por `VITE_BASE_PATH`, e o workflow calcula o nome real do repositório. Depois de o Firebase estar configurado, alterações de conteúdo são recebidas pelo banco sem recompilar ou republicar o site.
