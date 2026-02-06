// Synthetic data generation for business analytics dashboard

export interface BusinessData {
  sector: string;
  size: CompanySize;
  city: string;
  lat: number;
  lng: number;
  employees: number;
  annual_revenue_mxn: number;
  weekly_minutes: number;
  sessions_per_week: number;
  courses_taken: number;
  certifications: number;
  ai_messages: number;
  community_connections: number;
  goal: string;
  visits: Record<string, number>;
}

export type CompanySize = "Micro" | "Pequeña" | "Mediana" | "Grande";

export const SECTORS = [
  "Comercio minorista",
  "Servicios profesionales",
  "Manufactura",
  "Tecnología",
  "Alimentos y bebidas",
  "Salud",
  "Construcción",
  "Turismo",
  "Educación",
  "Logística"
];

export const SECTOR_PROBS = [0.18, 0.16, 0.11, 0.10, 0.12, 0.08, 0.07, 0.06, 0.06, 0.06];

export const COMPANY_SIZES: CompanySize[] = ["Micro", "Pequeña", "Mediana", "Grande"];

export const GOALS = [
  "Aumentar ventas",
  "Digitalizar procesos",
  "Ordenar finanzas",
  "Mejorar atención"
];

export const CITIES = [
  "CDMX",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Tijuana",
  "Mérida",
  "Querétaro",
  "León",
  "Toluca",
  "Cancún"
];

export const CITY_COORDS: Record<string, [number, number]> = {
  "CDMX": [19.4326, -99.1332],
  "Guadalajara": [20.6597, -103.3496],
  "Monterrey": [25.6866, -100.3161],
  "Puebla": [19.0413, -98.2062],
  "Tijuana": [32.5149, -117.0382],
  "Mérida": [20.9674, -89.5926],
  "Querétaro": [20.5888, -100.3899],
  "León": [21.1220, -101.6820],
  "Toluca": [19.2826, -99.6557],
  "Cancún": [21.1619, -86.8515]
};

export const SECTOR_REVENUE_MULTIPLIER: Record<string, number> = {
  "Comercio minorista": 0.9,
  "Servicios profesionales": 1.0,
  "Manufactura": 1.4,
  "Tecnología": 1.3,
  "Alimentos y bebidas": 0.95,
  "Salud": 1.2,
  "Construcción": 1.5,
  "Turismo": 0.85,
  "Educación": 0.8,
  "Logística": 1.1
};

export const BASE_REVENUE: Record<CompanySize, number> = {
  "Micro": 1.2e6,
  "Pequeña": 4.0e6,
  "Mediana": 25.0e6,
  "Grande": 120.0e6
};

export const SIZE_MINUTES: Record<CompanySize, number> = {
  "Micro": 55,
  "Pequeña": 65,
  "Mediana": 80,
  "Grande": 95
};

export const SECTIONS = [
  "Cursos",
  "IA",
  "Comunidad",
  "Marketplace",
  "MiCoparmex",
  "Eventos"
];

export const SIZE_SECTION_PREF: Record<CompanySize, number[]> = {
  "Micro": [0.32, 0.25, 0.18, 0.10, 0.10, 0.05],
  "Pequeña": [0.30, 0.26, 0.18, 0.12, 0.09, 0.05],
  "Mediana": [0.26, 0.28, 0.19, 0.14, 0.09, 0.04],
  "Grande": [0.22, 0.30, 0.20, 0.18, 0.07, 0.03]
};

// Random number generators
function randChoiceWeighted<T>(items: T[], probs: number[]): T {
  const r = Math.random();
  const cumulative = probs.reduce((acc, p, i) => {
    acc.push((acc[i - 1] || 0) + p);
    return acc;
  }, [] as number[]);
  const x = r * cumulative[cumulative.length - 1];
  for (let i = 0; i < cumulative.length; i++) {
    if (x <= cumulative[i]) return items[i];
  }
  return items[items.length - 1];
}

function randNormal(mean = 0, sd = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return z * sd + mean;
}

function randLogNormal(mean = 0, sd = 1): number {
  return Math.exp(randNormal(mean, sd));
}

function randPoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Generate synthetic business data
export function generateBusinessData(count = 5737): BusinessData[] {
  const data: BusinessData[] = [];

  for (let i = 0; i < count; i++) {
    const sector = randChoiceWeighted(SECTORS, SECTOR_PROBS);
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const employees = clamp(Math.round(randLogNormal(2.5, 0.8)), 1, 2000);
    const size: CompanySize =
      employees < 10 ? "Micro" :
      employees < 50 ? "Pequeña" :
      employees < 250 ? "Mediana" : "Grande";

    const revenue = Math.round(
      BASE_REVENUE[size] *
      SECTOR_REVENUE_MULTIPLIER[sector] *
      randLogNormal(0, 0.35)
    );

    const weekly_minutes = clamp(randNormal(SIZE_MINUTES[size], 25), 5, 300);
    const sessions_per_week = clamp(randPoisson(3.5), 1, 30);

    // Generate visits distribution
    const base = Math.max(1, randPoisson(sessions_per_week * 1.4));
    const pref = SIZE_SECTION_PREF[size];
    const visits: Record<string, number> = {};
    let remaining = base;

    for (let s = 0; s < SECTIONS.length; s++) {
      let count =
        s === SECTIONS.length - 1
          ? remaining
          : Math.round(pref[s] * base + randNormal(0, 0.5));
      count = Math.max(0, count);
      remaining -= count;
      visits[SECTIONS[s]] = count;
    }

    const coursesConfig: Record<CompanySize, number> = {
      "Micro": 2.0,
      "Pequeña": 2.4,
      "Mediana": 3.0,
      "Grande": 3.4
    };

    const courses_taken = Math.max(0, randPoisson(coursesConfig[size]));
    const certifications = Math.max(
      0,
      courses_taken - Math.round(Math.random() * courses_taken * 0.4)
    );
    const ai_messages = Math.max(0, randPoisson(8));

    const connectionsConfig: Record<CompanySize, number> = {
      "Micro": 1.1,
      "Pequeña": 1.6,
      "Mediana": 2.2,
      "Grande": 2.7
    };

    const community_connections = Math.max(0, randPoisson(connectionsConfig[size]));
    const goal = GOALS[Math.floor(Math.random() * GOALS.length)];

    // Add jitter to coordinates
    const [lat0, lng0] = CITY_COORDS[city];
    const lat = lat0 + (Math.random() - 0.5) * 0.35;
    const lng = lng0 + (Math.random() - 0.5) * 0.35;

    data.push({
      sector,
      size,
      city,
      lat,
      lng,
      employees,
      annual_revenue_mxn: revenue,
      weekly_minutes,
      sessions_per_week,
      courses_taken,
      certifications,
      ai_messages,
      community_connections,
      goal,
      visits
    });
  }

  return data;
}

export function formatMoney(n: number): string {
  return n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  });
}

export interface FilterOptions {
  sector: string;
  size: string;
  city: string;
}

export function applyFilters(
  data: BusinessData[],
  filters: FilterOptions
): BusinessData[] {
  return data.filter(d =>
    (filters.sector === '*' || d.sector === filters.sector) &&
    (filters.size === '*' || d.size === filters.size) &&
    (filters.city === '*' || d.city === filters.city)
  );
}
