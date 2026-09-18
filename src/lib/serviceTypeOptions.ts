import type { ServiceCategory } from '../types'

export const SERVICE_CATEGORY_OPTIONS: { value: ServiceCategory; label: string }[] = [
  { value: 'painting', label: 'Pintura' },
  { value: 'cleaning', label: 'Limpieza' },
  { value: 'make_ready', label: 'Make Ready' },
  { value: 'repair', label: 'Reparación' },
  { value: 'other', label: 'Otro' },
]

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  painting: 'Pintura',
  cleaning: 'Limpieza',
  make_ready: 'Make Ready',
  repair: 'Reparación',
  other: 'Otro',
}
