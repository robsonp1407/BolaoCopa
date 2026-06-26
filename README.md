# Bolao Copa 2026

Fundacao inicial do sistema Bolao Copa 2026.

## Fase atual

Fase 1 implementou a base do projeto:

- Next.js com App Router, TypeScript strict, Tailwind CSS, ESLint e Prettier.
- PostgreSQL com Prisma ORM e migration inicial.
- Auth.js / NextAuth com Google e login local por e-mail e senha.
- Cadastro de usuario com senha criptografada com bcrypt.
- Recuperacao de senha com token persistido no banco.
- Papeis `ADMIN`, `ORGANIZER` e `PARTICIPANT`.
- Home, Login, Cadastro, Esqueci minha senha, Redefinir senha e Dashboard protegido.
- Middleware protegendo `/dashboard`.
- Helpers de autorizacao e validacoes com Zod.
- Testes unitarios basicos.

Fase 2 implementa os dados oficiais estruturais da Copa:

- Selecoes nacionais.
- Cidades-sede.
- Estadios.
- Grupos A-L.
- Fases do torneio.
- Jogos.
- Importacao idempotente por seed JSON.
- Suporte ao formato de 48 selecoes, 12 grupos e 104 jogos.

Fase 3 implementa o backend de avanco automatico do chaveamento:

- Registro de resultado oficial por ADMIN.
- Placar normal e placar de penaltis.
- Vencedor e perdedor derivados automaticamente.
- Classificacao de grupos persistida.
- Resolucao de qualificadores como `1A`, `2B`, `3C`, `W73` e `L101`.
- Resolucao dos 8 melhores terceiros colocados.
- Preenchimento automatico dos jogos seguintes.
- Reprocessamento idempotente do torneio.
- Auditoria para registro de resultados e reprocessamentos.

Fase 4 implementa criacao e gerenciamento de boloes:

- Criacao de boloes por `ADMIN` e `ORGANIZER`.
- Entrada de participantes por codigo.
- Boloes publicos e privados com senha criptografada.
- Limite opcional de participantes.
- Membros com papeis `OWNER`, `ADMIN` e `MEMBER`.
- Regras de pontuacao configuraveis armazenadas por bolao.
- Soft delete de boloes.
- Remocao de membros e transferencia de propriedade.
- Auditoria dos eventos de bolao.

Fase 5 implementa palpites:

- Registro de palpites por membros do bolao.
- Um palpite por usuario, bolao e jogo.
- Edicao permitida somente antes do horario oficial da partida.
- Historico de alteracoes antes do bloqueio.
- Palpite rapido em lote sem salvamento parcial.
- Indicadores de jogos disponiveis, preenchidos, pendentes e bloqueados.
- Tela minima para preenchimento em `/pools/:poolId/predictions`.
- Auditoria dos eventos de palpite.

Fase 6 implementa pontuacao:

- Calculo puro de pontos por palpite comparado com o resultado oficial.
- Historico de pontos por usuario, partida e bolao.
- Subtotais persistidos para auditoria e criterios futuros de desempate.
- Recalculo idempotente quando um resultado oficial e registrado ou corrigido.
- Endpoint administrativo para reprocessar pontos de uma partida.

Fase 7 implementa rankings por snapshot:

- Ranking geral do bolao.
- Ranking por rodada da fase de grupos.
- Ranking por fase eliminatoria.
- Desempate por placares exatos, resultados corretos e palpite mais antigo.
- Atualizacao atomica de `RankingSnapshot` junto do recalculo de pontos.

Etapa de UI operacional:

- Dashboard autenticado com atalhos para boloes, palpites, ranking e area admin.
- Navegacao global ajustada conforme autenticacao e papel do usuario.
- Tela `/pools` para entrar em bolao por codigo, criar bolao quando permitido e listar boloes visiveis.
- Tela `/pools/:poolId` com detalhes, membros, codigo de convite e regra de pontuacao.
- Acoes operacionais em `/pools/:poolId`: editar dados do bolao, sair, excluir, remover membro e transferir propriedade quando o papel permitir.
- Tela `/pools/:poolId/rankings` lendo `RankingSnapshot`.
- Tela `/admin` minima para ADMIN registrar resultados oficiais, reprocessar o torneio e consultar auditoria recente.
- A tela existente de palpites foi preservada e recebeu link de retorno ao bolao.

