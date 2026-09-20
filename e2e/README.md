# Local two-person E2E

This suite uses real local Supabase Auth, Postgres, Realtime, and Mailpit. It
does not install an auth bypass or replace the API with a test server.

1. Start and reset the local services:

   ```bash
   npx supabase start
   npx supabase db reset
   ```

2. Copy the local API URL and anon key shown by `npx supabase status` into
   `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. Run the flow in PowerShell:

   ```powershell
   $env:E2E_LOCAL_SUPABASE = '1'
   npm run test:e2e
   ```

Mailpit defaults to `http://127.0.0.1:54324`. Override `E2E_MAILPIT_URL` only
when the local Supabase config uses another port.
