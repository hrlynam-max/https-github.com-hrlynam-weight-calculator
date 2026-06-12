// FMCSA federal limits
export const FED_LIMITS = {
  steerAxle: 12000,
  driveAxleSingle: 20000,
  driveAxleTandem: 34000,
  trailerAxleSingle: 20000,
  trailerAxleTandem: 34000,
  combinedGVWR: 80000,
};

export const TRUCK_MODELS: Record<string, { model: string; emptyWeight: number; gvwr: { single: number; tandem: number } }[]> = {
  'Freightliner': [
    { model: 'M2 106',            emptyWeight: 16500, gvwr: { single: 33000, tandem: 60000 } },
    { model: 'Cascadia 113',      emptyWeight: 17500, gvwr: { single: 35000, tandem: 66000 } },
    { model: 'Business Class M2', emptyWeight: 16000, gvwr: { single: 33000, tandem: 58000 } },
  ],
  'International': [
    { model: 'MV Series', emptyWeight: 16500, gvwr: { single: 33000, tandem: 60000 } },
    { model: 'HV Series', emptyWeight: 18500, gvwr: { single: 37000, tandem: 66000 } },
    { model: 'LT Series', emptyWeight: 17500, gvwr: { single: 35000, tandem: 66000 } },
  ],
  'Peterbilt': [
    { model: 'Model 337', emptyWeight: 14500, gvwr: { single: 33000, tandem: 56000 } },
    { model: 'Model 348', emptyWeight: 16500, gvwr: { single: 35000, tandem: 64000 } },
    { model: 'Model 389', emptyWeight: 21000, gvwr: { single: 40000, tandem: 80000 } },
  ],
  'Volvo': [
    { model: 'VHD', emptyWeight: 19000, gvwr: { single: 38000, tandem: 72000 } },
    { model: 'VNL', emptyWeight: 19500, gvwr: { single: 38000, tandem: 80000 } },
    { model: 'VNR', emptyWeight: 17500, gvwr: { single: 35000, tandem: 66000 } },
  ],
  'Kenworth': [
    { model: 'T370', emptyWeight: 14000, gvwr: { single: 33000, tandem: 56000 } },
    { model: 'T440', emptyWeight: 16500, gvwr: { single: 35000, tandem: 64000 } },
    { model: 'T880', emptyWeight: 22000, gvwr: { single: 40000, tandem: 80000 } },
  ],
  'Other': [
    { model: 'Custom', emptyWeight: 17000, gvwr: { single: 33000, tandem: 60000 } },
  ],
};

export const TRUCK_SPECS = {
  cab: [
    { value: 'day',         label: 'Day cab',           deltaWeight: 0 },
    { value: 'mid-sleeper', label: 'Mid-roof sleeper',  deltaWeight: 1200 },
    { value: 'hi-sleeper',  label: 'High-roof sleeper', deltaWeight: 2200 },
  ],
  fuel: [
    { value: 'single-100', label: 'Single 100 gal tank', deltaWeight: 0 },
    { value: 'dual-100',   label: 'Dual 100 gal tanks',  deltaWeight: 700 },
    { value: 'dual-150',   label: 'Dual 150 gal tanks',  deltaWeight: 1400 },
  ],
  wetkit: [
    { value: 'no',  label: 'No wet kit / hydraulics', deltaWeight: 0 },
    { value: 'yes', label: 'Wet kit installed',        deltaWeight: 600 },
  ],
  axleConfig: [
    { value: 'single', label: 'Single rear axle (4×2)', deltaWeight: 0 },
    { value: 'tandem', label: 'Tandem rear axles (6×4)', deltaWeight: 2200 },
  ],
};

export const FORKLIFT_MODELS: Record<string, { model: string; weight: number; capacity: number }[]> = {
  'Moffett': [
    { model: 'M5 25.3',    weight: 4400, capacity: 5500 },
    { model: 'M55',        weight: 5200, capacity: 5500 },
    { model: 'M8 55.3',    weight: 5400, capacity: 5500 },
    { model: 'M8 55.4 NX', weight: 5800, capacity: 5500 },
    { model: 'M9 NX',      weight: 6200, capacity: 6000 },
    { model: 'M11 100',    weight: 7800, capacity: 10000 },
  ],
  'Princeton': [
    { model: 'PB55.3',       weight: 5300, capacity: 5500 },
    { model: 'PB55.3X+',     weight: 5500, capacity: 5500 },
    { model: 'PB55.4',       weight: 6200, capacity: 5500 },
    { model: 'PBX',          weight: 5100, capacity: 5500 },
    { model: 'Teledyne D80', weight: 8400, capacity: 8000 },
  ],
  'Loadmac': [
    { model: '855 Super Reach', weight: 5600, capacity: 5500 },
    { model: '255 Ultra',       weight: 5400, capacity: 5500 },
    { model: '1055 4-Way',      weight: 6800, capacity: 6000 },
  ],
  'Other / Heavy-duty': [
    { model: 'Heavy 8,000 lb cap.',  weight: 8200, capacity: 8000 },
    { model: 'Heavy 10,000 lb cap.', weight: 8900, capacity: 10000 },
  ],
  'None / No mounting': [
    { model: 'No forklift', weight: 0, capacity: 0 },
  ],
};

