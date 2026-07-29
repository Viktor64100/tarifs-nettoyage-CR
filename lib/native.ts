"use client";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

// Retour haptique natif — no-op silencieux dans un navigateur classique (web fallback
// intégré au plugin), actif uniquement dans la coque iOS/Android. Volontairement isolé ici
// pour ne pas coupler le reste de l'app à Capacitor : un seul point d'import à retirer si
// jamais la coque native est abandonnée.
export function hapticTick() {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function hapticSuccess() {
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
