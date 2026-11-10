# SALA LIMPA — publicação

- **Site:** https://paulo2588841.github.io/sala-limpa/
- **Painel:** https://paulo2588841.github.io/sala-limpa/#/admin
- **Código:** https://github.com/paulo2588841/sala-limpa
- **Primeira publicação aprovada:** https://github.com/paulo2588841/sala-limpa/actions/runs/42738908838
- **Projeto Firebase:** `sala-limpa-10-32aef5`

O GitHub Actions executou instalação, testes de componentes, testes das regras no emulador, compilação e publicação com sucesso. O site publicado respondeu HTTP 200, exibiu **Sincronizado**, abriu a tela de login e foi conferido em largura móvel de 390 px sem rolagem horizontal ou erros JavaScript.

O Firestore real recebeu o conteúdo inicial e o entregou por `onSnapshot` a dois visitantes sem login. A escrita anônima e o acesso público ao histórico foram negados. As cinco contagens continuam não informadas, aguardando a pesquisa.

As contas Authentication e os documentos `admins/{UID}` de **Paulo e Maria** foram criados manualmente pelo responsável. As duas permissões foram conferidas no banco, com nome correto e `active` booleano verdadeiro, e o responsável confirmou o login de cada conta no painel. A publicação inicial de Paulo foi confirmada no Firestore real, na versão 1. O guia [ATIVAR_ADMINISTRADORES.md](ATIVAR_ADMINISTRADORES.md) fica como referência para manutenção ou reinstalação.

Os domínios `paulo2588841.github.io`, `localhost` e `127.0.0.1` foram autorizados e a configuração foi relida para confirmação, preservando os domínios existentes. Os testes completos de edição, bloqueio, perda de conexão e restauração com duas contas foram aprovados nos emuladores. A edição simultânea em dois dispositivos físicos na rede da escola ainda não foi exercitada.

As alterações feitas pelo painel são publicadas diretamente no Firestore e não exigem outro deploy. Alterações no código da branch `main` executam o workflow automaticamente.
