import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from './errors'

type QueryState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

type QueryResult<T> = QueryState<T> & {
  // Para "arrastrar hacia abajo para recargar" (RefreshControl de
  // FlatList/ScrollView en las pantallas de lista): refresca los datos en
  // segundo plano sin tocar `loading` ni vaciar `data` — así la lista se
  // queda visible con el spinner nativo del gesto encima, en vez de
  // reemplazarse por el ActivityIndicator de carga inicial.
  refreshing: boolean
  refetch: () => void
}

// Hook chico para no repetir el mismo useEffect/useState de "cargar datos de
// Supabase" en cada pantalla. La carga inicial (disparada por `deps`, como
// el `refreshKey` que cada pantalla sube después de agregar/editar/borrar)
// sigue igual que ops-web/src/lib/useSupabaseQuery.ts — sin cache ni
// revalidación. `refetch`/`refreshing` son propios de mobile, para el
// pull-to-refresh de las listas.
export const useSupabaseQuery = <T>(fetcher: () => Promise<T>, deps: unknown[]): QueryResult<T> => {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null })
  const [refreshing, setRefreshing] = useState(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })

    fetcherRef.current()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!active) return
        const message = getErrorMessage(err, 'Error al cargar los datos.')
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const refetch = useCallback(() => {
    setRefreshing(true)
    fetcherRef.current()
      .then((data) => {
        if (mountedRef.current) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return
        const message = getErrorMessage(err, 'Error al cargar los datos.')
        setState((prev) => ({ ...prev, loading: false, error: message }))
      })
      .finally(() => {
        if (mountedRef.current) setRefreshing(false)
      })
  }, [])

  return { ...state, refreshing, refetch }
}
