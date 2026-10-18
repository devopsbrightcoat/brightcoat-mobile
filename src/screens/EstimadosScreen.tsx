import React, { useMemo, useState } from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { Download, Plus, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { createEstimate, fetchEstimates, getNextEstimateNumber } from '../lib/api'
import { exportEstimateToPdf, type EstimateLineItem } from '../lib/exportEstimate'
import { currency } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import type { Estimate } from '../types'

type ItemLine = { key: number; name: string; description: string; qty: string; rate: string }
type EstimadosView = 'nuevo' | 'historial'

const emptyItem = (key: number): ItemLine => ({ key, name: '', description: '', qty: '1', rate: '' })

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${m}/${d}/${y}`
}

export const EstimadosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation()
  const { properties, loadingProperties } = useReferenceData()

  const [view, setView] = useState<EstimadosView>('nuevo')

  const [documentTitle, setDocumentTitle] = useState('Estimate')
  const [propertyId, setPropertyId] = useState('')
  const [unitLabel, setUnitLabel] = useState('')
  const [date, setDate] = useState(todayISO())
  const [items, setItems] = useState<ItemLine[]>([emptyItem(0)])
  const [note, setNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<number | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const {
    data: estimates,
    loading: loadingHistory,
    error: historyError,
    refreshing: refreshingHistory,
    refetch: refetchHistory,
  } = useSupabaseQuery(fetchEstimates, [historyRefreshKey])

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const selectedProperty = (properties ?? []).find((p) => p.id === propertyId) ?? null

  const addItem = () => setItems((prev) => [...prev, emptyItem((prev.at(-1)?.key ?? 0) + 1)])
  const removeItem = (key: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev))
  const updateItem = (key: number, patch: Partial<ItemLine>) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))

  const parsedItems: EstimateLineItem[] = items
    .filter((item) => item.name.trim() || item.rate.trim())
    .map((item) => ({
      name: item.name.trim(),
      description: item.description.trim(),
      qty: Number(item.qty) || 0,
      rate: Number(item.rate) || 0,
    }))

  const total = parsedItems.reduce((sum, item) => sum + item.qty * item.rate, 0)

  const handleReset = () => {
    setDocumentTitle('Estimate')
    setPropertyId('')
    setUnitLabel('')
    setDate(todayISO())
    setItems([emptyItem(0)])
    setNote('')
    setLastGenerated(null)
    setError(null)
  }

  const handleGenerate = async () => {
    setError(null)
    if (!selectedProperty) {
      setError('Selecciona la propiedad para la que es el estimado.')
      return
    }
    if (parsedItems.length === 0) {
      setError('Agrega al menos un producto o servicio con su tarifa.')
      return
    }
    const invalidItem = parsedItems.find((item) => !item.name || item.qty <= 0 || item.rate < 0)
    if (invalidItem) {
      setError('Revisa que cada línea tenga nombre, cantidad mayor a 0 y una tarifa válida.')
      return
    }

    setGenerating(true)
    try {
      // El número se reserva justo al generar (no al abrir el formulario)
      // para no saltarse números si el formulario se abandona sin
      // descargar el PDF — comparte el mismo contador que ops-web.
      const estimateNumber = await getNextEstimateNumber()
      const resolvedTitle = documentTitle.trim() || 'Estimate'
      await exportEstimateToPdf({
        estimateNumber,
        date,
        propertyName: selectedProperty.name,
        unitLabel: unitLabel.trim() || undefined,
        propertyContact: selectedProperty.managerContact,
        items: parsedItems,
        note: note.trim() || undefined,
        documentTitle: resolvedTitle,
      })
      setLastGenerated(estimateNumber)

      // El historial se guarda después de compartir el PDF — si esto falla
      // no le quitamos a David el PDF que ya generó, solo se queda sin
      // aparecer en la pestaña de Historial.
      try {
        await createEstimate({
          estimateNumber,
          documentTitle: resolvedTitle,
          date,
          propertyId: selectedProperty.id,
          propertyName: selectedProperty.name,
          unitLabel: unitLabel.trim() || undefined,
          propertyContact: selectedProperty.managerContact,
          items: parsedItems,
          note: note.trim() || undefined,
          total,
        })
        setHistoryRefreshKey((k) => k + 1)
      } catch (historyErr) {
        console.error('No se pudo guardar el estimado en el historial', historyErr)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo generar el estimado.'))
    } finally {
      setGenerating(false)
    }
  }

  const handleRedownload = async (estimate: Estimate) => {
    setDownloadError(null)
    setDownloadingId(estimate.id)
    try {
      await exportEstimateToPdf({
        estimateNumber: estimate.estimateNumber,
        date: estimate.date,
        propertyName: estimate.propertyName,
        unitLabel: estimate.unitLabel,
        propertyContact: estimate.propertyContact,
        items: estimate.items,
        note: estimate.note,
        documentTitle: estimate.documentTitle,
      })
    } catch (err) {
      setDownloadError(getErrorMessage(err, 'No se pudo volver a descargar el PDF.'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenHeader
        title="Estimados"
        subtitle={view === 'nuevo' ? 'Arma un estimado y compártelo en PDF' : 'Estimados e invoices generados'}
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <View style={styles.viewTabRow}>
        <TouchableOpacity
          style={[styles.viewTabButton, view === 'nuevo' && styles.viewTabButtonActive]}
          activeOpacity={0.7}
          onPress={() => setView('nuevo')}
        >
          <Text style={[styles.viewTabText, view === 'nuevo' && styles.viewTabTextActive]}>Nuevo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTabButton, view === 'historial' && styles.viewTabButtonActive]}
          activeOpacity={0.7}
          onPress={() => setView('historial')}
        >
          <Text style={[styles.viewTabText, view === 'historial' && styles.viewTabTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {view === 'historial' ? (
        <ScrollView
          contentContainerStyle={styles.form}
          refreshControl={
            <RefreshControl
              refreshing={refreshingHistory}
              onRefresh={refetchHistory}
              tintColor={colors.gold400}
              colors={[colors.gold400]}
            />
          }
        >
          {downloadError ? <Text style={styles.error}>{downloadError}</Text> : null}

          {loadingHistory ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : historyError ? (
            <Text style={styles.error}>No se pudo cargar el historial: {historyError}</Text>
          ) : !estimates || estimates.length === 0 ? (
            <Text style={styles.hint}>Todavía no se ha generado ningún estimado o invoice.</Text>
          ) : (
            <View style={styles.itemsList}>
              {estimates.map((estimate) => (
                <Panel key={estimate.id} style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {estimate.documentTitle} #{estimate.estimateNumber}
                    </Text>
                    <Text style={styles.historyTotal}>{currency(estimate.total)}</Text>
                  </View>
                  <Text style={styles.historyMeta} numberOfLines={1}>
                    {estimate.unitLabel ? `${estimate.propertyName} · ${estimate.unitLabel}` : estimate.propertyName}
                  </Text>
                  <View style={styles.historyBottomRow}>
                    <Text style={styles.historyDate}>{formatDate(estimate.date)}</Text>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      activeOpacity={0.7}
                      disabled={downloadingId === estimate.id}
                      onPress={() => handleRedownload(estimate)}
                    >
                      <Download size={14} color={colors.ink300} />
                      <Text style={styles.downloadButtonText}>
                        {downloadingId === estimate.id ? 'Descargando…' : 'Descargar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Panel>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Título del documento</Text>
            <View style={styles.titleOptionRow}>
              <TouchableOpacity
                style={[styles.titleOptionButton, documentTitle === 'Estimate' && styles.titleOptionButtonActive]}
                activeOpacity={0.7}
                onPress={() => setDocumentTitle('Estimate')}
              >
                <Text style={[styles.titleOptionText, documentTitle === 'Estimate' && styles.titleOptionTextActive]}>
                  Estimate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleOptionButton, documentTitle === 'Invoice' && styles.titleOptionButtonActive]}
                activeOpacity={0.7}
                onPress={() => setDocumentTitle('Invoice')}
              >
                <Text style={[styles.titleOptionText, documentTitle === 'Invoice' && styles.titleOptionTextActive]}>
                  Invoice
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={documentTitle}
              onChangeText={setDocumentTitle}
              placeholder="Estimate"
              placeholderTextColor={colors.ink500}
              style={[styles.input, styles.titleInput]}
            />
            <Text style={styles.hint}>
              Así aparece arriba del PDF — si no es Estimate ni Invoice, escribí el texto que quieras.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Propiedad</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Propiedad</Text>
              <InlineSelect
                options={propertyOptions}
                value={propertyId}
                onChange={setPropertyId}
                searchPlaceholder="Buscar propiedad..."
                placeholder={loadingProperties ? 'Cargando…' : 'Selecciona…'}
                open={openField === 'property'}
                onOpenChange={(next) => setOpenField(next ? 'property' : null)}
              />
              {selectedProperty?.managerContact ? (
                <Text style={styles.hint}>Contacto: {selectedProperty.managerContact}</Text>
              ) : null}
            </View>

            <FormField label="Unidad (opcional)" value={unitLabel} onChangeText={setUnitLabel} placeholder="ej. L303" />

            <DatePicker label="Fecha del estimado" value={date} onChange={setDate} />
          </View>

          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionLabel}>Productos o servicios</Text>
              <TouchableOpacity style={styles.addItemButton} activeOpacity={0.7} onPress={addItem}>
                <Plus size={14} color={colors.ink300} />
                <Text style={styles.addItemText}>Agregar línea</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemsList}>
              {items.map((item) => {
                const qty = Number(item.qty) || 0
                const rate = Number(item.rate) || 0
                return (
                  <View key={item.key} style={styles.itemCard}>
                    <View style={styles.itemTopRow}>
                      <TextInput
                        value={item.name}
                        onChangeText={(text) => updateItem(item.key, { name: text })}
                        placeholder="Producto o servicio"
                        placeholderTextColor={colors.ink500}
                        style={[styles.input, styles.itemNameInput]}
                      />
                      <TouchableOpacity
                        onPress={() => removeItem(item.key)}
                        disabled={items.length === 1}
                        hitSlop={8}
                        style={styles.removeItemButton}
                      >
                        <X size={16} color={items.length === 1 ? 'rgba(100,116,139,0.4)' : colors.ink500} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemRow}>
                      <TextInput
                        value={item.qty}
                        onChangeText={(text) => updateItem(item.key, { qty: text })}
                        placeholder="Qty"
                        placeholderTextColor={colors.ink500}
                        keyboardType="decimal-pad"
                        style={[styles.input, styles.itemQtyInput]}
                      />
                      <TextInput
                        value={item.rate}
                        onChangeText={(text) => updateItem(item.key, { rate: text })}
                        placeholder="Tarifa"
                        placeholderTextColor={colors.ink500}
                        keyboardType="decimal-pad"
                        style={[styles.input, styles.itemRateInput]}
                      />
                    </View>

                    <TextInput
                      value={item.description}
                      onChangeText={(text) => updateItem(item.key, { description: text })}
                      placeholder="Descripción (lo que ve el cliente en el PDF)"
                      placeholderTextColor={colors.ink500}
                      multiline
                      numberOfLines={2}
                      style={[styles.input, styles.itemDescInput]}
                    />

                    {qty > 0 && rate > 0 ? <Text style={styles.itemAmount}>Monto: {currency(qty * rate)}</Text> : null}
                  </View>
                )
              })}
            </View>

            <Text style={styles.totalText}>
              Total: <Text style={styles.totalValue}>{currency(total)}</Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Nota para el cliente (opcional)</Text>
            <Text style={styles.hint}>Aparece impresa en el PDF, debajo del total.</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="ej. Precio válido por 30 días. Incluye materiales y mano de obra."
              placeholderTextColor={colors.ink500}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.noteInput]}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {lastGenerated && !error ? (
            <Text style={styles.success}>
              {documentTitle.trim() || 'Estimate'} #{lastGenerated} generado correctamente.
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, generating && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={generating}
            onPress={handleGenerate}
          >
            <Text style={styles.buttonText}>{generating ? 'Generando…' : 'Generar PDF'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>Limpiar formulario</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  viewTabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  viewTabButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
  },
  viewTabButtonActive: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  viewTabTextActive: {
    color: colors.brand900,
  },
  form: {
    padding: 20,
    gap: 20,
  },
  centered: {
    paddingTop: 24,
    alignItems: 'center',
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.ink500,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  hint: {
    fontSize: 12,
    color: colors.ink500,
  },
  titleOptionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  titleOptionButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surface,
    paddingVertical: 11,
  },
  titleOptionButtonActive: {
    borderColor: colors.gold500,
    backgroundColor: 'rgba(207,145,34,0.12)',
  },
  titleOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
  titleOptionTextActive: {
    color: colors.gold400,
  },
  titleInput: {
    marginTop: 4,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.white,
  },
  itemNameInput: {
    flex: 1,
  },
  itemQtyInput: {
    width: 70,
  },
  itemRateInput: {
    flex: 1,
  },
  itemDescInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  removeItemButton: {
    padding: 4,
  },
  itemAmount: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.ink500,
  },
  totalText: {
    textAlign: 'right',
    fontSize: 14,
    color: colors.ink300,
  },
  totalValue: {
    fontWeight: '700',
    color: colors.white,
  },
  error: {
    fontSize: 13,
    color: colors.rose,
  },
  success: {
    fontSize: 13,
    color: colors.emerald,
  },
  button: {
    borderRadius: 12,
    backgroundColor: colors.gold500,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand900,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink300,
  },
  historyCard: {
    gap: 6,
    padding: 14,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold400,
  },
  historyMeta: {
    fontSize: 12,
    color: colors.ink300,
  },
  historyBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  historyDate: {
    fontSize: 12,
    color: colors.ink500,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  downloadButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
})
