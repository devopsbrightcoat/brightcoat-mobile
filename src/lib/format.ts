// Utilidades de formato compartidas por las pantallas de Finanzas (Cobros,
// Gastos, Planillas) — antes cada pantalla tenía su propia copia de
// `currency` (o la importaba de mocks/data.ts, que no tiene sentido para
// datos reales). Mismo formato que ops-web (sin decimales, como los montos
// de este negocio son siempre en dólares enteros o casi).
export const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
