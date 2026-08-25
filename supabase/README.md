# Supabase AI Parsing Setup

1. Apply the database migration in your Supabase project.

```sh
supabase db push
```

2. Set Edge Function secrets.

```sh
supabase secrets set GEMINI_API_KEY=...
supabase secrets set SERVICE_ROLE_KEY=...
supabase secrets set PARSER_WORKER_URL=http://localhost:8787
```

3. Deploy the functions.

```sh
supabase functions deploy create-upload
supabase functions deploy process-source
supabase functions deploy get-source-assets
```

4. Add Expo public config in `.env`.

```sh
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

The migration creates the `sources`, `chunks`, `generated_assets`, and `parse_jobs` tables, enables pgvector, creates the `study-materials` bucket, and adds permissive storage policies for the single-user MVP. Add Supabase Auth and RLS before production.
