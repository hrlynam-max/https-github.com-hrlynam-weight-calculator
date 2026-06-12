import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const lead = await req.json();

    const { error } = await supabase.from('leads').insert({
      timestamp:  lead.timestamp,
      first_name: lead.firstName,
      last_name:  lead.lastName,
      company:    lead.company,
      phone:      lead.phone,
      email:      lead.email,
      status:     lead.status,
      report_id:  lead.reportId,
      truck:      lead.truck,
      forklift:   lead.forklift,
      cargo:      lead.cargo,
      summary:    lead.summary,
    });

    if (error) throw error;

    // Optional: forward to Google Sheets webhook if configured
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

export async function GET() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
