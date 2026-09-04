// Same palette as ops-web (src/index.css) and the client-landing site,
// taken from the BrightCoat logo.

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
}

export const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.1)', text: colors.amber },
  in_progress: { bg: 'rgba(56, 189, 248, 0.1)', text: colors.sky },
  completed: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
  paid: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
  active: { bg: 'rgba(52, 211, 153, 0.1)', text: colors.emerald },
  inactive: { bg: 'rgba(255, 255, 255, 0.05)', text: colors.ink400 },
}

export const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  completed: 'Completado',
  paid: 'Pagado',
  active: 'Activo',
  inactive: 'Inactivo',
}
