'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  computeCompliance, TRUCK_MODELS, TRUCK_SPECS, FORKLIFT_MODELS,
  type CalcData,
} from '@/lib/calculator-engine';
import { generateReport, type Report } from '@/lib/report-generator';
import { Field, TextInput, CalcSelect, SliderInput, SectionHeader } from './calc-ui';

// ─── Lead helpers ─────────────────────────────────────────────────────────────

const SEVERITY_LABEL: Record<string, string> = {
  clear: 'COMPLIANT', tight: 'TIGHT', mild: 'OVERWEIGHT-MILD',
  moderate: 'OVERWEIGHT-MOD', severe: 'DO-NOT-HAUL',
};

const CSV_COLUMNS: [string, string][] = [
  ['timestamp', 'Timestamp'], ['firstName', 'First Name'], ['lastName', 'Last Name'],
  ['company', 'Company'], ['phone', 'Phone'], ['email', 'Email'],
  ['status', 'Status'], ['reportId', 'Report ID'], ['truck', 'Truck'],
  ['forklift', 'Forklift'], ['cargo', 'Cargo'], ['summary', 'Summary'],
];

const LEADS_LOCAL_KEY = 'er_leads_v1';

function buildLeadRow(data: CalcData, report: Report) {
  return {
    timestamp: new Date().toLocaleString(),
    firstName: data.firstName,
    lastName:  data.lastName,
    company:   data.company,
    phone:     data.phone,
    email:     data.email,
    status:    SEVERITY_LABEL[report.severity] || '',
    reportId:  report.id,
    truck:     report.snapshot?.truck || '',
    forklift:  report.snapshot?.forklift || '',
    cargo:     report.snapshot?.cargo || '',
    summary:   report.headline || '',
  };
}

function saveLeadLocal(row: object) {
  try {
    const arr = JSON.parse(localStorage.getItem(LEADS_LOCAL_KEY) || '[]');
    arr.push(row);
    localStorage.setItem(LEADS_LOCAL_KEY, JSON.stringify(arr));
  } catch { /* private mode / storage full */ }
}

async function logLead(data: CalcData, report: Report): Promise<{ ok: boolean; demo?: boolean; msg?: string }> {
  const row = buildLeadRow(data, report);
  saveLeadLocal(row);
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { ok: false, msg: String(err) };
  }
}

