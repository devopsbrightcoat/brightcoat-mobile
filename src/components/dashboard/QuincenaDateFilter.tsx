import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { DatePicker } from '../common/DatePicker'
import { SegmentedField } from '../common/SegmentedField'
import { QuincenaPicker } from './QuincenaPicker'
import { getQuincenaForDate, getQuincenaRange, type QuincenaKey } from '../../lib/quincena'

// Filtro de fecha "Rango manual / Por quincena" para los paneles de
// filtros de Finanzas (Cobros, Gastos, Planillas) — mismo modo quincena
// que ReportDateRangeBar en Reportes y DashboardScreen (quincenas al
// estilo de David, ver lib/quincena.ts), pero sin botón "Generar": acá los
// filtros aplican de inmediato (mismo criterio que ya tenían
// dateFrom/dateTo en estos paneles), así que elegir una quincena solo
// precarga Fecha desde/hasta y el filtro ya queda aplicado. Mismo
// componente que ops-web/src/components/dashboard/QuincenaDateFilter.tsx.
type QuincenaDateFilterProps = {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export const QuincenaDateFilter = ({ dateFrom, dateTo, onDateFromChange, onDateToChange }: QuincenaDateFilterProps) => {
  const [mode, setMode] = useState<'manual' | 'quincena'>('manual')
  const [quincena, setQuincena] = useState<QuincenaKey>(() => getQuincenaForDate())

  const applyQuincena = (key: QuincenaKey) => {
    setQuincena(key)
    const range = getQuincenaRange(key)
    onDateFromChange(range.start)
    onDateToChange(range.end)
  }

  return (
    <View style={styles.wrap}>
      <SegmentedField
        label="Tipo de filtro"
        value={mode}
        onChange={(next) => {
          setMode(next)
          if (next === 'quincena') applyQuincena(quincena)
        }}
        options={[
          { value: 'manual', label: 'Rango manual' },
          { value: 'quincena', label: 'Por quincena' },
        ]}
      />

      {mode === 'manual' ? (
        <View style={styles.row}>
          <View style={styles.half}>
            <DatePicker label="Fecha desde" value={dateFrom} onChange={onDateFromChange} placeholder="Sin mínimo" />
          </View>
          <View style={styles.half}>
            <DatePicker label="Fecha hasta" value={dateTo} onChange={onDateToChange} placeholder="Sin máximo" />
          </View>
        </View>
      ) : (
        <QuincenaPicker value={quincena} onChange={applyQuincena} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
})
