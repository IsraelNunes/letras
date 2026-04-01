# README2 - Comandos Basicos (Android)

Guia rapido para rodar o projeto no Android.

## 1) Setup inicial

No root do projeto:

```bash
cd /home/israel/Documentos/letras
pnpm install
pnpm db:generate
```

Se o pnpm pedir aprovacao de scripts:

```bash
pnpm approve-builds
pnpm install
```

## 2) Subir a API (porta 3000)

```bash
pnpm --filter api dev
```

Testar se API esta no ar:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db
curl http://localhost:3000/reference/ufs
```

Se der erro de porta ocupada (`EADDRINUSE`):

```bash
lsof -iTCP:3000 -sTCP:LISTEN -n -P
kill <PID>
pnpm --filter api dev
```

## 3) Android Emulator (Studio)

Para emulador Android, use `10.0.2.2`:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 pnpm --filter educator-app start
```

Aprendiz:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 pnpm --filter learner-app start
```

Opcional (ADB reverse):

```bash
adb reverse tcp:3000 tcp:3000
```

Com `adb reverse`, tambem pode usar `http://localhost:3000` no app.

### Opcao Web (browser)

Educador (web):

```bash
./scripts/dev-educator.sh web
```

Aprendiz (web):

```bash
./scripts/dev-learner.sh web
```

## 4) Android fisico (Expo Go)

Descobrir IP local da maquina:

```bash
hostname -I | awk '{print $1}'
```

Exemplo de subida (troque pelo seu IP):

```bash
EXPO_PUBLIC_API_URL=http://192.168.100.13:3000 pnpm --filter educator-app exec expo start --clear
```

Aprendiz:

```bash
EXPO_PUBLIC_API_URL=http://192.168.100.13:3000 pnpm --filter learner-app exec expo start --clear
```

Regras importantes:
- Celular e PC devem estar na mesma rede Wi-Fi.
- Nao use 5G/dados moveis para esse teste local.
- No celular, `localhost` nao aponta para seu PC.

## 5) Banco (Prisma)

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Sincronizar usuarios locais com `auth.users`:

```bash
pnpm --filter api auth:sync-supabase-users
```

## 6) Limpeza de cache quando travar

```bash
pnpm --filter educator-app exec expo start --clear
pnpm --filter learner-app exec expo start --clear
```

Se preciso, feche Expo Go no celular e abra de novo.

## 7) Fluxo recomendado (rapido)

1. `pnpm --filter api dev`
2. Emulador Android: usar `http://10.0.2.2:3000`
3. Celular fisico: usar `http://SEU_IP_LOCAL:3000`
4. Abrir app e validar `/reference/ufs` na tela de cadastro
