# Ativar Paulo e Maria — SALA LIMPA

O projeto Firebase `sala-limpa-10-32aef5` já foi criado. O banco Standard em São Paulo, as regras e o login por e-mail e senha estão configurados. O conteúdo inicial já está publicado, com as cinco contagens ainda não informadas.

**Estado desta entrega:** Paulo e Maria já têm contas e permissões ativas; o responsável confirmou o login dos dois no painel. Paulo publicou a primeira versão do conteúdo. Os três domínios indicados abaixo também já foram autorizados e conferidos. As instruções seguintes são uma referência para manutenção ou configuração de outro projeto; não recrie contas nem permissões que já existem.

As contas do painel são próprias do site. O login Google usado para configurar o Firebase identifica o responsável pelo projeto.

## 1. Criar as duas contas

Abra [Authentication → Users](https://console.firebase.google.com/project/sala-limpa-10-32aef5/authentication/users).

1. Clique **Adicionar usuário / Add user**.
2. Crie a conta de **Paulo** com o e-mail escolhido e uma senha própria.
3. Repita para **Maria**, usando outro e-mail e outra senha.
4. Copie o **UID** de cada conta na lista de usuários. As senhas são definidas diretamente no Console.

## 2. Autorizar cada UID

Abra [Cloud Firestore](https://console.firebase.google.com/project/sala-limpa-10-32aef5/firestore), entre na aba **Dados / Data** e crie a coleção `admins`.

Crie dois documentos, usando o **UID exato de Authentication** como ID de cada documento:

| ID do documento | Campo | Tipo | Valor |
| --- | --- | --- | --- |
| UID de Paulo | `name` | string | `Paulo` |
| UID de Paulo | `active` | boolean | `true` |
| UID de Maria | `name` | string | `Maria` |
| UID de Maria | `active` | boolean | `true` |

O campo `active` é booleano, não o texto `"true"`. Use o UID do usuário, não o e-mail, como ID. Esses documentos concedem os mesmos privilégios aos dois.

## 3. Autorizar os domínios do site

Em [Authentication → Settings](https://console.firebase.google.com/project/sala-limpa-10-32aef5/authentication/settings), abra **Authorized domains / Domínios autorizados** e adicione os que ainda não estiverem presentes:

```text
paulo2588841.github.io
localhost
127.0.0.1
```

Digite somente os hostnames, sem `https://`, porta ou `/sala-limpa/`.

## 4. Entrar no painel

Depois de a publicação terminar, abra [a área do grupo](https://paulo2588841.github.io/sala-limpa/#/admin) e entre com o e-mail e a senha criados para Paulo ou Maria.

Na primeira edição, o botão **Publicar conteúdo inicial** registra a primeira versão do histórico com a autoria da conta conectada. Depois escolha uma fala, clique **Editar ao vivo**, altere o texto e pause por pelo menos 550 ms. Outra janela sem login deve receber o texto automaticamente.

O responsável pode revogar um administrador alterando `active` para `false` no Console. Nenhum visitante pode criar sua própria autorização pelo site.
