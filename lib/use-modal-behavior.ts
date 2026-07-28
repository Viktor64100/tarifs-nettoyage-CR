"use client";
import { useEffect } from "react";

// Comportement standard des overlays modaux (bottom sheet, dialogue de confirmation) :
// bloque le scroll de l'arrière-plan et ferme sur Échap. Évite de dupliquer cette
// logique dans chaque composant qui ouvre un overlay.
export function useModalBehavior(onClose: () => void) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
}