export interface CalcData {
  specMode: 'model' | 'manual';
  truckMake: string;
  truckModel: string;
  truckEmptyWeight: number | string;
  truckGVWR: number | string;
  axleConfig: 'single' | 'tandem';
  cabType: string;
  fuelTank: string;
  wetKit: string;
  forkliftBrand: string;
  forkliftModel: string;
  forkliftWeight: number | string;
  cargoWeight: number | string;
  cargoForwardPct: number | string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
}

export interface ComplianceCheck {
  label: string;
  actual: number;
  limit: number;
  pass: boolean;
  detail: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  totalGVW: number;
  truckEmpty: number;
  truckGVWR: number;
  steerLoad: number;
  driveLoad: number;
  passing: boolean;
}

export function findTruckModel(make: string, model: string) {
  return (TRUCK_MODELS[make] || []).find(m => m.model === model);
}

export function computeTruckEmptyWeight(d: CalcData): number {
  if (d.specMode === 'manual') return +d.truckEmptyWeight || 0;
  const t = findTruckModel(d.truckMake, d.truckModel);
  if (!t) return +d.truckEmptyWeight || 0;
  let w = t.emptyWeight;
  const cab  = TRUCK_SPECS.cab.find(s => s.value === d.cabType);
  const fuel = TRUCK_SPECS.fuel.find(s => s.value === d.fuelTank);
  const wet  = TRUCK_SPECS.wetkit.find(s => s.value === d.wetKit);
  const axle = TRUCK_SPECS.axleConfig.find(s => s.value === d.axleConfig);
  if (cab)  w += cab.deltaWeight  || 0;
  if (fuel) w += fuel.deltaWeight || 0;
  if (wet)  w += wet.deltaWeight  || 0;
  if (axle) w += axle.deltaWeight || 0;
  return w;
}

export function computeTruckGVWR(d: CalcData): number {
  if (d.specMode === 'manual') return +d.truckGVWR || 0;
  const t = findTruckModel(d.truckMake, d.truckModel);
  if (!t) return +d.truckGVWR || 0;
  return d.axleConfig === 'tandem' ? t.gvwr.tandem : t.gvwr.single;
}

export function computeCompliance(d: CalcData): ComplianceResult {
  const truckEmpty = computeTruckEmptyWeight(d);
  const truckGVWR  = computeTruckGVWR(d);
  const fork  = +d.forkliftWeight || 0;
  const cargo = +d.cargoWeight    || 0;
  const cargoOnSteer = (+d.cargoForwardPct || 30) / 100;

  const steerLoad = truckEmpty * 0.35 + cargo * cargoOnSteer - fork * 0.08;
  const driveLoad = truckEmpty * 0.65 + cargo * (1 - cargoOnSteer) + fork * 1.08;
  const totalGVW  = truckEmpty + cargo + fork;

  const checks: ComplianceCheck[] = [
    {
      label: 'Total GVW vs Truck GVWR',
      actual: totalGVW,
      limit: truckGVWR,
      pass: truckGVWR > 0 && totalGVW <= truckGVWR,
      detail: d.axleConfig === 'tandem'
        ? 'Tandem-axle GVWR (manufacturer rated)'
        : 'Single-axle GVWR (manufacturer rated)',
    },
    {
      label: 'Total GVW vs Federal Limit',
      actual: totalGVW,
      limit: FED_LIMITS.combinedGVWR,
      pass: totalGVW <= FED_LIMITS.combinedGVWR,
      detail: 'Federal max (no permit) — 80,000 lbs',
    },
  ];

  const passing = checks.every(c => c.pass);
  return { checks, totalGVW, truckEmpty, truckGVWR,
           steerLoad: Math.max(0, steerLoad), driveLoad, passing };
}

export interface InventoryItem {
  id: number;
  title: string;
  category: string;
  condition: string;
  specs: string[];
  price: number | null;
  guaranteed: boolean;
  forCargo: string;
}

export function recommendInventory(d: CalcData): InventoryItem[] {
  const cargo = +d.cargoWeight || 0;
  const all: InventoryItem[] = [
    { id: 1, title: '2021 Moffett M55',          category: 'Used Forklift',    condition: 'Used', specs: ['5,200 lbs', '5,500 lb cap.', 'Diesel'],        price: 37900, guaranteed: true,  forCargo: 'Light' },
    { id: 2, title: '2022 Moffett M8 55.3',      category: 'Used Forklift',    condition: 'Used', specs: ['5,400 lbs', '5,500 lb cap.', 'Tier 4'],         price: 42500, guaranteed: true,  forCargo: 'Medium' },
    { id: 3, title: '2023 Princeton PB55.3X+',   category: 'Used Forklift',    condition: 'Used', specs: ['5,500 lbs', '5,500 lb cap.', '4-way'],          price: 48900, guaranteed: true,  forCargo: 'Heavy' },
    { id: 4, title: 'Loadmac 855 Super Reach',   category: 'New Forklift',     condition: 'New',  specs: ['5,600 lbs', 'Telescopic', '8 ft reach'],        price: null,  guaranteed: false, forCargo: 'Heavy' },
    { id: 5, title: 'Steel/Alum Combo Trailer',  category: 'Flatbed Trailer',  condition: 'Used', specs: ['48 ft', 'EZ Hitch ready', 'Air ride'],           price: 28500, guaranteed: true,  forCargo: 'Any' },
  ];
  if (cargo < 8000)  return [all[0], all[1], all[4]];
  if (cargo < 14000) return [all[1], all[2], all[4]];
  return [all[2], all[3], all[4]];
}
