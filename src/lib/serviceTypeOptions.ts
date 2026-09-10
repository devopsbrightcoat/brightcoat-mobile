import type { ServiceCategory } from '../types'

// Mismas opciones/etiquetas que ops-web (ConfiguracionServicios.tsx +
// AddServiceTypeModal/EditServiceTypeModal) — centralizadas acá igual que
// propertyOptions.ts/employeeOptions.ts.
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
