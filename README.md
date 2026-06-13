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

Ainda nao foram implementados ranking, calculo de pontuacao ou WhatsApp.

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolao_copa_2026?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bolao_copa_2026_shadow?schema=public"
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
DATABASE_URL="postgresql://usuario:senha@localhost:5433/bolaocopa_producao?schema=public"
SHADOW_DATABASE_URL="postgresql://usuario:senha@localhost:5433/bolaocopa_shadow?schema=public"
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

Essas regras sao apenas armazenadas na Fase 4. Calculo de pontuacao e rankings ficam para fases futuras.

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

## Rodando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`.

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

A proxima fase deve ser iniciada somente apos aprovacao. As funcionalidades de jogos, boloes, palpites, rankings e WhatsApp ficam fora da Fase 1.
# BolaoCopa
