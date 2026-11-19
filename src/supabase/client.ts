import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\\r|\\n/g, '')
    .replace(/[\r\n\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

function isAllowedSupabaseDomain(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.endsWith('.supabase.co') && host.length > '.supabase.co'.length;
}

function resolveSupabaseUrl(raw: unknown): string {
  let cleaned = cleanEnvValue(raw);
  if (!cleaned) {
    return '';
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(cleaned)) {
    console.error('[Supabase] Rejected localhost/127.0.0.1 URL in client configuration.');
    return '';
  }
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:' || !isAllowedSupabaseDomain(parsed.hostname)) {
      console.error(
        '[Supabase] Rejected invalid Supabase URL (must be https://*.supabase.co):',
        parsed.origin
      );
      return '';
    }
    return parsed.origin;
  } catch {
    console.error('[Supabase] Invalid Supabase URL format in env vars.');
    return '';
  }
}

const RAW_ENV_URL =
  cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_URL) ||
  cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);

const RAW_ENV_KEY = (
  cleanEnvValue(import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  cleanEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
).replace(/[^\x21-\x7E]/g, '');

export const SUPABASE_PROJECT_URL = resolveSupabaseUrl(RAW_ENV_URL);
export const SUPABASE_PUBLISHABLE_KEY = RAW_ENV_KEY;

// Log SUPABASE_URL ONLY (never log or expose ANON_KEY)
console.log('[Supabase] SUPABASE_URL:', SUPABASE_PROJECT_URL || '(MISSING)');
if (!SUPABASE_PROJECT_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Missing env vars', {
    hasSupabaseUrl: Boolean(SUPABASE_PROJECT_URL),
    hasSupabaseAnonKey: Boolean(SUPABASE_PUBLISHABLE_KEY),
    expectedVars: [
      'NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY',
    ],
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
      SUPABASE_PROJECT_URL &&
      SUPABASE_PROJECT_URL.startsWith('https://') &&
      SUPABASE_PUBLISHABLE_KEY &&
      SUPABASE_PUBLISHABLE_KEY.length > 10
  );
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (input, init) => {
          const requestUrl =
            typeof input === 'string'
              ? input
              : input instanceof URL
              ? input.toString()
              : input.url;

          let parsedTarget: URL;
          try {
            parsedTarget = new URL(requestUrl);
          } catch {
            throw new Error(`Invalid Supabase fetch URL: ${requestUrl}`);
          }

          if (
            parsedTarget.protocol !== 'https:' ||
            !isAllowedSupabaseDomain(parsedTarget.hostname)
          ) {
            throw new Error(
              `Blocked non-Supabase fetch target: ${parsedTarget.origin}`
            );
          }

          const method = (
            init?.method ||
            (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') ||
            'GET'
          ).toUpperCase();

          console.log('[Supabase Fetch] URL:', requestUrl);
          const maxAttempts = method === 'GET' || method === 'HEAD' ? 2 : 1;
          let lastErr: unknown;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const response = await fetch(input, init);
              if (!response.ok) {
                console.warn(
                  '[Supabase Fetch] HTTP Status:',
                  response.status,
                  response.statusText,
                  'URL:',
                  requestUrl
                );
              }
              return response;
            } catch (err: any) {
              lastErr = err;
              if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, 350));
                continue;
              }
              const isMutation = method !== 'GET' && method !== 'HEAD';
              (isMutation ? console.error : console.warn)(
                '[Supabase Fetch] Network failure:',
                {
                  method,
                  url: requestUrl,
                  name: err?.name,
                  message: err?.message || String(err),
                }
              );
              throw err;
            }
          }

          throw lastErr;
        },
      },
    });
  }
  return cachedClient;
}
