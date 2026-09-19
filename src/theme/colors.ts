
// Paleta oscura (la original de la app). Se mantiene intacta: es la base
// desde la que se deriva `lightColors` más abajo, y sigue siendo la que se
// usa en zonas que se quedan siempre oscuras (por ejemplo el drawer lateral,
// ver navigation/DrawerContent.tsx).
export const colors = {
  brand50: '#eef2fa',
  brand100: '#d6e0f2',
  brand200: '#adc2e6',
  brand300: '#84a3d9',
  brand400: '#5c85cc',
  brand500: '#3d68b0',
  brand600: '#2a5090',
  brand700: '#1c3b70',
  brand800: '#122a52',
  brand900: '#0b1c38',

  gold50: '#fdf7e7',
  gold100: '#faebc0',
  gold200: '#f4d688',
  gold300: '#edbe57',
  gold400: '#e3a730',
  gold500: '#cf9122',
  gold600: '#ad7519',
  gold700: '#895b13',
  gold800: '#63420d',
  gold900: '#402a08',

  ink50: '#f8fafc',
  ink100: '#f1f5f9',
  ink200: '#e2e8f0',
  ink300: '#cbd5e1',
  ink400: '#94a3b8',
  ink500: '#64748b',
  ink600: '#475569',
  ink700: '#334155',
  ink800: '#1e293b',
  ink900: '#0f172a',

  surface: '#17181d',
  surfaceAlt: '#1e1f25',

  white: '#ffffff',
  emerald: '#34d399',
  amber: '#fbbf24',
  sky: '#38bdf8',
  rose: '#f87171',

  // Tintes neutros a base de blanco, usados para bordes y fondos sutiles
  // (divisores de tarjetas, resaltados de fila, etc.) sobre las superficies
  // oscuras. En `lightColors` se redefinen con la misma alfa pero a base de
  // brand900, para que sigan leyéndose como "un tinte sutil sobre la
  // superficie" en vez de casi desaparecer sobre fondo claro.
  tint05: 'rgba(255,255,255,0.05)',
  tint06: 'rgba(255,255,255,0.06)',
  tint08: 'rgba(255,255,255,0.08)',
  tint10: 'rgba(255,255,255,0.1)',
  tint12: 'rgba(255,255,255,0.12)',
  tint25: 'rgba(255,255,255,0.25)',
}

export type ThemeColors = typeof colors

// Paleta clara: se deriva de `colors` reflejando la escala `ink` (mismo
// truco que en ops-web/src/index.css) y ajustando superficie/fondo/blanco.
// Los acentos (brand, gold, emerald, amber, sky, rose) se mantienen iguales
// en ambos temas a propósito — ya tienen buen contraste sobre fondos claros
// y oscuros, y así no hay que retocar cada botón/estado uno por uno.
export const lightColors: ThemeColors = {
  ...colors,

  ink50: colors.ink900,
  ink100: colors.ink800,
  ink200: colors.ink700,
  ink300: colors.ink600,
  ink400: colors.ink500,
  ink500: colors.ink400,
  ink600: colors.ink300,
  ink700: colors.ink200,
  ink800: colors.ink100,
  ink900: colors.ink50,

  surface: '#f8fafc',
  surfaceAlt: '#ffffff',

  // El "blanco" deja de ser el texto de mayor contraste sobre superficie
  // oscura y pasa a ser el navy más oscuro de la marca — mismo rol
  // (texto/ícono de máximo contraste), distinto valor por tema.
  white: colors.brand900,

  tint05: 'rgba(11,28,56,0.05)',
  tint06: 'rgba(11,28,56,0.06)',
  tint08: 'rgba(11,28,56,0.08)',
  tint10: 'rgba(11,28,56,0.1)',
  tint12: 'rgba(11,28,56,0.12)',
  tint25: 'rgba(11,28,56,0.25)',
}

export type ThemeScheme = 'light' | 'dark'

export const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  completed: 'Completado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  rescheduled: 'Reagendado',
  paid: 'Pagado',
  approved: 'Aprobado',
  active: 'Activo',
  inactive: 'Inactivo',
}

// Los tintes de color (ámbar, cielo, esmeralda, rosa) quedan iguales en los
// dos temas — solo los neutros ("rescheduled"/"inactive", que antes eran un
// tinte de blanco fijo) cambian según el esquema activo, para no volverse
// casi invisibles sobre una tarjeta clara.
export const getStatusColors = (scheme: ThemeScheme): Record<string, { bg: string; text: string }> => {
  const c = scheme === 'light' ? lightColors : colors
  return {
    pending: { bg: 'rgba(251, 191, 36, 0.1)', text: colors.amber },
    in_progress: { bg: 'rgba(56, 189, 248, 0.1)', text: colors.sky },
    completed: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
    delivered: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
    cancelled: { bg: 'rgba(248, 113, 113, 0.1)', text: colors.rose },
    rescheduled: { bg: c.tint05, text: c.ink400 },
    paid: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
    approved: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
    active: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
    inactive: { bg: c.tint05, text: c.ink400 },
  }
}
