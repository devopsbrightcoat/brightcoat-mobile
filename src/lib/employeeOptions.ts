import type { Employee } from '../types'

export const EMPLOYEE_STATUS_OPTIONS: { value: Employee['status']; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export const W2_STATUS_OPTIONS: { value: Employee['w2Status']; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
]
