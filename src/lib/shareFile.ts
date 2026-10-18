import { NativeModules, Platform } from 'react-native'
import Share from 'react-native-share'

export type ShareFileOptions = {
  url: string
  filename: string
  type: string
}

// Antes de compartir, react-native-share hace una llamada nativa previa
// (isBase64File) para decidir si debe pedir permiso de almacenamiento — pero
// ese permiso solo aplica en Android menor a 4.4 (API < 19), que ya no
// existe en la práctica. Con un PDF base64 grande (una planilla con varias
// páginas), esa llamada previa revienta de forma nativa
// ("Uri.getScheme() on a null object reference"), incluso en celulares
// modernos — es un problema de la librería, no de este código. Como ese
// chequeo de permiso no nos hace falta, en Android llamamos directo al
// módulo nativo y nos lo saltamos; en iOS seguimos usando el wrapper normal
// (ahí ese chequeo no existe, así que no hay riesgo).
//
// También forzamos useInternalStorage: true — el PDF se escribe en el cache
// interno de la app (siempre existe) en vez del cache externo
// (getExternalCacheDir), que puede salir null en un emulador sin SD card
// configurada y tirar un segundo crash distinto al escribir el archivo.
export const shareFile = async ({ url, filename, type }: ShareFileOptions): Promise<void> => {
  const options = { url, filename, type, useInternalStorage: true, failOnCancel: false }
  if (Platform.OS === 'android') {
    const RNShareNative = NativeModules.RNShare as
      | { open: (options: Record<string, unknown>) => Promise<{ success: boolean; message?: string }> }
      | undefined
    if (RNShareNative?.open) {
      await RNShareNative.open(options)
      return
    }
  }
  await Share.open(options)
}