Ainda nao foram implementados WhatsApp ou painel admin avancado.

## Requisitos locais

1. Node.js LTS.
2. PostgreSQL local ou remoto acessivel.
3. NPM.

Nao usar Docker neste projeto.

## Configuracao

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Configure as variaveis:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolao_copa_2026?schema=public&sslmode=disable"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolao_copa_2026_shadow?schema=public&sslmode=disable"
AUTH_SECRET="gere-um-segredo-forte"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
# Alternativa aceita pelo projeto:
# AUTH_GOOGLE_ID=""
# AUTH_GOOGLE_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Gere um segredo forte para `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

5. Configure o Google OAuth no Google Cloud Console e preencha:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Tambem e possivel reaproveitar um `.env` que use os nomes do Auth.js:

```env
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

Use `http://localhost:3000/api/auth/callback/google` como URL de callback em desenvolvimento.

## Banco de dados

Com o PostgreSQL rodando, crie dois bancos:

```sql
CREATE DATABASE bolao_copa_2026;
CREATE DATABASE bolao_copa_2026_shadow;
```

O banco `bolao_copa_2026` e usado pela aplicacao. O banco `bolao_copa_2026_shadow` e usado apenas pelo Prisma Migrate em desenvolvimento para validar migrations sem exigir permissao de `CREATE DATABASE` no usuario da aplicacao.

