"use client";
import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const REVEAL_WIDTH = 84;

type DragState = {
  x: number;
  y: number;
  base: number;
  locked: "h" | "v" | null;
  moved: boolean;
  offset: number;
};

// Ligne swipeable façon Mail/Gmail : glisser vers la gauche révèle un bouton
// Supprimer. `touch-action: pan-y` laisse le scroll vertical natif intact — on
// ne capture que le geste horizontal via Pointer Events (fonctionne tactile et souris).
export default function SwipeableRow({
  isOpen,
  onOpenChange,
  onDelete,
  deleteLabel,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  deleteLabel: string;
  children: React.ReactNode;
}) {
  const [dragX, setDragX] = useState<number | null>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const offset = dragX ?? (isOpen ? -REVEAL_WIDTH : 0);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Repart toujours d'un état propre : si le clic qui devait consommer
    // suppressClick d'un geste précédent n'est jamais arrivé (drag interrompu,
    // pointercancel...), il ne doit pas polluer cette nouvelle interaction.
    suppressClick.current = false;
    const base = isOpen ? -REVEAL_WIDTH : 0;
    drag.current = { x: e.clientX, y: e.clientY, base, locked: null, moved: false, offset: base };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (d.locked === "h") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.locked === "h") {
      d.moved = true;
      // On garde la valeur "vraie" dans la ref (synchrone) en plus du state (déclenche le
      // rendu) : `dragX` peut ne pas encore être appliqué au moment du pointerup si les
      // évènements arrivent dans le même tick (batching React) — s'appuyer sur le state
      // ici ferait retomber le calcul du seuil sur une valeur périmée.
      d.offset = Math.min(0, Math.max(-REVEAL_WIDTH, d.base + dx));
      setDragX(d.offset);
    }
  }

  function endDrag() {
    const d = drag.current;
    if (d?.locked === "h") {
      suppressClick.current = d.moved;
      onOpenChange(d.offset < -REVEAL_WIDTH / 2);
    }
    drag.current = null;
    setDragX(null);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isOpen) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden flex-1 min-w-0">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: REVEAL_WIDTH }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
            onDelete();
          }}
          aria-label={deleteLabel}
          className="flex-1 bg-red text-white flex items-center justify-center"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        style={{
          transform: `translateX(${offset}px)`,
          touchAction: "pan-y",
          transition: dragX === null ? "transform 0.2s ease" : "none",
        }}
        className="relative bg-bg"
      >
        {children}
      </div>
    </div>
  );
}
