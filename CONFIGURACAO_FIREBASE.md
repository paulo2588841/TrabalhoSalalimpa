# Configuração do Firebase — TrabalhoSalalimpa 1.0

**Este exemplar já tem o projeto real `sala-limpa-10-32aef5`, app Web, banco, regras, domínios autorizados e provedor de e-mail/senha configurados. Paulo e Maria já têm permissões ativas e confirmaram o acesso ao painel.** O guia [ATIVAR_ADMINISTRADORES.md](ATIVAR_ADMINISTRADORES.md) documenta a manutenção dos acessos. As etapas abaixo permanecem como referência para recriar a configuração em outro projeto.

Esta etapa é feita pelo responsável pelo projeto. O repositório identifica o projeto Firebase e contém sua configuração de publicação, mas não contém senhas de contas, chaves privadas ou tokens administrativos. A configuração pública do SDK está nas variáveis do GitHub Actions e, neste computador, no arquivo ignorado `.env.local`. Firestore também fornece os indicadores de edição; não é necessário Realtime Database.

## 1. Criar o projeto e o app Web

Abra o [Firebase Console](https://console.firebase.google.com/), escolha “Adicionar projeto”, informe o nome e conclua o assistente. Google Analytics é opcional e não é usado neste site. Registre um app Web (`</>`), copie a configuração pública exibida e guarde o **Project ID**. Firebase Hosting não é necessário para GitHub Pages.

## 2. Habilitar autenticação

Em **Build → Authentication → Get started → Sign-in method**, habilite **Email/Password**. O site usa somente e-mail e senha, sem link por e-mail ou provedores sociais.

## 3. Criar as duas contas independentes

Em **Authentication → Users → Add user**, crie uma conta para Paulo e outra para Maria, cada uma com e-mail e senha próprios. O responsável escolhe e comunica esses dados fora do repositório. Copie o **UID** de cada usuário; ele é diferente do e-mail. Não compartilhe a mesma conta.

Não há formulário de cadastro no portal. Criar uma conta Firebase por qualquer outro meio não concede edição: somente os documentos administrativos abaixo autorizam a escrita.

## 4. Criar o Firestore

Em **Build → Firestore Database → Create database**, selecione a edição Standard, a localização desejada e **modo de produção**. Não use regras abertas de teste. Este app utiliza o banco `(default)`. A localização não pode ser trocada depois; escolha uma apropriada à escola.

## 5. Publicar as regras

Abra **Firestore → Rules**, substitua todo o conteúdo por `firestore.rules` e clique em **Publish**. Alternativamente, na pasta do projeto:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project SEU_PROJECT_ID
```

As regras negam tudo fora dos caminhos previstos, validam tipos, limites, nomes, autor e horário do servidor, e obrigam o histórico a ser criado junto da publicação. Permissões administrativas não podem ser criadas nem alteradas pelo frontend. Firebase Console/Admin SDK usa autorização do responsável e não passa pelas regras de clientes.

## 6. Autorizar os dois UIDs manualmente

Em **Firestore → Data**, crie a coleção `admins`. Para cada conta, use o UID exato como **ID do documento**:

| Documento | Campo | Tipo | Valor |
| --- | --- | --- | --- |
| `admins/UID_DO_PAULO` | `name` | string | `Paulo` |
| `admins/UID_DO_PAULO` | `active` | boolean | `true` |
| `admins/UID_DA_MARIA` | `name` | string | `Maria` |
| `admins/UID_DA_MARIA` | `active` | boolean | `true` |

Não inclua e-mail nem senha nesses documentos. O nome é usado na assinatura pública da edição. Para revogar o acesso, altere `active` para `false` ou remova o documento pelo Console. As regras verificam novamente a permissão em cada operação.

## 7. Inserir o documento inicial de conteúdo

Depois de preencher as variáveis da próxima etapa, abra o portal, entre em **Área do grupo** com Paulo ou Maria e clique em **Publicar conteúdo inicial**. Essa operação cria `published/content` e o primeiro documento `history/{id}` na mesma transação. Não há números demonstrativos: as cinco contagens começam como `null`.

Esse é o caminho recomendado para inserir o documento completo sem digitar dezenas de campos no Console. Se preferir inserção manual pelo Console, o arquivo `content.initial.json` contém os campos e valores iniciais. Crie `published/content` com mapas, listas e números correspondentes; `updatedAt` deve ser um **timestamp**, `version` deve ser o número inteiro `0`, `schemaVersion` o número `1`, `speechVersions` o mapa de seis zeros e `historyId` a string `initial-console`. O Console não importa esse JSON automaticamente: ele é uma referência de estrutura. Não cole o JSON inteiro em um campo string. A primeira gravação pelo painel transforma essa configuração em versão 1 com horário de servidor e histórico.

Até existir o documento, os visitantes veem os textos padrão com “Aguardando publicação”, sem alegação de sincronização. Os indicadores `editing/{0..5}` e o histórico são criados pelo app quando usados.

## 8. Preencher o ambiente

Copie `.env.example` para `.env.local` e preencha com a configuração do **app Web deste mesmo projeto**:

```dotenv
VITE_FIREBASE_API_KEY=valor_da_configuracao_web
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=valor_da_configuracao_web
VITE_FIREBASE_MESSAGING_SENDER_ID=valor_da_configuracao_web
VITE_FIREBASE_APP_ID=valor_da_configuracao_web
VITE_BASE_PATH=/
VITE_USE_FIREBASE_EMULATORS=false
```

Reinicie `npm run dev`. Em GitHub Actions, cadastre os mesmos seis campos Firebase como **Variables** do repositório, sem aspas externas. A API key do SDK Web identifica o projeto e é enviada ao navegador por definição; ela não substitui autenticação ou regras. Nunca use chave de conta de serviço, senha ou token privado com prefixo `VITE_`.

## 9. Configurar os domínios

Em **Authentication → Settings → Authorized domains**, adicione `SEU_USUARIO.github.io`, o domínio próprio se houver e `localhost`/`127.0.0.1` para desenvolvimento. Use apenas o hostname, sem protocolo, porta ou caminho do repositório. Projetos novos podem não incluir `localhost` automaticamente; confira a [orientação oficial](https://firebase.google.com/docs/auth/faq-and-troubleshooting).

Se houver restrições HTTP da API key no Google Cloud Console, elas também precisam permitir as origens usadas. Mantenha `authDomain` com o valor fornecido pelo Firebase; ele não é o endereço do GitHub Pages.

## 10. Testar em dois dispositivos

1. Publique o site, abra-o no computador e no celular e confirme que ambos exibem “Sincronizado”. Uma janela sem login deve poder ler os dados.
2. Entre como Paulo no computador e como Maria em outro navegador/dispositivo. Na janela pública, mantenha aberta a seção de apresentação.
3. Em Paulo, escolha uma fala e clique “Editar ao vivo”. Os outros veem “Paulo está editando…” e a borda destacada. Digite, pare por pelo menos 550 ms e observe o novo texto sem recarregar.
4. Maria deve ficar impedida de editar a mesma fala. Ela pode editar outra; as duas alterações devem ser preservadas.
5. Conclua a edição. O indicador some. Em **Histórico de versões**, confira nome, horário e conteúdo; restaure uma versão e confirme a nova versão criada.
6. Simule perda de conexão. Digite na fala já aberta: o texto deve ficar pendente, sem “Salvo”. Reconecte e use “Tentar sincronizar” se houver erro. Se uma revisão nova existir, o app deve pedir revisão do rascunho, sem sobrescrever.
7. Feche abruptamente a aba editora. Em até 30 segundos sem renovação, o bloqueio expira. O tempo depende da conexão e do relógio do dispositivo.
8. Faça login com uma conta sem documento administrativo. Acesso de edição deve ser negado. Os testes automatizados também tentam escrita direta no banco.

## Emuladores locais

```sh
npm run test:rules
```

Esse comando não pede login Firebase nem usa produção. Para testar a interface inteira contra emuladores, configure o SDK para um projeto `demo-sala-limpa`, ative `VITE_USE_FIREBASE_EMULATORS=true` e rode:

```sh
npx firebase emulators:start --project demo-sala-limpa --only auth,firestore
```

Na UI de emuladores (`http://127.0.0.1:4000`), crie duas contas de teste e seus documentos `admins`. Inicie o Vite em outra janela. Use chaves fictícias apenas com emuladores e nunca publique esse ambiente. Emuladores de interface estão limitados a localhost neste código; o celular deve usar o projeto real publicado para o teste entre dispositivos.

## Operação e limites

- Cada pausa que salva uma fala gera uma escrita de conteúdo e uma de histórico; cada renovação gera uma escrita de bloqueio. Leitores de conteúdo e de presença também consomem leituras. Consulte o uso no Console; o histórico não é apagado automaticamente.
- A janela de edição, e não uma tecla isolada, determina a presença. Não há detector de cursor nem editor de caracteres simultâneos na mesma fala: o bloqueio protege o texto.
- Bloqueios são renovados enquanto o editor fica aberto; abas suspensas podem perder a reserva. Transações e revisões continuam a impedir sobrescritas.
- Não há fila de transações offline. Rascunhos da fala ficam na aba e são recuperáveis; textos gerais não salvos ficam na memória e têm aviso antes de sair.
- Somente o responsável pode configurar o serviço real e publicar as regras. Nenhuma configuração sensível é necessária no código-fonte.
