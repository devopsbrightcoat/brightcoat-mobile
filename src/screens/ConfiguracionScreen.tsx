import React, { useCallback, useEffect, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { FormField } from '../components/common/FormField'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { useAuth } from '../auth/AuthProvider'
import { deleteServiceType, fetchCompanySettings, fetchServiceTypes, updateCompanySettings, updateOwnPassword, updateOwnProfile } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { serviceCategoryLabels } from '../lib/serviceTypeOptions'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { ServiceType } from '../types'

type TabKey = 'general' | 'servicios'
type Nav = NativeStackNavigationProp<RootStackParamList>

const roleLabel: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  staff: 'Staff',
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'servicios', label: 'Servicios' },
]

// Réplica de ops-web (ConfiguracionGeneral.tsx / ConfiguracionServicios.tsx
// — dos pestañas separadas ahí) como un tab switcher, mismo criterio que
// FinanzasScreen. "General" agrupa Datos de la empresa (company_settings,
// tabla singleton) y Mi perfil (nombre/correo propios + cambio de
// contraseña) — ver 20260920000000_add_company_settings.sql. La gestión de
// cuentas de acceso (crear/editar otros usuarios) queda fuera a propósito:
// requiere el API admin de Supabase, no es seguro exponerlo desde la app.
export const ConfiguracionScreen = () => {
  const navigation = useNavigation<Nav>()
  const { profile, refreshProfile } = useAuth()
  // Datos de la empresa: solo el owner puede editarlos — el resto de roles
  // los ve, pero de solo lectura (sin inputs ni botón de guardar).
  const isOwner = profile?.role === 'owner'
  const [tab, setTab] = useState<TabKey>('general')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null)

  const { data: serviceTypes, loading: loadingServiceTypes, error: errorServiceTypes } = useSupabaseQuery(
    fetchServiceTypes,
    [refreshKey],
  )

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  // --- Datos de la empresa ---------------------------------------------
  const { data: companySettings, loading: loadingCompany } = useSupabaseQuery(fetchCompanySettings, [])
  const [companyLoaded, setCompanyLoaded] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('')
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)

  useEffect(() => {
    if (!companySettings || companyLoaded) return
    setAddress(companySettings.address ?? '')
    setPhone(companySettings.phone ?? '')
    setEmail(companySettings.email ?? '')
    setDefaultHourlyRate(companySettings.defaultHourlyRate != null ? String(companySettings.defaultHourlyRate) : '')
    setCompanyLoaded(true)
  }, [companySettings, companyLoaded])

  const handleSaveCompany = async () => {
    if (!companySettings) return
    let rateValue: number | null = null
    if (defaultHourlyRate.trim()) {
      const parsed = Number(defaultHourlyRate)
      if (Number.isNaN(parsed) || parsed < 0) {
        setCompanyError('La tarifa por hora no es un número válido.')
        return
      }
      rateValue = parsed
    }
    setSavingCompany(true)
    setCompanyError(null)
    try {
      await updateCompanySettings(companySettings.id, {
        companyName: companySettings.companyName,
        address,
        phone,
        email,
        defaultHourlyRate: rateValue,
      })
    } catch (err) {
      setCompanyError(getErrorMessage(err, 'No se pudieron guardar los datos de la empresa.'))
    } finally {
      setSavingCompany(false)
    }
  }

  // --- Mi perfil ---------------------------------------------------------
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [fullName, setFullName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile || profileLoaded) return
    setFullName(profile.fullName ?? '')
    setContactEmail(profile.email ?? '')
    setProfileLoaded(true)
  }, [profile, profileLoaded])

  const handleSaveProfile = async () => {
    if (!profile) return
    setSavingProfile(true)
    setProfileError(null)
    try {
      await updateOwnProfile(profile.id, { fullName: fullName.trim(), email: contactEmail.trim() })
      await refreshProfile()
    } catch (err) {
      setProfileError(getErrorMessage(err, 'No se pudo guardar el perfil.'))
    } finally {
      setSavingProfile(false)
    }
  }

  // --- Cambiar contraseña -------------------------------------------------
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.')
      setPasswordSuccess(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      setPasswordSuccess(false)
      return
    }
    setSavingPassword(true)
    setPasswordError(null)
    try {
      await updateOwnPassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'No se pudo cambiar la contraseña.'))
      setPasswordSuccess(false)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Configuración"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          tab === 'servicios' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddServiceType')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.tabRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'general' ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Datos de la empresa</Text>
          {loadingCompany && !companyLoaded ? (
            <ActivityIndicator style={styles.centered} color={colors.gold400} />
          ) : (
            <View style={styles.section}>
              <View style={styles.half}>
                <Text style={styles.readOnlyLabel}>Nombre de la empresa</Text>
                <Panel style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyValue}>{companySettings?.companyName ?? '—'}</Text>
                </Panel>
              </View>
              {isOwner ? (
                <>
                  <FormField label="Dirección" value={address} onChangeText={setAddress} placeholder="Opcional" />
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <FormField
                        label="Teléfono"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Opcional"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.half}>
                      <FormField
                        label="Correo"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Opcional"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  <FormField
                    label="Tarifa por hora sugerida (nuevos empleados)"
                    value={defaultHourlyRate}
                    onChangeText={setDefaultHourlyRate}
                    placeholder="ej. 20"
                    keyboardType="decimal-pad"
                  />

                  {companyError ? <Text style={styles.error}>{companyError}</Text> : null}

                  <TouchableOpacity
                    style={[styles.button, savingCompany && styles.buttonDisabled]}
                    activeOpacity={0.85}
                    disabled={savingCompany}
                    onPress={handleSaveCompany}
                  >
                    <Text style={styles.buttonText}>{savingCompany ? 'Guardando…' : 'Guardar cambios'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.half}>
                    <Text style={styles.readOnlyLabel}>Dirección</Text>
                    <Panel style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyValue}>{address || '—'}</Text>
                    </Panel>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Text style={styles.readOnlyLabel}>Teléfono</Text>
                      <Panel style={styles.readOnlyBox}>
                        <Text style={styles.readOnlyValue}>{phone || '—'}</Text>
                      </Panel>
                    </View>
                    <View style={styles.half}>
                      <Text style={styles.readOnlyLabel}>Correo</Text>
                      <Panel style={styles.readOnlyBox}>
                        <Text style={styles.readOnlyValue}>{email || '—'}</Text>
                      </Panel>
                    </View>
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.readOnlyLabel}>Tarifa por hora sugerida (nuevos empleados)</Text>
                    <Panel style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyValue}>{defaultHourlyRate || '—'}</Text>
                    </Panel>
                  </View>
                </>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Mi perfil</Text>
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.readOnlyLabel}>Usuario</Text>
                <Panel style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyValue}>{profile?.username ?? '—'}</Text>
                </Panel>
              </View>
              <View style={styles.half}>
                <Text style={styles.readOnlyLabel}>Rol</Text>
                <Panel style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyValue}>{profile ? roleLabel[profile.role] ?? profile.role : '—'}</Text>
                </Panel>
              </View>
            </View>

            <FormField label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Opcional" />
            <FormField
              label="Correo de contacto"
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="Opcional"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {profileError ? <Text style={styles.error}>{profileError}</Text> : null}

            <TouchableOpacity
              style={[styles.button, savingProfile && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={savingProfile}
              onPress={handleSaveProfile}
            >
              <Text style={styles.buttonText}>{savingProfile ? 'Guardando…' : 'Guardar perfil'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          <View style={styles.section}>
            <FormField
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text)
                setPasswordSuccess(false)
              }}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
            />
            <FormField
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                setPasswordSuccess(false)
              }}
              placeholder="Repite la contraseña"
              secureTextEntry
              autoCapitalize="none"
            />

            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            {passwordSuccess ? <Text style={styles.success}>Contraseña actualizada.</Text> : null}

            <TouchableOpacity
              style={[styles.button, savingPassword && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={savingPassword}
              onPress={handleChangePassword}
            >
              <Text style={styles.buttonText}>{savingPassword ? 'Guardando…' : 'Cambiar contraseña'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Catálogo de tipos de servicio</Text>

          {loadingServiceTypes ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : errorServiceTypes ? (
            <Text style={styles.errorText}>No se pudo cargar el catálogo: {errorServiceTypes}</Text>
          ) : !serviceTypes || serviceTypes.length === 0 ? (
            <Text style={styles.emptyListText}>Todavía no hay tipos de servicio.</Text>
          ) : (
            <View style={styles.list}>
              {serviceTypes.map((item: ServiceType) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('EditServiceType', { serviceType: item })}
                >
                  <Panel style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.serviceRowActions}>
                      <Text style={styles.cardMeta}>{serviceCategoryLabels[item.category]}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setDeletingServiceType(item)}
                      >
                        <Trash2 size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </Panel>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmModal
        open={deletingServiceType !== null}
        onClose={() => setDeletingServiceType(null)}
        title="Eliminar tipo de servicio"
        message={`¿Eliminar "${deletingServiceType?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingServiceType) return
          await deleteServiceType(deletingServiceType.id)
          setRefreshKey((k) => k + 1)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  tabTextActive: {
    color: colors.brand900,
  },
  scroll: {
    paddingBottom: 40,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  section: {
    marginHorizontal: 20,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
    gap: 6,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  readOnlyBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyValue: {
    fontSize: 15,
    color: colors.ink400,
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
    marginTop: 4,
    borderRadius: 10,
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
  centered: {
    paddingTop: 24,
    alignItems: 'center',
  },
  errorText: {
    marginHorizontal: 20,
    fontSize: 13,
    color: colors.rose,
  },
  emptyListText: {
    marginHorizontal: 20,
    fontSize: 13,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    color: colors.ink200,
  },
  serviceRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.ink400,
  },
})
