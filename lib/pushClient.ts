// lib/pushClient.ts

export async function registerServiceWorker(path = "/sw.js") {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(path);
    return reg;
  } catch (e) {
    console.error("SW register failed", e);
    return null;
  }
}

export async function getPublicVapidKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/public-key");
    if (!res.ok) return null;

    // Avoid `any`: treat JSON as unknown and narrow.
    const raw: unknown = await res.json();
    if (
      raw &&
      typeof raw === "object" &&
      "publicKey" in raw &&
      typeof (raw as { publicKey?: unknown }).publicKey === "string"
    ) {
      return (raw as { publicKey: string }).publicKey;
    }
    return null;
  } catch {
    return null;
  }
}

export async function subscribePush(): Promise<PushSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const reg = await registerServiceWorker();
  if (!reg) return null;

  const key = await getPublicVapidKey();
  if (!key) return null;

  const convertedKey = urlBase64ToUint8Array(key);
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Uint8Array conforms to BufferSource expected here
      applicationServerKey: convertedKey,
    });
    localStorage.setItem("needix.push.subscription", JSON.stringify(sub));
    return sub;
  } catch (e) {
    console.error("Push subscribe failed", e);
    return null;
  }
}

export async function unsubscribePush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const ok = await sub.unsubscribe();
      localStorage.removeItem("needix.push.subscription");
      return ok;
    }
    return true;
  } catch {
    return false;
  }
}

export function getSavedSubscription(): PushSubscription | null {
  try {
    const raw = localStorage.getItem("needix.push.subscription");
    if (!raw) return null;
    return JSON.parse(raw) as PushSubscription;
  } catch {
    return null;
  }
}

export async function sendPushTest(
  title = "Needix Push Test",
  body = "This is a push test",
) {
  try {
    let sub = getSavedSubscription();
    if (!sub) sub = await subscribePush();
    if (!sub) return false;

    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, title, body }),
    });
    return res.ok;
  } catch (e) {
    console.error("sendPushTest failed", e);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