Se o seu PostgreSQL estiver na porta `5433`, ajuste o `.env` assim:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5433/bolaocopa_producao?schema=public&sslmode=disable"
SHADOW_DATABASE_URL="postgresql://usuario:senha@localhost:5433/bolaocopa_shadow?schema=public&sslmode=disable"
```

Depois execute:

```bash
npx prisma migrate dev
```

Isso aplica a migration inicial e gera o Prisma Client.

## Dados oficiais da Copa

A Fase 2 adiciona os modelos:

- `NationalTeam`
- `HostCity`
- `Stadium`
- `TournamentGroup`
- `TournamentStage`
- `Match`

O seed padrao fica em:

```text
prisma/data/world-cup-2026.seed.json
```

Ele importa a estrutura base do torneio:

- 16 cidades-sede;
- 16 estadios;
- 12 grupos;
- 7 fases;
- campos preparados para 48 selecoes e 104 jogos.

Para importar o seed padrao:

```bash
npx prisma db seed
```

Tambem existe o atalho:

```bash
npm run prisma:seed
```

Para importar outro arquivo JSON, use:

```bash
$env:WORLD_CUP_SEED_PATH="C:\caminho\para\world-cup-2026-completo.json"
npx prisma db seed
```

Formato basico para selecoes:

```json
{
  "teams": [
    {
      "fifaCode": "BRA",
      "name": "Brasil",
      "slug": "brasil",
      "confederation": "CONMEBOL",
      "groupCode": "A",
      "groupPosition": 1
    }
  ]
}
```

## Cadastro operacional de usuarios Google

Para permitir lancamento administrativo de palpites retroativos, existe um
script idempotente para cadastrar usuarios que entrarao pelo Google:

```bash
npm run users:retroactive
```

Esse comando cadastra ou atualiza os usuarios abaixo com papel `PARTICIPANT`:

- Denise Galvao: `denise.farmacia@gmail.com`
- Juan Francisco: `juanfrcogalvao@gmail.com`
- Keila Nara Galvao: `naragalvao08@gmail.com`
- Marcia Galvao: `marcia.galvaodasilva@gmail.com`
- Matheus Pavan: `matheusp2903@gmail.com`
- Vinicius Garcia: `vinigarcia87@gmail.com`

Se os palpites retroativos forem lancados para um bolao especifico, informe
tambem o codigo de entrada do bolao para criar o vinculo de participante:

```bash
npm run users:retroactive -- --join-code=CODIGO_DO_BOLAO
```

Passo a passo recomendado:

1. Confirme que `DATABASE_URL` aponta para o banco correto.
2. Execute `npx prisma migrate deploy` no servidor antes do cadastro.
3. Rode `npm run users:retroactive -- --join-code=CODIGO_DO_BOLAO`.
4. Entre em `/admin` com um usuario `ADMIN`.
5. Use o formulario "Salvar palpite iniciado" para selecionar bolao, participante e jogo.
6. Confira a auditoria recente para validar o registro `PREDICTION_RETROACTIVE_UPSERT`.

O login Google usa o PrismaAdapter do Auth.js. Como esses usuarios sao
pre-cadastrados por e-mail para permitir operacao retroativa antes do primeiro
login, o provider Google esta configurado para vincular automaticamente a conta
OAuth ao usuario existente pelo e-mail verificado.

Formato basico para jogos:

```json
{
  "matches": [
    {
      "matchNumber": 1,
      "stageCode": "GROUP_STAGE",
      "groupCode": "A",
      "stadiumSlug": "mexico-city-stadium",
      "homeTeamCode": "MEX",
      "awayTeamCode": "RSA",
      "homeSlot": "A1",
      "awaySlot": "A2",
      "startsAt": "2026-06-11T19:00:00.000Z",
      "status": "SCHEDULED"
    }
  ]
}
```

O importador faz `upsert`, entao pode ser executado novamente quando o JSON oficial for atualizado. Quando uma selecao ainda nao estiver definida, use `homeSlot` e `awaySlot` sem `homeTeamCode`/`awayTeamCode`.

## Chaveamento automatico

A Fase 3 adiciona os campos derivados em `Match`:

- `homeScore`
- `awayScore`
- `homePenaltyScore`
- `awayPenaltyScore`
- `winnerTeamId`
- `loserTeamId`
- `homeQualifier`
- `awayQualifier`

Tambem adiciona:

- `GroupStanding`, para classificacao persistida dos grupos;
- `AuditLog`, para auditoria administrativa.

### Registrar resultado oficial

Somente usuarios `ADMIN` podem registrar resultado:

```http
PATCH /api/admin/matches/:id/result
```

Payload:

```json
{
  "homeScore": 2,
  "awayScore": 1,
  "homePenaltyScore": null,
  "awayPenaltyScore": null
}
```

Fluxo executado:

1. Valida o payload com Zod.
2. Verifica permissao `ADMIN`.
3. Salva o resultado oficial.
4. Recalcula vencedores e perdedores.
5. Recalcula classificacao dos grupos.
6. Resolve qualificadores.
7. Atualiza confrontos seguintes.
8. Registra auditoria.

### Reprocessar torneio

Somente usuarios `ADMIN` podem reprocessar:

```http
POST /api/admin/tournaments/world-cup-2026/recalculate
```

Esse endpoint recalcula dados derivados sem duplicar registros. Ele pode ser usado depois de alterar resultados ou reimportar dados oficiais.

### Engine de qualificadores

A engine resolve qualificadores de forma generica:

- `1A`, `2A`, `3A`: posicao de grupo;
- `3A/B/C/D/F`: melhor terceiro colocado entre grupos candidatos;
- `W73`: vencedor da partida 73;
- `L101`: perdedor da partida 101.

O chaveamento nao depende de numeros fixos no codigo. Os confrontos sao preenchidos com base nos qualificadores persistidos em `homeQualifier` e `awayQualifier`.

## Boloes

A Fase 4 adiciona os modelos:

- `Pool`, que representa um bolao;
- `PoolMember`, relacionamento usuario x bolao;
- `ScoreRule`, regras configuraveis de pontuacao para fases futuras.

Tambem adiciona os enums:

- `PoolStatus`: `ACTIVE`, `DELETED`;
- `PoolMemberRole`: `OWNER`, `ADMIN`, `MEMBER`.

### Criar bolao

```http
POST /api/pools
```

Somente `ADMIN` e `ORGANIZER`.

Payload:

```json
{
  "name": "Bolao Familia Pavan",
  "description": "Bolao da familia",
  "isPrivate": true,
  "password": "123456",
  "maxParticipants": 50
}
```

Fluxo executado:

1. Gera `slug` unico.
2. Gera `joinCode` unico.
3. Criptografa senha quando informada.
4. Cria `Pool`.
5. Cria `PoolMember` com papel `OWNER`.
6. Cria `ScoreRule` padrao.
7. Registra auditoria `POOL_CREATED`.

### Listar boloes

```http
GET /api/pools
```

Retorna boloes publicos e boloes em que o usuario autenticado participa.

### Detalhar bolao

```http
GET /api/pools/:id
```

Retorna dados do bolao, membros e regras de pontuacao.

### Entrar em bolao

```http
POST /api/pools/join
```

Payload:

```json
{
  "joinCode": "ABC123",
  "password": "123456"
}
```

Valida senha quando houver, impede participacao duplicada e respeita limite de participantes.

### Atualizar bolao

```http
PATCH /api/pools/:id
```

Somente `OWNER`, membro `ADMIN` do bolao ou `ADMIN` global.
Ao marcar um bolao como privado, ele precisa manter ou receber uma senha valida.

### Remover bolao

```http
DELETE /api/pools/:id
```

Faz soft delete com `status = DELETED`.

### Sair de bolao

```http
POST /api/pools/:id/leave
```

O `OWNER` nao pode sair sem transferir propriedade.

### Gerenciar membros

```http
DELETE /api/pools/:id/members/:userId
POST /api/pools/:id/owner
```

Transferencia de propriedade:

```json
{
  "userId": "id-do-novo-owner"
}
```

O novo proprietario precisa ser membro do bolao.

### Regras de pontuacao padrao

```json
{
  "exactScorePoints": 2,
  "winnerPoints": 3,
  "knockoutWinnerPoints": 1,
  "singleTeamScorePoints": 1
}
```

Essas regras sao armazenadas por bolao e usadas pelo calculo de pontuacao.

## Palpites

A Fase 5 adiciona os modelos:

- `Prediction`, que armazena o palpite atual de um usuario para um jogo dentro de um bolao;
- `PredictionHistory`, que guarda o estado anterior sempre que um palpite e alterado.

### Regras principais

- O usuario precisa estar autenticado.
- O usuario precisa ser membro do bolao.
- O bolao precisa estar ativo.
- Cada usuario tem no maximo um palpite por jogo em cada bolao.
- O palpite so pode ser criado ou alterado enquanto `agora < Match.startsAt`.
- Datas sao comparadas em UTC, usando o `startsAt` persistido no banco.
- Em jogos de grupos, empate e permitido sem vencedor previsto.
- Em jogos eliminatorios, se o placar normal empatar, `predictedWinnerTeamId` e obrigatorio.
- Se uma tentativa ocorrer apos o inicio do jogo, a API retorna erro amigavel e registra auditoria.

Como ainda nao existe uma tabela `Tournament`, os jogos oficiais importados representam o torneio `world-cup-2026`. Boloes com `tournamentId` nulo ou `world-cup-2026` aceitam esses jogos.

### APIs de palpites

Listar jogos e palpites do usuario logado:

```http
GET /api/pools/:poolId/predictions
```

Retorna os jogos, dados basicos da partida, palpite salvo, status aberto/bloqueado e resumo:

```json
{
  "summary": {
    "totalGames": 104,
    "totalAvailable": 104,
    "totalFilled": 3,
    "totalPending": 101,
    "totalLocked": 0
  }
}
```

Criar ou atualizar palpite:

```http
PUT /api/pools/:poolId/predictions/:matchId
```

Payload:

```json
{
  "homeScore": 2,
  "awayScore": 1,
  "homePenaltyScore": null,
  "awayPenaltyScore": null,
  "predictedWinnerTeamId": null
}
```

Salvar varios palpites:

```http
POST /api/pools/:poolId/predictions/quick
```

Payload:

```json
{
  "predictions": [
    {
      "matchId": "id-da-partida",
      "homeScore": 1,
      "awayScore": 0,
      "homePenaltyScore": null,
      "awayPenaltyScore": null,
      "predictedWinnerTeamId": null
    }
  ]
}
```

Se qualquer jogo do lote estiver bloqueado ou invalido, nada e salvo.

### Tela de palpites

Acesse:

```text
http://localhost:3000/pools/:poolId/predictions
```

A tela lista jogos agrupados por fase e data, mostra pendencias, bloqueios e permite salvar individualmente ou em lote.

### Entrada retroativa de palpites

Funcionalidade emergencial para registrar, por um `ADMIN`, palpites feitos fora do sistema para jogos ja iniciados ou finalizados.

Endpoint:

```http
POST /api/admin/retroactive-guess
```

Somente `ADMIN` pode acessar. Usuarios `ORGANIZER` e `PARTICIPANT` recebem `403 Forbidden`.

Payload:

```json
{
  "user_id": "id-do-participante",
  "pool_id": "id-do-bolao",
  "match_id": "id-do-jogo",
  "home_score": 2,
  "away_score": 1
}
```

Fluxo executado em transacao Prisma:

1. Confirma que o participante pertence ao bolao.
2. Ignora a trava temporal apenas para a operacao administrativa.
3. Cria ou atualiza `Prediction`.
4. Grava `PredictionHistory` com `changedByUserId` do admin.
5. Se o jogo ja tiver resultado oficial, recalcula o `PointsHistory` desse palpite e atualiza snapshots de ranking do bolao.
6. Grava `AuditLog` com `PREDICTION_RETROACTIVE_UPSERT`, admin executor, participante afetado, payload e estado anterior quando houver.

A tela operacional fica em `/admin`, na secao "Entrada retroativa".

## Pontuacao

A Fase 6 adiciona o modelo `PointsHistory`, que registra os pontos de cada usuario em uma partida dentro de um bolao.

Cada registro guarda:

- `resultPoints`;
- `exactScorePoints`;
- `knockoutWinnerPoints`;
- `singleTeamScorePoints`;
- `totalPoints`.

Esse historico e por partida, usuario e bolao.

### Regra matematica

A pontuacao maxima por partida e 6 pontos:

```text
resultado correto:          +3
placar exato:               +2
vencedor no mata-mata:      +1
placar de um dos times:     +1
```

Detalhes:

- Resultado correto significa acertar quem vence ou se o jogo termina empatado.
- Em mata-mata, quando houver vencedor oficial, acertar o vencedor previsto rende o bonus de 1 ponto.
- Placar exato exige acertar gols dos dois times.
- O ponto por placar parcial so entra quando nao houve placar exato.
- Os valores usam `ScoreRule` do bolao quando existir; os defaults sao `3`, `2`, `1` e `1`.

### Reprocessamento seguro

Sempre que um resultado oficial e registrado por:

```http
PATCH /api/admin/matches/:id/result
```

o sistema:

1. Salva o resultado oficial.
2. Recalcula o chaveamento da Copa.
3. Remove os pontos antigos daquela partida.
4. Recalcula os pontos de todos os palpites ativos da partida.
5. Recria `PointsHistory` dentro da mesma transacao.
6. Registra auditoria `POINTS_RECALCULATED`.

Se o resultado for corrigido, o mesmo fluxo pode ser executado novamente sem duplicar pontos.

### Reprocessar pontos manualmente

Somente `ADMIN`:

```http
POST /api/admin/matches/:id/points
```

Resposta:

```json
{
  "ok": true,
  "pointsRecalculation": {
    "matchId": "id-da-partida",
    "processedPredictions": 10,
    "createdPointsHistories": 10,
    "deletedPointsHistories": 10
  }
}
```

## Rankings

A Fase 7 adiciona o modelo `RankingSnapshot`. Ele salva fotos calculadas das classificacoes para evitar agregacoes pesadas sobre `PointsHistory` a cada refresh da pagina.

### Correcao operacional aplicada

Se o dashboard retornar erro 500 apos o login com mensagem generica de Server Component, verifique se a migration `20260616090000_add_ranking_snapshot_match_id` foi aplicada. Ela adiciona a coluna opcional `RankingSnapshot.matchId`, usada pelo Prisma Client atual para manter a relacao com `Match`.

Sintoma observado:

```text
PrismaClientKnownRequestError P2022
The column `RankingSnapshot.matchId` does not exist in the current database.
```

Correcao:

```bash
npx prisma migrate dev
npx prisma generate
npm run build
npm start
```

Escopos suportados:

- `GENERAL` com `scopeKey=ALL`: ranking geral do bolao.
- `GROUP_ROUND` com `scopeKey=ROUND_1`, `ROUND_2` ou `ROUND_3`: ranking por rodada da fase de grupos.
- `KNOCKOUT_STAGE` com `scopeKey` igual ao codigo da fase, como `ROUND_OF_32`, `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE` ou `FINAL`.

### Desempate

A ordenacao de `RankingSnapshot` segue:

1. Maior `totalPoints`.
2. Maior quantidade de placares exatos, derivada de `exactScorePoints > 0`.
3. Maior quantidade de resultados corretos, derivada de `resultPoints > 0`.
4. Menor `Prediction.createdAt`, ou seja, quem palpitou primeiro tem vantagem.

### Atualizacao atomica

Quando pontos de uma partida sao recalculados, o sistema tambem recalcula os snapshots dos boloes afetados dentro da mesma transacao Prisma.

O fluxo e:

1. Remove `PointsHistory` antigo da partida.
2. Recria pontos da partida.
3. Identifica boloes afetados.
4. Recalcula `RankingSnapshot` dos escopos afetados.
5. Registra auditoria de pontuacao.

### Consultar ranking

Usuario precisa estar autenticado e ser membro do bolao.

```http
GET /api/pools/:id/rankings?scope=GENERAL&scopeKey=ALL&page=1&pageSize=50
```

Exemplos:

```http
GET /api/pools/:id/rankings?scope=GROUP_ROUND&scopeKey=ROUND_1
GET /api/pools/:id/rankings?scope=KNOCKOUT_STAGE&scopeKey=FINAL
```

O endpoint le apenas `RankingSnapshot`, usando indices compostos por `poolId`, `scope`, `scopeKey` e `position`.

A resposta tambem inclui metricas de conferencia calculadas para o escopo solicitado, sem alterar a ordenacao nem a
pontuacao persistida no snapshot:

- `scopeStats.totalMatches`: total de partidas com resultado oficial consideradas no ranking atual.
- `scopeStats.totalPredictions`: total de palpites registrados para essas partidas no bolao.
- `predictionStats.predictionsCount`: total de palpites registrados pelo participante nas partidas do escopo.
- `predictionStats.singleTeamScoreHits`: palpites que pontuaram por acertar o placar de um dos times.
- `predictionStats.noPointPredictions`: palpites registrados que nao pontuaram naquela partida.

Na tela `/pools/:poolId/rankings`, essas informacoes aparecem como resumo acima da tabela e como colunas adicionais
por participante.

### Consultar resultados computados

A tela `/pools/:poolId/results` exibe, para membros do bolao, as partidas com resultado oficial ja registrado e
pontuacao computada naquele bolao.

Uma partida aparece nessa tela somente quando:

- `Match.homeScore` e `Match.awayScore` estao preenchidos;
- existe pelo menos um `PointsHistory` com o mesmo `poolId` e `matchId`.

A tela mostra os totais de partidas computadas, palpites computados e pontos distribuidos, alem do resumo por partida
com placar oficial, fase, grupo, quantidade de palpites computados, pontos distribuidos e horario do ultimo calculo de
pontos.

## Rodando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy compilado via GitHub Actions

Use este fluxo quando o servidor Oracle Cloud nao tiver memoria suficiente para executar `npm run build`.
O build acontece no runner Linux do GitHub, que gera um pacote standalone compativel com Ubuntu.
O servidor recebe somente o ZIP pronto, aplica migrations Prisma e reinicia o PM2.

Nao versione `.next-app`, `dist` ou `node_modules` no Git. O artefato compilado fica no GitHub Actions por 14 dias e e enviado ao servidor por SSH.

### 1. O que foi preparado no projeto

- `next.config.mjs` usa `output: "standalone"`;
- `npm run deploy:package` gera `dist/bolao-copa-standalone.zip`;
- `.github/workflows/deploy.yml` roda lint, testes, build, publica o artefato e faz deploy em `main`;
- `scripts/deploy-github-artifact.sh` roda no servidor, descompacta releases versionadas, preserva `.env`, aplica migrations e reinicia PM2.

### 2. Preparar o servidor uma unica vez

No Ubuntu:

```bash
sudo apt update
sudo apt install -y unzip curl
node -v
npm -v
sudo npm install -g pm2

