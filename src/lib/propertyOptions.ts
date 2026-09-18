import type { ClientType, PropertyStatus } from '../types'

export const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'residential', label: 'Residencial' },
  { value: 'multifamily', label: 'Multifamiliar' },
  { value: 'property_manager', label: 'Property manager' },
]

export const PROPERTY_STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export const clientTypeLabels: Record<ClientType, string> = {
  residential: 'Residencial',
  multifamily: 'Multifamiliar',
  property_manager: 'Property manager',
}
