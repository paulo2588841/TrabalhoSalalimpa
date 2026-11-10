# SALA LIMPA — publicação

- **Site:** https://paulo2588841.github.io/sala-limpa/
- **Painel:** https://paulo2588841.github.io/sala-limpa/#/admin
- **Código:** https://github.com/paulo2588841/sala-limpa
- **Primeira publicação aprovada:** https://github.com/paulo2588841/sala-limpa/actions/runs/42738908838
- **Projeto Firebase:** `sala-limpa-10-32aef5`

O GitHub Actions executou instalação, testes de componentes, testes das regras no emulador, compilação e publicação com sucesso. O site publicado respondeu HTTP 200, exibiu **Sincronizado**, abriu a tela de login e foi conferido em largura móvel de 390 px sem rolagem horizontal ou erros JavaScript.

O Firestore real recebeu o conteúdo inicial e o entregou por `onSnapshot` a dois visitantes sem login. A escrita anônima e o acesso público ao histórico foram negados. As cinco contagens continuam não informadas, aguardando a pesquisa.

O acesso de Paulo e Maria depende das contas Authentication e dos documentos `admins/{UID}` criados manualmente pelo responsável. Siga [ATIVAR_ADMINISTRADORES.md](ATIVAR_ADMINISTRADORES.md). Os testes completos de edição, bloqueio, perda de conexão e restauração com duas contas foram aprovados nos emuladores; a conferência das duas contas reais é a etapa seguinte do responsável.

As alterações feitas pelo painel são publicadas diretamente no Firestore e não exigem outro deploy. Alterações no código da branch `main` executam o workflow automaticamente.