sudo mkdir -p /var/www/bolao-copa/shared
sudo chown -R ubuntu:ubuntu /var/www/bolao-copa
nano /var/www/bolao-copa/shared/.env
```

Se `node -v` ou `npm -v` nao existir, instale Node.js antes:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Exemplo de `/var/www/bolao-copa/shared/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/bolao_copa_2026?schema=public"
AUTH_SECRET="gere-um-segredo-forte"
AUTH_URL="https://seudominio.com.br"
NEXT_PUBLIC_APP_URL="https://seudominio.com.br"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Em producao, o callback do Google OAuth deve apontar para:

```text
https://seudominio.com.br/api/auth/callback/google
```

O PostgreSQL precisa existir antes do primeiro deploy:

```sql
CREATE DATABASE bolao_copa_2026;
```

### 3. Configurar secrets no GitHub

No repositorio, acesse `Settings > Secrets and variables > Actions`.

Crie os secrets:

```text
PROD_SERVER_HOST=IP_DO_SERVIDOR
PROD_SERVER_USER=ubuntu
PROD_SSH_PRIVATE_KEY=conteudo_da_chave_privada
```

Crie as variables, se quiser sobrescrever os padroes:

```text
PROD_APP_DIR=/var/www/bolao-copa
PROD_BASE_URL=https://seudominio.com.br
PROD_PM2_NAME=bolao-copa
PROD_PORT=3000
```

