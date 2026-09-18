import { createContext, useContext, type ReactNode } from 'react'
import { fetchEmployees, fetchProperties, fetchServiceTypes } from '../lib/api'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { Employee, Property, ServiceType } from '../types'

// Propiedades, empleados y tipos de servicio son datos de referencia que
// casi no cambian, pero se piden en casi cada pantalla (Dashboard,
// Horarios, Planillas, cada modal de Agregar/Editar...) — antes cada una
// los volvía a pedir por su cuenta con su propio useSupabaseQuery, así que
// entrar a la app disparaba mas de una decena de fetches redundantes de
// las mismas tablas (peor en mobile: datos moviles/batería). Este
// Provider los trae UNA sola vez (al entrar a la zona autenticada, ver
// RootNavigator.tsx) y los comparte por contexto. Las pantallas que SÍ los
// editan (PropiedadesScreen, EmpleadosScreen, ConfiguracionScreen) llaman
// a refetchProperties/refetchEmployees/refetchServiceTypes después de
// guardar/borrar en vez de mantener su propio refreshKey. Mismo componente
// que ops-web/src/contexts/ReferenceDataContext.tsx.
type ReferenceDataValue = {
  properties: Property[] | null
  loadingProperties: boolean
  refreshingProperties: boolean
  errorProperties: string | null
  refetchProperties: () => void

  employees: Employee[] | null
  loadingEmployees: boolean
  refreshingEmployees: boolean
  errorEmployees: string | null
  refetchEmployees: () => void

  serviceTypes: ServiceType[] | null
  loadingServiceTypes: boolean
  refreshingServiceTypes: boolean
  errorServiceTypes: string | null
  refetchServiceTypes: () => void
}

const ReferenceDataContext = createContext<ReferenceDataValue | null>(null)

export const ReferenceDataProvider = ({ children }: { children: ReactNode }) => {
  const propertiesQuery = useSupabaseQuery(fetchProperties, [])
  const employeesQuery = useSupabaseQuery(fetchEmployees, [])
  const serviceTypesQuery = useSupabaseQuery(fetchServiceTypes, [])

  const value: ReferenceDataValue = {
    properties: propertiesQuery.data,
    loadingProperties: propertiesQuery.loading,
    refreshingProperties: propertiesQuery.refreshing,
    errorProperties: propertiesQuery.error,
    refetchProperties: propertiesQuery.refetch,

    employees: employeesQuery.data,
    loadingEmployees: employeesQuery.loading,
    refreshingEmployees: employeesQuery.refreshing,
    errorEmployees: employeesQuery.error,
    refetchEmployees: employeesQuery.refetch,

    serviceTypes: serviceTypesQuery.data,
    loadingServiceTypes: serviceTypesQuery.loading,
    refreshingServiceTypes: serviceTypesQuery.refreshing,
    errorServiceTypes: serviceTypesQuery.error,
    refetchServiceTypes: serviceTypesQuery.refetch,
  }

  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>
}

export const useReferenceData = (): ReferenceDataValue => {
  const ctx = useContext(ReferenceDataContext)
  if (!ctx) throw new Error('useReferenceData debe usarse dentro de <ReferenceDataProvider>')
  return ctx
}
