## executar localmente usando o live-server

1. Instale o projeto com `npm i`
2. Suba o servidor local clicando no botão `Go Live` no canto inferior direito do VSC
3. Acesse a aplicação em http://127.0.0.1:5500/

## executar via docker

1. no diretório do projeto, rode `docker build . -t <tag-da-imagem>` (o nome da tag você que define, ex `node-streams-front`)
2. depois de construir, execute com `docker run -p 8080:80 <tag-da-imagem> .`
3. Acesse a aplicação em http://127.0.0.1:8080/ (confira se a porta não está ocupada antes de rodar. se estiver é só trocar `8080` por alguma outra)
