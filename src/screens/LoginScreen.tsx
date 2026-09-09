import React, { useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../auth/AuthProvider'
import { colors } from '../theme/colors'

export const LoginScreen = () => {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(username, password)
    setSubmitting(false)
    if (signInError) setError(signInError)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Image source={require('../assets/brightcoat-logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>BrightCoat Ops</Text>
        <Text style={styles.subtitle}>Panel interno</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="usuario"
              placeholderTextColor={colors.ink500}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor={colors.ink500}
              style={styles.input}
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={submitting}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>{submitting ? 'Entrando…' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand900,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    alignSelf: 'center',
    height: 64,
    width: 64,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 13,
    color: colors.brand300,
  },
  form: {
    marginTop: 36,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.white,
  },
  error: {
    fontSize: 13,
    color: colors.rose,
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
})