function downloadLeadsCSV() {
  const rows: Record<string, unknown>[] = JSON.parse(localStorage.getItem(LEADS_LOCAL_KEY) || '[]');
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = CSV_COLUMNS.map(c => c[1]).join(',');
  const body = rows.map(r => CSV_COLUMNS.map(c => esc(r[c[0]])).join(',')).join('\n');
  const csv = '﻿' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `99lifts-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Terms Gate ───────────────────────────────────────────────────────────────

const TERMS_ACCEPT_KEY = 'er_terms_accepted_v1';

const TERMS = [
  ['Estimates Only', 'This Tool provides rough approximations based on general federal formulas. It does not account for specific state-by-state variances, seasonal frost laws, permitted exceptions, or individual axle group limits.'],
  ['Not Legal or Professional Advice', 'The outputs of this calculator do not constitute legal compliance, logistical safety compliance, or professional engineering advice.'],
  ['Driver/Operator Responsibility', 'The commercial driver, fleet operator, and/or shipper remain solely and legally responsible for ensuring the vehicle complies with all federal, state, and local weight regulations. This Tool is not a substitute for a certified commercial scale (e.g., CAT Scale).'],
  ['Assumption of Risk & Waiver of Liability', 'You agree that use of this Tool is entirely at your own risk. The website owners, developers, and affiliates shall not be held liable for any direct or indirect consequences resulting from your use of this data, including but not limited to: traffic citations, overweight fines, or legal penalties; vehicle damage, equipment failure, or structural wear; accidents, personal injuries, or property damage.'],
];

const TermsGate = ({ onAccept }: { onAccept: () => void }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,26,26,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="terms-title" style={{
        background: '#fff', borderRadius: 6, maxWidth: 640, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden',
        borderTop: '4px solid #CC1F1F',
      }}>
        <div style={{ padding: '20px 26px 14px', borderBottom: '1px solid #ECECEC' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 600, color: '#CC1F1F',
            textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6,
          }}>Important</div>
          <h2 id="terms-title" style={{
            fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 800,
            color: '#1A1A1A', margin: 0, lineHeight: 1.1, textTransform: 'uppercase',
            letterSpacing: '0.01em',
          }}>Terms of Use &amp; Liability Disclaimer</h2>
        </div>
        <div style={{ padding: '16px 26px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13, color: '#444', margin: '0 0 14px', lineHeight: 1.55 }}>
            By using this Gross Vehicle Weight (GVW) and Legal Weight Calculator (the &quot;Tool&quot;), you acknowledge and agree to the following terms:
          </p>
          <ol style={{ margin: 0, padding: '0 0 0 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TERMS.map(([title, body], i) => (
              <li key={i} style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, color: '#444', lineHeight: 1.55 }}>
                <strong style={{ color: '#1A1A1A' }}>{title}:</strong> {body}
              </li>
            ))}
          </ol>
        </div>
        <div style={{ padding: '16px 26px 20px', borderTop: '1px solid #ECECEC', background: '#FAFAFA' }}>
          <label style={{
            display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
            fontFamily: "'IBM Plex Sans'", fontSize: 12.5, color: '#1A1A1A',
            lineHeight: 1.5, marginBottom: 14,
          }}>
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: '#CC1F1F', flexShrink: 0 }} />
            <span>
              I have read, understood, and accept these terms. I agree that I will
              verify all actual weights at a certified scale before operating on public roads.
            </span>
          </label>
          <button type="button" disabled={!checked} onClick={() => checked && onAccept()} style={{
            width: '100%', padding: '14px 0',
            background: checked ? '#CC1F1F' : '#E5E5E5',
            color: checked ? '#fff' : '#999',
            border: 'none', borderRadius: 3,
            fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: checked ? 'pointer' : 'not-allowed',
            transition: 'background 200ms, color 200ms',
          }}>Continue to Calculator</button>
        </div>
      </div>
    </div>
  );
};

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const ToolBar = () => (
  <div style={{
    background: '#1A1A1A', color: '#fff', padding: '12px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '3px solid #CC1F1F',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ background: '#fff', padding: '6px 10px', borderRadius: 3, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 900, color: '#CC1F1F', letterSpacing: '0.04em' }}>
          99LIFTS
        </span>
      </div>
      <span style={{
        paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.2)',
        fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 600,
        color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>Weight Tool</span>
    </div>
    <div style={{
      fontFamily: "'IBM Plex Mono'", fontSize: 11,
      color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em',
    }}>Compliance Tool</div>
  </div>
);

// ─── Locked status card ───────────────────────────────────────────────────────

const LockedStatusCard = ({ checks }: { checks: { label: string }[] }) => (
  <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{
      padding: '16px 24px', borderBottom: '1px solid #F0F0F0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>Compliance Status</div>
        <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 14, fontWeight: 600, color: '#444' }}>Pending — awaiting contact details</div>
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono'", fontSize: 9.5, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em',
        padding: '4px 8px', border: '1px solid #E5E5E5', borderRadius: 2,
      }}>—</div>
    </div>
    <div style={{ padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {checks.map((c, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 70px', gap: 12, alignItems: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: '#888' }}>{c.label}</div>
          <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2 }} />
          <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#BBB', textAlign: 'right' }}>—</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Thank-you / results state ────────────────────────────────────────────────

const SEVERITY_COLORS = {
  clear:    { bg: '#0F5E3A', accent: '#3FB67E', label: 'COMPLIANT' },
  tight:    { bg: '#7A5A0F', accent: '#E8B43A', label: 'TIGHT — REVIEW' },
  mild:     { bg: '#8A4A0F', accent: '#E8830A', label: 'OVERWEIGHT — MILD' },
  moderate: { bg: '#A02020', accent: '#E84444', label: 'OVERWEIGHT — MODERATE' },
  severe:   { bg: '#5A0F0F', accent: '#CC1F1F', label: 'DO NOT HAUL' },
} as const;

const ThankYouState = ({ data, result, onRestart }: {
  data: CalcData;
  result: ReturnType<typeof computeCompliance>;
  onRestart: () => void;
}) => {
  const report = useMemo(() => generateReport(data, result), []);
  const [sendState, setSendState] = useState<'sending' | 'sent' | 'error'>('sending');
  // Guard against double-firing (React StrictMode mounts effects twice in dev,
  // and a remount must never insert the same report a second time).
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    let alive = true;
    logLead(data, report).then(res => {
      if (!alive) return;
      setSendState(res.ok ? 'sent' : 'error');
    });
    return () => { alive = false; };
  }, []);

  const sc = SEVERITY_COLORS[report.severity];

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F2' }}>
      <ToolBar />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header bar */}
        <div style={{
          background: '#fff', border: '1px solid #E5E5E5', borderRadius: 4,
          padding: '14px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
            background: sc.bg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontFamily: "'Barlow Condensed'", fontWeight: 800,
          }}>✓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Your results · Report #{report.id}
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginTop: 2 }}>
              Here&apos;s your full compliance report, <strong>{data.firstName}</strong>.{' '}
              <span style={{ color: '#888', fontWeight: 400 }}>
                {sendState === 'sent'
                  ? "Your details are saved — we'll be in touch if we can help."
                  : sendState === 'error'
                  ? "We'll follow up with you shortly."
                  : 'Saving your details…'}
              </span>
            </div>
          </div>
          <button onClick={onRestart} style={{
            background: 'transparent', color: '#888',
            fontFamily: "'IBM Plex Sans'", fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '8px 12px', border: '1px solid #E5E5E5', borderRadius: 3, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>↻ New check</button>
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{
            background: '#fff', border: '1px solid #E5E5E5', borderRadius: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            {/* Severity hero */}
            <div style={{
              background: `linear-gradient(135deg, ${sc.bg} 0%, ${sc.accent} 130%)`,
              padding: '24px 28px', color: '#fff',
              borderBottom: `3px solid ${sc.accent}`,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                fontFamily: "'IBM Plex Mono'", fontSize: 10,
                color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14,
              }}>
                <span>Weight Compliance Report</span>
                <span>{report.date}</span>
              </div>
              <div style={{
                display: 'inline-block', background: 'rgba(0,0,0,0.25)',
                color: '#fff', padding: '4px 10px', borderRadius: 2,
                fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', marginBottom: 14,
              }}>{sc.label}</div>
              <h2 style={{ fontFamily: "'Barlow Condensed'", fontSize: 30, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.05 }}>
                {report.headline}
              </h2>
              <p style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13.5, color: 'rgba(255,255,255,0.92)', margin: '12px 0 0', lineHeight: 1.55 }}>
                {report.bottomLine}
              </p>
            </div>

            {/* Snapshot */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F0F0' }}>
              <div style={{
                fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                paddingBottom: 6, borderBottom: '2px solid #CC1F1F', marginBottom: 14, display: 'inline-block',
              }}>Your Setup</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {Object.entries(report.snapshot).map(([k, v]) => {
                  const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
                  return (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      borderBottom: '1px dotted #E5E5E5', paddingBottom: 6,
                    }}>
                      <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11.5, color: '#888' }}>{label}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11.5, fontWeight: 600, color: '#1A1A1A', textAlign: 'right' }}>{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weight breakdown */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F0F0' }}>
              <div style={{
                fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                paddingBottom: 6, borderBottom: '2px solid #CC1F1F', marginBottom: 14, display: 'inline-block',
              }}>Weight Breakdown</div>
              {report.breakdown.map(b => {
                const totalNum = parseInt(report.snapshot.totalGVW.replace(/\D/g, ''), 10) || 1;
                const pct = Math.max(0, Math.min(100, (b.value / totalNum) * 100));
                return (
                  <div key={b.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>
                        {b.label} <span style={{ color: '#888', fontWeight: 400 }}>· {b.note}</span>
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>
                        {b.value.toLocaleString()} lbs
                      </span>
                    </div>
                    <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: sc.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            <div style={{ padding: '20px 28px' }}>
              <div style={{
                fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, color: '#1A1A1A',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                paddingBottom: 6, borderBottom: '2px solid #CC1F1F', marginBottom: 14, display: 'inline-block',
              }}>What To Do</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.recs.map((r, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr', gap: 12,
                    padding: '12px 14px', background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: 3,
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono'", fontSize: 9, fontWeight: 600, color: '#CC1F1F',
                      background: '#fff', border: '1px solid #F5C2C2', padding: '4px 6px', borderRadius: 2,
                      letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', alignSelf: 'flex-start',
                    }}>{r.tag}</div>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 13, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.35, marginBottom: 4 }}>{r.title}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, color: '#555', lineHeight: 1.5 }}>{r.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report footer */}
            <div style={{
              padding: '14px 28px', borderTop: '1px solid #E5E5E5', background: '#FAFAFA',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#888',
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              <span>Report #{report.id}</span>
              <span>Estimates only · Verify with CAT scale before haul</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main tool ────────────────────────────────────────────────────────────────

const DEFAULT_DATA: CalcData = {
  specMode: 'model',
  truckMake: 'Freightliner', truckModel: 'M2 106',
  truckEmptyWeight: 16500, truckGVWR: 33000,
  axleConfig: 'single', cabType: 'day', fuelTank: 'single-100', wetKit: 'no',
  forkliftBrand: 'Moffett', forkliftModel: 'M55', forkliftWeight: 5200,
  cargoWeight: 8000, cargoForwardPct: 30,
  firstName: '', lastName: '', company: '', phone: '', email: '',
};

export default function StandaloneTool() {
  const [data, setData] = useState<CalcData>(DEFAULT_DATA);
  const set = (k: keyof CalcData, v: unknown) => setData(d => ({ ...d, [k]: v }));

  const [submitted, setSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showLeadsBtn, setShowLeadsBtn] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(TERMS_ACCEPT_KEY) === '1') setTermsAccepted(true); } catch { }
    setShowLeadsBtn(/[?&]leads=1/.test(window.location.search));
  }, []);

  // Static placeholder — no randomness avoids SSR/client hydration mismatch
  const example = { first: 'John', last: 'Doe', company: 'Doe LLC', phone: '(888) 708-3980', email: 'john@doellc.com' };

  const acceptTerms = () => {
    try { sessionStorage.setItem(TERMS_ACCEPT_KEY, '1'); } catch { }
    setTermsAccepted(true);
  };

  const result = computeCompliance(data);
  const computedEmpty = result.truckEmpty;
  const computedGVWR  = result.truckGVWR;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email || '').trim());
  const leadValid = !!(
    data.firstName.trim() && data.lastName.trim() && data.company.trim() &&
    data.phone.trim() && emailValid
  );

  if (submitted) return (
    <ThankYouState data={data} result={result} onRestart={() => {
      setSubmitted(false);
      setData(d => ({ ...d, firstName: '', lastName: '', company: '', phone: '', email: '' }));
    }} />
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F2', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {!termsAccepted && <TermsGate onAccept={acceptTerms} />}
      <ToolBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Title block */}
        <div style={{ marginBottom: 28, maxWidth: 720 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#CC1F1F',
            marginBottom: 12, padding: '5px 10px', background: '#FDEAEA',
            border: '1px solid #F5C2C2', borderRadius: 2,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#CC1F1F' }} />
            FREE TOOL · NO ACCOUNT NEEDED
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed'", fontSize: 56, fontWeight: 900,
            textTransform: 'uppercase', color: '#1A1A1A', margin: '0 0 12px',
            lineHeight: 0.95, letterSpacing: '-0.01em',
          }}>
            Axle &amp; GVWR <span style={{ color: '#CC1F1F' }}>Compliance Check</span>
          </h1>
          <p style={{ fontFamily: "'IBM Plex Sans'", fontSize: 16, color: '#444', margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
            Enter your truck and load specs and see your <strong style={{ color: '#1A1A1A' }}>DOT-ready
            compliance report, an axle-by-axle breakdown, and a load-rebalance plan</strong> — instantly,
            right on screen. Free, no obligation.
          </p>
        </div>

        {/* Two-column workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 16, alignItems: 'start' }}>

          {/* LEFT: Calculator inputs */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{
              padding: '14px 22px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#1A1A1A', letterSpacing: '0.04em' }}>① Your Setup</div>
              <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live calculation</div>
            </div>
            <div style={{ padding: 22 }}>
              <SectionHeader>Vehicle</SectionHeader>

              {/* Mode toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#F2F2F2', padding: 3, borderRadius: 3, marginBottom: 14 }}>
                {[{ v: 'model' as const, label: 'Use model estimate' }, { v: 'manual' as const, label: 'Enter my own specs' }].map(o => (
                  <button key={o.v} type="button" onClick={() => set('specMode', o.v)} style={{
                    background: data.specMode === o.v ? '#fff' : 'transparent',
                    color: data.specMode === o.v ? '#1A1A1A' : '#666',
                    border: 'none', borderRadius: 2, padding: '9px 0',
                    fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                    boxShadow: data.specMode === o.v ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  }}>{o.label}</button>
                ))}
              </div>

              {data.specMode === 'model' ? (
                <>
                  {/* Estimates disclaimer */}
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    background: '#FFF7E6', border: '1px solid #F2D89A',
                    borderLeft: '3px solid #E8600A', borderRadius: 3,
                    padding: '8px 10px', marginBottom: 14,
                  }}>
                    <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 13, color: '#E8600A', letterSpacing: '0.06em', flexShrink: 0 }}>!</span>
                    <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#5C4310', lineHeight: 1.45 }}>
                      <strong style={{ color: '#1A1A1A' }}>Estimates only.</strong>{' '}
                      Model weights are typical industry averages — your actual truck can vary by 1,000–3,000 lbs depending on options.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Make">
                      <CalcSelect value={data.truckMake}
                        onChange={v => {
                          set('truckMake', v);
                          const first = (TRUCK_MODELS[v] || [])[0];
                          set('truckModel', first ? first.model : '');
                        }}
                        options={Object.keys(TRUCK_MODELS)} />
                    </Field>
                    <Field label="Model">
                      <CalcSelect value={data.truckModel}
                        onChange={v => set('truckModel', v)}
                        options={(TRUCK_MODELS[data.truckMake] || []).map(m => m.model)}
                        placeholder="Select" />
                    </Field>
                  </div>

                  <Field label="Rear axle configuration" hint="Tandem raises your GVWR limit">
                    <CalcSelect value={data.axleConfig}
                      onChange={v => set('axleConfig', v as 'single' | 'tandem')}
                      options={TRUCK_SPECS.axleConfig.map(o => ({ value: o.value, label: o.label }))} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Cab">
                      <CalcSelect value={data.cabType} onChange={v => set('cabType', v)}
                        options={TRUCK_SPECS.cab.map(o => ({ value: o.value, label: o.label }))} />
                    </Field>
                    <Field label="Fuel tanks">
                      <CalcSelect value={data.fuelTank} onChange={v => set('fuelTank', v)}
                        options={TRUCK_SPECS.fuel.map(o => ({ value: o.value, label: o.label }))} />
                    </Field>
                  </div>

                  <Field label="Wet kit / hydraulics">
                    <CalcSelect value={data.wetKit} onChange={v => set('wetKit', v)}
                      options={TRUCK_SPECS.wetkit.map(o => ({ value: o.value, label: o.label }))} />
                  </Field>

                  {/* Auto-computed weight summary */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                    background: '#FAFAFA', border: '1px solid #E5E5E5',
                    borderLeft: '3px solid #CC1F1F', borderRadius: 3, padding: '10px 12px', marginTop: 4,
                  }}>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Empty (est.)</div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
                        {computedEmpty.toLocaleString()} <span style={{ fontSize: 10, color: '#888' }}>lbs</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.12em' }}>GVWR ({data.axleConfig})</div>
                      <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 15, fontWeight: 700, color: '#CC1F1F' }}>
                        {computedGVWR.toLocaleString()} <span style={{ fontSize: 10, color: '#888' }}>lbs</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#666', lineHeight: 1.45, marginBottom: 12 }}>
                    Enter the exact numbers from your door jamb sticker for the most accurate result.
                  </div>
                  <Field label="Empty Truck Weight" hint="Curb weight, no cargo">
                    <TextInput value={data.truckEmptyWeight} onChange={v => set('truckEmptyWeight', v)} type="number" suffix="lbs" />
                  </Field>
                  <Field label="Truck GVWR" hint="From door jamb sticker">
                    <TextInput value={data.truckGVWR} onChange={v => set('truckGVWR', v)} type="number" suffix="lbs" />
                  </Field>
                  <Field label="Rear axle configuration" hint="Affects axle-load calculations">
                    <CalcSelect value={data.axleConfig}
                      onChange={v => set('axleConfig', v as 'single' | 'tandem')}
                      options={TRUCK_SPECS.axleConfig.map(o => ({ value: o.value, label: o.label }))} />
                  </Field>
                </>
              )}

              <SectionHeader style={{ marginTop: 18 }}>Forklift</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Brand">
                  <CalcSelect value={data.forkliftBrand}
                    onChange={v => { set('forkliftBrand', v); set('forkliftModel', ''); }}
                    options={Object.keys(FORKLIFT_MODELS)} />
                </Field>
                <Field label="Model">
                  <CalcSelect value={data.forkliftModel}
                    onChange={v => {
                      set('forkliftModel', v);
                      const f = (FORKLIFT_MODELS[data.forkliftBrand] || []).find(x => x.model === v);
                      if (f) set('forkliftWeight', f.weight);
                    }}
                    options={(FORKLIFT_MODELS[data.forkliftBrand] || []).map(x => x.model)}
                    placeholder="Select" />
                </Field>
              </div>
              <Field label="Forklift Weight" hint="Auto-fills from model">
                <SliderInput value={data.forkliftWeight} onChange={v => set('forkliftWeight', v)} min={0} max={9000} step={100} suffix="lbs" />
              </Field>

              <SectionHeader style={{ marginTop: 18 }}>Cargo</SectionHeader>
              <Field label="Average Cargo Weight">
                <SliderInput value={data.cargoWeight} onChange={v => set('cargoWeight', v)} min={0} max={50000} step={500} suffix="lbs" />
              </Field>
            </div>
          </div>

          {/* RIGHT: Status + lead form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Live status card */}
            {leadValid ? (
              <div style={{
                background: result.passing
                  ? 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)'
                  : 'linear-gradient(135deg, #850F0F 0%, #CC1F1F 100%)',
                borderRadius: 4, color: '#fff', overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div style={{
                      fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: result.passing ? '#CC1F1F' : 'rgba(255,255,255,0.85)', marginBottom: 6,
                    }}>Preliminary Status</div>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 38, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, color: '#fff' }}>
                      {result.passing ? 'LIKELY COMPLIANT' : 'OVER LIMIT'}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                      Estimated · We verify with your real DOT specs.
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 24 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Total GVW</div>
                    <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 30, fontWeight: 700, color: '#fff', marginTop: 4, lineHeight: 1 }}>
                      {Math.round(result.totalGVW).toLocaleString()}
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>lbs</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.checks.map((c, i) => {
                    const pct = Math.min(100, (c.actual / c.limit) * 100);
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 90px', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{c.label}</div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: c.pass ? '#fff' : '#FF6B6B', transition: 'width 250ms ease-out' }} />
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: c.pass ? 'rgba(255,255,255,0.7)' : '#FF9999', textAlign: 'right', fontWeight: 600 }}>
                          {Math.round(c.actual / c.limit * 100)}% of max
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <LockedStatusCard checks={result.checks} />
            )}

            {/* Lead form */}
            <div style={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{
                padding: '14px 22px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#1A1A1A', letterSpacing: '0.04em' }}>② Claim Your Free Compliance Package</div>
                <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>$0 · No obligation</div>
              </div>

              {/* What you'll get */}
              <div style={{ padding: '18px 22px 6px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 500, color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
                  What you&apos;ll unlock — the moment you submit
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { tag: 'PDF',  title: 'DOT-Ready Compliance Report',     sub: 'Reviewed and signed off. Show it at a roadside check.' },
                    { tag: 'CALC', title: 'Exact Axle-by-Axle Breakdown',    sub: 'Steer, drive, trailer — what passes, what fails.' },
                    { tag: 'FIX',  title: 'Load Rebalance Recommendation',   sub: 'Move the forklift X inches, shift Y lbs forward.' },
                    { tag: 'SAVE', title: 'Lighter Forklift Alternatives',   sub: 'Hand-picked from 100s of units in stock.' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0' }}>
                      <div style={{
                        flexShrink: 0, fontFamily: "'IBM Plex Mono'", fontSize: 9, fontWeight: 600,
                        color: '#CC1F1F', background: '#FDEAEA', border: '1px solid #F5C2C2',
                        padding: '3px 6px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase',
                        minWidth: 40, textAlign: 'center',
                      }}>{item.tag}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11.5, color: '#666', lineHeight: 1.4 }}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '18px 22px 22px' }}>
                <p style={{ fontFamily: "'IBM Plex Sans'", fontSize: 12.5, color: '#444', margin: '0 0 14px', lineHeight: 1.5 }}>
                  Add your details to unlock your full results. No spam, no robo-dials — just your report.
                </p>
                <div style={{ background: '#FAFAFA', border: '1px solid #ECECEC', borderRadius: 6, padding: '18px 18px 2px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="First Name" required>
                      <TextInput value={data.firstName} onChange={v => set('firstName', v)} placeholder={example.first} />
                    </Field>
                    <Field label="Last Name" required>
                      <TextInput value={data.lastName} onChange={v => set('lastName', v)} placeholder={example.last} />
                    </Field>
                  </div>
                  <Field label="Company" required>
                    <TextInput value={data.company} onChange={v => set('company', v)} placeholder={example.company} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Phone" required>
                      <TextInput value={data.phone} onChange={v => set('phone', v)} type="tel" placeholder={example.phone} />
                    </Field>
                    <Field label="Email" required>
                      <TextInput value={data.email} onChange={v => set('email', v)} type="email" placeholder={example.email} />
                    </Field>
                  </div>
                </div>

                <button onClick={() => leadValid && setSubmitted(true)} disabled={!leadValid} style={{
                  width: '100%', marginTop: 14,
                  background: leadValid ? '#CC1F1F' : '#CCC',
                  color: '#fff', fontFamily: "'IBM Plex Sans'", fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', padding: '17px',
                  border: 'none', borderRadius: 3, cursor: leadValid ? 'pointer' : 'not-allowed',
                  transition: 'background 150ms',
                }}>Show My Results →</button>

                <div style={{ textAlign: 'center', marginTop: 10, fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#666' }}>
                  Your full results appear instantly. We&apos;ll only reach out if we can help.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page footer */}
        <div style={{
          marginTop: 36, paddingTop: 20, borderTop: '1px solid #E5E5E5',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#888' }}>
            © Equipment Remarketing LLC · This tool gives a non-binding estimate. Confirm with a DOT scale before haul.
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#888' }}>
            {showLeadsBtn && (
              <button onClick={downloadLeadsCSV} style={{
                fontFamily: "'IBM Plex Mono'", fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#1A1A1A', background: '#fff', border: '1px solid #CC1F1F',
                borderRadius: 3, padding: '7px 12px', cursor: 'pointer',
              }}>↓ Download leads (CSV)</button>
            )}
            <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: '#888', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
