# Bolao da Copa 2026

Site publico para organizar um bolao familiar da Copa 2026.

## O que tem

- Cadastro de participantes
- Palpites por partida
- Resultados oficiais
- Ranking automatico
- Dados compartilhados via Supabase

## Supabase

1. Crie um projeto em https://supabase.com.
2. Abra o SQL Editor.
3. Rode o script em `supabase/schema.sql`.
4. Em Project Settings > API, copie:
   - Project URL
   - anon public key

## Vercel

1. Crie um projeto em https://vercel.com e conecte este repositorio.
2. Configure as variaveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Use os comandos padrao:
   - Build Command: `npm run build`
   - Install Command: `npm install`
4. Publique em Production.

## Desenvolvimento local

Crie um `.env.local` com as mesmas variaveis do `.env.example`.

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000`.