Se alguma variable nao for criada, o deploy usa os valores padrao acima.

### 4. Fazer deploy

Envie a alteracao para a branch `main`:

```bash
git push origin main
```

O GitHub Actions executa:

1. `npm ci`;
2. `npx prisma generate`;
3. `npm run lint`;
4. `npm test`;
5. `npm run deploy:package`;
6. upload do artefato;
7. copia do ZIP para o servidor;
8. `npx -y prisma@5.22.0 migrate deploy`;
9. restart/start do PM2;
10. validacao por `curl` em `PROD_BASE_URL`.

### 5. Nginx

Exemplo de configuracao:

```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/bolao-copa /etc/nginx/sites-enabled/bolao-copa
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Diagnostico no servidor

```bash
pm2 status
pm2 logs bolao-copa --lines 100
journalctl -u nginx -n 100 --no-pager
curl -i http://127.0.0.1:3000
```

## Qualidade

```bash
npm run lint
npm test
```

## Recuperacao de senha em desenvolvimento

Ao solicitar redefinicao de senha, o sistema:

- salva o hash do token no banco;
- exibe o link de desenvolvimento na tela;
- escreve o link/token no log do servidor;
- deixa o envio real de e-mail preparado em `src/lib/email/password-reset.ts`.

## Proximas fases

A proxima fase deve ser iniciada somente apos aprovacao. WhatsApp, painel admin avancado e melhorias de deploy ficam para fases futuras.

# BolaoCopa
