'use client';

import React from 'react';

export const Field = ({ label, hint, error, children, required }: {
  label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean;
}) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, fontWeight: 600,
      color: '#1A1A1A', letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase',
    }}>
      <span>{label}{required && <span style={{ color: '#CC1F1F', marginLeft: 3 }}>*</span>}</span>
      {hint && <span style={{ fontSize: 10, color: '#888', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{hint}</span>}
    </label>
    {children}
    {error && <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#CC1F1F', marginTop: 4 }}>{error}</div>}
  </div>
);

export const TextInput = ({ value, onChange, type = 'text', placeholder, suffix }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; suffix?: string;
}) => (
  <div style={{ position: 'relative' }}>
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', fontFamily: "'IBM Plex Sans'", fontSize: 15,
        padding: suffix ? '12px 56px 12px 14px' : '12px 14px',
        border: '1px solid #E5E5E5', borderRadius: 4, outline: 'none', color: '#1C1C1C',
        background: '#fff', transition: 'border-color 150ms ease-out',
      }}
      onFocus={e => { e.target.style.borderColor = '#CC1F1F'; }}
      onBlur={e => { e.target.style.borderColor = '#E5E5E5'; }}
    />
    {suffix && (
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        fontFamily: "'IBM Plex Mono'", fontSize: 12, color: '#888', fontWeight: 500,
        pointerEvents: 'none',
      }}>{suffix}</span>
    )}
  </div>
);

export const CalcSelect = ({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: (string | { value: string; label: string })[]; placeholder?: string;
}) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', fontFamily: "'IBM Plex Sans'", fontSize: 15,
      padding: '12px 14px', border: '1px solid #E5E5E5', borderRadius: 4,
      outline: 'none', color: value ? '#1C1C1C' : '#888', background: '#fff', appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 4.5L6 7.5L9 4.5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
    }}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => typeof o === 'string'
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.value} value={o.value}>{o.label}</option>
    )}
  </select>
);

export const SliderInput = ({ value, onChange, min, max, step = 1, suffix }: {
  value: number | string; onChange: (v: string) => void;
  min: number; max: number; step?: number; suffix?: string;
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 22, fontWeight: 700, color: '#CC1F1F' }}>
        {(+value || 0).toLocaleString()}
        {suffix && <span style={{ fontSize: 13, marginLeft: 4, color: '#888' }}>{suffix}</span>}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: '#888' }}>
        {min.toLocaleString()} – {max.toLocaleString()}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step}
      value={+value || min}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', accentColor: '#CC1F1F' }}
    />
  </div>
);

export const SectionHeader = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    fontFamily: "'Barlow Condensed'", fontSize: 14, fontWeight: 700,
    textTransform: 'uppercase', color: '#1A1A1A', letterSpacing: '0.08em',
    paddingBottom: 6, borderBottom: '2px solid #CC1F1F', marginBottom: 14, ...style,
  }}>{children}</div>
);

export const InlineTrustStrip = () => (
  <div style={{
    display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center',
    padding: '14px 0', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5',
    background: '#F8F8F8', flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        background: '#1A1A1A', color: '#fff', fontFamily: "'Barlow Condensed'",
        fontWeight: 800, fontSize: 11, padding: '3px 6px', borderRadius: 2, letterSpacing: '0.04em',
      }}>BBB</div>
      <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#444', fontWeight: 600 }}>Accredited Business</span>
    </div>
    <div style={{ width: 1, height: 18, background: '#E5E5E5' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC1F1F' }} />
      <span style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#444', fontWeight: 600 }}>100s of units in stock</span>
    </div>
    <div style={{ width: 1, height: 18, background: '#E5E5E5' }} />
    <div style={{ fontFamily: "'IBM Plex Sans'", fontSize: 11, color: '#444', fontWeight: 600 }}>
      Call <a href="tel:8887083980" style={{ color: '#CC1F1F', textDecoration: 'none' }}>(888) 708-3980</a>
    </div>
  </div>
);
