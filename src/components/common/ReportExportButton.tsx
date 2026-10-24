import React, { useMemo, useState } from 'react'
import { FileText } from 'lucide-react-native'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getErrorMessage } from '../../lib/errors'
import { exportReportToPdf } from '../../lib/exportReport'
import type { ReportExport } from '../../lib/reportExports'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type ReportExportButtonProps = {
  buildReport: () => ReportExport
  disabled?: boolean
}

export const ReportExportButton = ({ buildReport, disabled = false }: ReportExportButtonProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      await exportReportToPdf(buildReport())
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo generar el PDF.'))
    } finally {
      setExporting(false)
    }
  }

  const isDisabled = disabled || exporting

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={isDisabled}
        onPress={handleExport}
        style={isDisabled ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
      >
        {exporting ? <ActivityIndicator size="small" color={colors.gold400} /> : <FileText size={16} color={colors.gold400} />}
        <Text style={styles.buttonText}>{exporting ? 'Generando…' : 'Exportar PDF'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
    gap: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gold500,
    borderRadius: 10,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold400,
  },
  error: {
    fontSize: 12,
    color: colors.rose,
  },
})
