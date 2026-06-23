import { supabase } from '@/lib/supabase';

// ─── helpers ───────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim a value to a string and cap its length. Non-strings become ''. */
function clean(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// ─── POST: capture a lead ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lead: any = await req.json().catch(() => null);
    if (!lead || typeof lead !== 'object') {
      return Response.json({ ok: false, msg: 'Invalid payload' }, { status: 400 });
    }

    const firstName = clean(lead.firstName, 80);
    const lastName  = clean(lead.lastName, 80);
    const company   = clean(lead.company, 120);
    const phone     = clean(lead.phone, 40);
    const email     = clean(lead.email, 160).toLowerCase();
    const reportId  = clean(lead.reportId, 40);

    // Server-side validation (the client validates too, but never trust it).
    if (!firstName || !lastName || !company || !phone || !email) {
      return Response.json({ ok: false, msg: 'Missing required fields' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ ok: false, msg: 'Invalid email address' }, { status: 400 });
    }

    // Idempotency: a single report should only ever produce one lead row.
    // React StrictMode / double-submits fire the same reportId twice — skip it.
    if (reportId) {
      const { data: existing } = await supabase
        .from('leads').select('id').eq('report_id', reportId).limit(1);
      if (existing && existing.length > 0) {
        return Response.json({ ok: true, deduped: true });
      }
    }

    const { error } = await supabase.from('leads').insert({
      timestamp:  clean(lead.timestamp, 60),
      first_name: firstName,
      last_name:  lastName,
      company,
      phone,
      email,
      status:     clean(lead.status, 40),
      report_id:  reportId,
      truck:      clean(lead.truck, 120),
      forklift:   clean(lead.forklift, 120),
      cargo:      clean(lead.cargo, 60),
      summary:    clean(lead.summary, 500),
    });

    if (error) throw error;

    // Optional: forward to a Google Sheets / Zapier webhook if configured.
    const webhookUrl = process.env.LEADS_WEBHOOK;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead),
      }).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, msg: String(err) }, { status: 500 });
  }
}

// ─── GET: admin-only lead export ─────────────────────────────────────────────
// This endpoint returns every lead's PII, so it MUST be protected.
// Set LEADS_ADMIN_KEY in the environment, then call with header
// `x-admin-key: <key>` or `?key=<key>`. Without the env var it is disabled.
export async function GET(req: Request) {
  const adminKey = process.env.LEADS_ADMIN_KEY;
  if (!adminKey) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const provided = req.headers.get('x-admin-key') || url.searchParams.get('key');
  if (provided !== adminKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('leads').select('*').order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
