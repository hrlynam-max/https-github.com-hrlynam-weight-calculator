import type { CalcData, ComplianceResult } from './calculator-engine';

export interface ReportRec {
  tag: string;
  title: string;
  body: string;
}

export interface Report {
  id: string;
  date: string;
  severity: 'clear' | 'tight' | 'mild' | 'moderate' | 'severe';
  headline: string;
  bottomLine: string;
  breakdown: { label: string; value: number; note: string }[];
  recs: ReportRec[];
  fineEstimate: { range: string; note: string } | null;
  snapshot: Record<string, string>;
}

export function generateReport(data: CalcData, result: ComplianceResult): Report {
  const id = `WR-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const date = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const truckGVWR  = result.truckGVWR || 0;
  const totalGVW   = result.totalGVW  || 0;
  const truckEmpty = result.truckEmpty || 0;
  const fork  = +data.forkliftWeight || 0;
  const cargo = +data.cargoWeight    || 0;

  const gvwrCheck = result.checks.find(c => c.label.includes('Truck GVWR'));
  const fedCheck  = result.checks.find(c => c.label.includes('Federal'));

  const overGVWR = gvwrCheck && !gvwrCheck.pass ? Math.round(gvwrCheck.actual - gvwrCheck.limit) : 0;
  const overFed  = fedCheck  && !fedCheck.pass  ? Math.round(fedCheck.actual  - fedCheck.limit)  : 0;
  const worstOverage = Math.max(overGVWR, overFed);

  let severity: Report['severity'];
  let headline: string;
  let bottomLine: string;

  if (result.passing) {
    if (totalGVW > truckGVWR * 0.92) {
      severity = 'tight';
      headline = 'Compliant — but running close to your GVWR ceiling.';
      bottomLine = `You're inside the limits, but at ${Math.round(totalGVW / truckGVWR * 100)}% of your truck's GVWR. ` +
        `One pallet over your usual haul and you're over. Worth a buffer.`;
    } else {
      severity = 'clear';
      headline = 'Compliant. You have headroom on every check.';
      bottomLine = `Total GVW is ${(truckGVWR - totalGVW).toLocaleString()} lbs under your truck's GVWR, ` +
        `and ${(80000 - totalGVW).toLocaleString()} lbs under the federal cap. Safe to haul on this configuration.`;
    }
  } else if (worstOverage < 2000) {
    severity = 'mild';
    headline = `Mildly overweight — ${worstOverage.toLocaleString()} lbs over.`;
    bottomLine = `This is the kind of overage you can usually rebalance your way out of. ` +
      `Roadside scales will catch it, but a load shift or a lighter forklift fixes it. Don't haul as-is.`;
  } else if (worstOverage < 5000) {
    severity = 'moderate';
    headline = `Overweight — ${worstOverage.toLocaleString()} lbs over the limit.`;
    bottomLine = `At this overage you're looking at CSA points if you get pulled. ` +
      `Rebalancing alone probably won't get you legal — you likely need a lighter forklift or a different cargo plan.`;
  } else {
    severity = 'severe';
    headline = `Severely overweight — ${worstOverage.toLocaleString()} lbs over.`;
    bottomLine = `Do not haul this configuration. Penalties at this level typically include ` +
      `out-of-service orders and CSA points that follow your fleet for two years. This is a vehicle pairing problem, not a load problem.`;
  }

  const breakdown = [
    { label: 'Empty truck', value: truckEmpty, note: data.specMode === 'manual' ? 'From your entry' : `${data.truckMake} ${data.truckModel} estimate` },
    { label: 'Forklift',    value: fork,       note: fork > 0 ? `${data.forkliftBrand} ${data.forkliftModel || ''}`.trim() : 'No forklift mounted' },
    { label: 'Cargo',       value: cargo,      note: 'Average load weight' },
  ];

  const recs: ReportRec[] = [];
  if (!result.passing) {
    if (overGVWR > 0 && overGVWR >= overFed) {
      if (overGVWR < 2500 && fork >= 5000) {
        recs.push({
          tag: 'OPTION 1',
          title: `Switch to a forklift ~${Math.round(overGVWR / 100) * 100}–${Math.round((overGVWR + 1000) / 100) * 100} lbs lighter`,
          body: `A Moffett M5 25.3 (4,400 lbs) or Princeton PBX (5,100 lbs) drops you under the GVWR ` +
                `without giving up much capacity. Saves you ${overGVWR.toLocaleString()}+ lbs vs your current ${data.forkliftBrand} ${data.forkliftModel}.`,
        });
      }
      if (data.axleConfig === 'single') {
        recs.push({
          tag: 'OPTION 2',
          title: 'Move to a tandem-axle truck',
          body: `Your single-axle rear is the constraint. A tandem configuration on the same model raises GVWR ` +
                `from ${truckGVWR.toLocaleString()} to typically 60,000–66,000 lbs. We have tandem ${data.truckMake} units in stock.`,
        });
      } else {
        recs.push({
          tag: 'OPTION 2',
          title: `Lighten the cargo by ${overGVWR.toLocaleString()} lbs`,
          body: `If you can't change vehicles, the load has to come down. Splitting into two trips or shedding ` +
                `${overGVWR.toLocaleString()} lbs of cargo gets you legal on this setup.`,
        });
      }
    }
    if (overFed > 0) {
      recs.push({
        tag: 'FEDERAL',
        title: `Get a special-haul permit OR reduce GVW below 80,000`,
        body: `You're ${overFed.toLocaleString()} lbs over the federal interstate limit. Most states issue ` +
              `over-80k permits in 24–48 hrs (typically $25–$100), but they restrict routes and travel times.`,
      });
    }
  } else {
    if (severity === 'tight') {
      recs.push({
        tag: 'BUFFER',
        title: 'Build in a margin for variable loads',
        body: `You're at ${Math.round(totalGVW / truckGVWR * 100)}% of GVWR. If your cargo fluctuates ±15% by trip, ` +
              `you'll cross the line on heavier days. Consider a tandem upgrade or a slightly lighter forklift for the buffer.`,
      });
    }
    recs.push({
      tag: 'NEXT TIME',
      title: 'Confirm with a CAT scale before your first haul',
      body: `Model-based estimates can be off by 1,000–3,000 lbs depending on factory options. A $15 weigh ticket ` +
            `gives you the real number and a paper trail if you're ever questioned roadside.`,
    });
  }

  const fineEstimate = !result.passing ? {
    range: `$${Math.round(worstOverage * 0.05).toLocaleString()} – $${Math.round(worstOverage * 1.00).toLocaleString()}`,
    note: 'Per-pound penalties vary by state. CA, OR, and NY are at the high end; most southern states at the low end.',
  } : null;

  return {
    id, date, severity, headline, bottomLine, breakdown, recs, fineEstimate,
    snapshot: {
      truck:      data.specMode === 'manual' ? 'Custom (manual entry)' : `${data.truckMake} ${data.truckModel}`,
      axleConfig: data.axleConfig === 'tandem' ? 'Tandem rear axles (6×4)' : 'Single rear axle (4×2)',
      forklift:   fork > 0 ? `${data.forkliftBrand} ${data.forkliftModel || ''} (${fork.toLocaleString()} lbs)`.trim() : 'None',
      cargo:      `${cargo.toLocaleString()} lbs avg.`,
      totalGVW:   `${Math.round(totalGVW).toLocaleString()} lbs`,
      gvwrLimit:  `${truckGVWR.toLocaleString()} lbs`,
      fedLimit:   '80,000 lbs',
    },
  };
}
