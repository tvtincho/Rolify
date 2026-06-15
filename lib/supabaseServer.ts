import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — the client is created only on first access (at request time),
// not at module evaluation time (build time), so env vars are always available.
let _client: SupabaseClient | null = null;

function getInstance(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

export const supabaseServer = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop) {
    const client = getInstance();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
