import { notificationsApi } from "./notifications.api"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

/**
 * Register the service worker, request permission, subscribe to push, and send
 * the subscription to the backend. Returns true on success.
 * Throws with a friendly message on failure (no VAPID key, denied permission…).
 */
export async function enablePush(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error("Tu navegador no soporta notificaciones push.")
  }

  const { publicKey } = await notificationsApi.getVapidKey()
  if (!publicKey) {
    throw new Error(
      "Las notificaciones push no están configuradas en el servidor (falta VAPID)."
    )
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error("Permiso de notificaciones denegado.")
  }

  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready

  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }))

  const json = subscription.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  await notificationsApi.subscribePush({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  })
  return true
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await notificationsApi.unsubscribePush(subscription.endpoint).catch(() => undefined)
    await subscription.unsubscribe().catch(() => undefined)
  }
}
