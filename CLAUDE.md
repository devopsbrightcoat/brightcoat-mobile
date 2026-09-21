# ops-mobile — notas para Claude

## Convenciones de UI

- Los controles de filtro (quincena/rango de fechas, etc.) van siempre en la
  misma fila que el buscador (search bar) más cercano, nunca en una fila
  propia ni como panel siempre visible — se colapsan detrás de un botón
  compacto (ícono + resumen del valor actual) que abre una hoja/modal al
  tocarlo. Ver PlanillasScreen.tsx como referencia.
- En cualquier LineChart o BarChart de react-native-chart-kit cuyo eje Y
  muestre montos en dólares, siempre hay que abreviar las etiquetas del eje Y
  a formato "14k" (< 1000 se muestra tal cual, redondeado; ≥ 1000 se divide
  entre 1000 con 1 decimal + "k"), para que no se corten en pantallas
  angostas. `formatYLabel` es una prop directa de `LineChart`, pero en
  `BarChart` solo funciona metida dentro de `chartConfig` (chart-kit no la
  lee de ahí en LineChart) — ver `formatYAxisLabel` en DashboardScreen.tsx,
  ReportesFinancieroScreen.tsx o ReportesGastosScreen.tsx como referencia.
  Los charts que muestran cantidades de trabajos (no dólares), como en
  TrabajosPorEstatusScreen.tsx o ServiciosPorTipoScreen.tsx, NO necesitan
  esta abreviación — normalmente no llegan a cifras altas.
