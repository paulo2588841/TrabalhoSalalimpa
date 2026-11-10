# SALA LIMPA 1.0

Portal escolar sobre o cuidado com as salas do Ensino Fundamental. React, TypeScript, Vite, Tailwind CSS, Lucide, Recharts, Firebase Authentication e Firestore. Os nomes e as seis falas foram fornecidos pelo grupo; **Victor** é a grafia correta. Nenhum resultado de pesquisa é inventado.

Este exemplar está conectado ao projeto Firebase `sala-limpa-10-32aef5`. O repositório é [paulo2588841/sala-limpa](https://github.com/paulo2588841/sala-limpa), e o endereço de publicação do workflow é [paulo2588841.github.io/sala-limpa](https://paulo2588841.github.io/sala-limpa/). Paulo e Maria já têm acesso ativo ao painel, com login confirmado pelo responsável. O guia [ATIVAR_ADMINISTRADORES.md](ATIVAR_ADMINISTRADORES.md) documenta a manutenção dessas permissões.

A [primeira publicação foi concluída e verificada](PUBLICACAO.md). O site usa o Firebase real; o comando `npm run demo` mantém uma prévia independente para testes locais.

## Rodar localmente

Requer Node.js 22.12+ e npm. Para os testes de regras, instale Java 21+.

```sh
cd sala-limpa
npm install
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://127.0.0.1:5173/`. No Windows deste workspace, você também pode abrir `INICIAR.cmd` ou executar `INICIAR.ps1`; ambos encontram o runtime Node fornecido pelo Codex quando necessário.

Sem `.env.local`, o portal inicia em **Demonstração local**, explicitamente identificada. Em “Área do grupo”, explore os editores locais. Alterações existem somente na sessão atual e somem ao recarregar. Nenhum login, presença, histórico remoto ou sincronização entre dispositivos é simulado.

Para habilitar o serviço real, siga [CONFIGURACAO_FIREBASE.md](CONFIGURACAO_FIREBASE.md), copie `.env.example` para `.env.local` e reinicie o Vite. As contas e os documentos de autorização devem ser criados pelo responsável no Firebase Console. Não existe cadastro público.

## Recursos

- Portal responsivo com fontes locais, ilustração SVG original, teclado, foco visível e movimento reduzido.
- Pesquisa inicialmente vazia. Zero é diferente de “não informado”; categorias sem valor não geram barras. Tabela alternativa acessível.
- Cards dos seis integrantes e apresentação com letras grandes, setas do teclado e opção de tela cheia.
- Login individual de Paulo e Maria e autorização por UID nas regras do banco.
- Textos gerais, funções, mensagens e números com botão de salvar e indicação de rascunho.
- **Falas colaborativas**: debounce de 550 ms, indicador de edição, destaque público e bloqueio temporário por fala. Pessoas sem login acompanham com `onSnapshot`.
- Histórico atômico de cada gravação, com restauração e autoria/horário. A interface mostra as últimas 30 versões.
- Conflitos, erros e perda de conexão explícitos; rascunhos pendentes de fala ficam no `sessionStorage` da aba, separados por projeto, UID e fala.

## Como a colaboração funciona

1. Um administrador escolhe “Editar ao vivo”. Uma transação adquire `editing/{0..5}` por 30 segundos, renovados a cada 10 segundos enquanto o editor estiver aberto.
2. A outra sessão não pode adquirir a mesma fala enquanto o bloqueio estiver válido. Falas diferentes podem ser editadas simultaneamente.
3. Após 550 ms de pausa, uma transação lê a versão atual, verifica a revisão da fala e o bloqueio, altera só a fala selecionada e grava uma cópia integral no histórico.
4. Os visitantes recebem a nova versão via Firestore. Durante a edição, a fala recebe borda verde e o nome de quem edita. O texto ainda pendente no painel usa fundo âmbar; o público vê o último texto confirmado pelo banco.
5. O botão “Concluir edição” aguarda o salvamento antes de liberar o bloqueio. Se a aba fechar abruptamente, o bloqueio expira. Não há promessa de presença exata no instante do fechamento.

As gravações são serializadas na mesma sessão. Uma nova revisão de outra sessão gera erro em vez de sobrescrever. Na perda de conexão, as transações não gravam offline: a interface preserva o rascunho e oferece reconectar, copiar ou carregar o texto atual. Não feche a aba antes de resolver o rascunho; `sessionStorage` não é um backup permanente. Relógio local muito incorreto pode impedir o bloqueio, mas as regras usam o horário do servidor e não permitem estender uma reserva indefinidamente.

Os textos gerais usam salvamento explícito; edições remotas das falas são preservadas. Se os textos gerais mudarem enquanto você os edita, é necessário carregar a versão atual. A restauração do histórico ou dos padrões adquire todos os bloqueios de fala necessários e publica em uma única transação. Uma fala que esteja em edição em outra sessão impede a restauração integral.

## Estrutura do banco

| Caminho | Leitura | Escrita |
| --- | --- | --- |
| `published/content` | Qualquer visitante, apenas este documento | UIDs autorizados, com validação, versão e histórico atômico |
| `admins/{uid}` | Apenas a própria conta autenticada | Apenas responsável pelo Console/Admin SDK |
| `editing/{0..5}` | Qualquer visitante | Administrador, com expiração máxima validada |
| `history/{id}` | Administradores | Criação na mesma transação da publicação; imutável pelo cliente |
| Demais caminhos | Negada | Negada |

`content` contém hero, três mensagens, seis membros, seis falas e cinco contagens. `version` controla o documento, `speechVersions.s0..s5` controla as falas e `historyId` vincula a versão ao registro imutável. Não coloque dados pessoais ou privados em documentos públicos.

## Validação

```sh
npm test
npm run build
npm run test:rules
```

Para repetir a verificação em navegador, inicie `npm run demo` em outra janela, execute `npx playwright install chromium` uma vez e rode `npm run test:browser`. Esse modo permite testar a prévia sem se conectar ao projeto real configurado em `.env.local`. A verificação gera capturas e relatório em `qa/` (ignorado pelo Git). Também é possível indicar um navegador já instalado com `QA_BROWSER_PATH` e outra URL com `QA_URL`.

O último comando inicia um emulador isolado com ID `demo-sala-limpa`, sem usar um projeto de produção. Requer Java 21+ e acesso de rede para baixar o emulador na primeira execução. Os testes exercitam permissões, bloqueios, validação, histórico, concorrência e uma atualização `onSnapshot` real entre clientes do emulador.

Para a integração completa da interface com duas contas e um visitante, execute `npm run test:live` (emuladores de Auth e Firestore, sem projeto de produção). Instale o Chromium do Playwright antes ou indique `QA_BROWSER_PATH`. Feche outras instâncias dos emuladores nas portas 8080/9099 antes desses comandos. O teste cria somente contas temporárias no emulador e encerra o servidor Vite que iniciar.

A auditoria de produção pode ser repetida com `npm audit --omit=dev`. O projeto fixa uma versão corrigida de `@grpc/grpc-js` por `overrides`; o arquivo de lock mantém a instalação reproduzível.

Veja [RELATORIO_TESTES.md](RELATORIO_TESTES.md) para resultados realmente executados e limites. Testes contra emuladores não substituem a verificação final com as duas contas no projeto Firebase do responsável.

## Publicar no GitHub Pages

O [workflow](.github/workflows/deploy.yml) testa e publica a branch `main`. Em **Settings → Pages**, escolha **GitHub Actions**. Cadastre as seis variáveis `VITE_FIREBASE_*` em **Settings → Secrets and variables → Actions → Variables**. Esses identificadores públicos do SDK não são credenciais administrativas.

Com GitHub CLI instalado e autenticado, execute a partir desta pasta:

```sh
git init -b main
git add .
git commit -m "feat: SALA LIMPA 1.0 com edição colaborativa"
gh auth login
gh repo create sala-limpa --public --source=. --remote=origin
gh api --method POST repos/{owner}/sala-limpa/pages -f build_type=workflow
git push -u origin main
gh run watch
```

Se Pages já estiver habilitado, pule o comando `gh api .../pages`. Para publicar em repositório existente, use `git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git` no lugar de `gh repo create`. A URL é `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`.

O workflow calcula automaticamente `VITE_BASE_PATH` a partir do nome real do repositório. Para domínio próprio, troque o cálculo por `/` e configure o domínio em Pages. O painel usa rota de hash `#/admin`, compatível com Pages sem regras de reescrita.

**Alterações de conteúdo não exigem deploy:** são publicadas diretamente no Firestore. Mudanças de código ou de configuração `VITE_*` exigem novo build/deploy. Publique as regras separadamente com `npx firebase deploy --only firestore:rules --project SEU_PROJECT_ID`; GitHub Pages não publica regras do Firebase.

## Referências oficiais

- [Vite e GitHub Pages](https://vite.dev/guide/static-deploy#github-pages)
- [Transações no Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Validação nas regras de segurança](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Testes com emulador](https://firebase.google.com/docs/rules/unit-tests)
