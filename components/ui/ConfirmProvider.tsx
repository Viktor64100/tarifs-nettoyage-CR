"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useModalBehavior } from "@/lib/use-modal-behavior";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog state={state} onSettle={settle} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ state, onSettle }: { state: ConfirmOptions; onSettle: (v: boolean) => void }) {
  const close = useCallback(() => onSettle(false), [onSettle]);
  useModalBehavior(close);
  const titleId = "confirm-dialog-title";
  const descId = "confirm-dialog-desc";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] px-6 animate-overlay-in"
      onClick={close}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={state.message ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-card border border-line rounded-2xl p-5 animate-modal-in"
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          {state.danger && <TriangleAlert size={19} className="text-red shrink-0" />}
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {state.title}
          </h2>
        </div>
        {state.message && (
          <p id={descId} className="text-sub text-sm leading-relaxed mb-4">
            {state.message}
          </p>
        )}
        <div className="flex gap-2.5 mt-2">
          <button
            onClick={close}
            autoFocus={state.danger}
            className="flex-1 bg-card border border-line rounded-xl py-2.5 text-sm font-medium text-ink"
          >
            {state.cancelLabel ?? "Annuler"}
          </button>
          <button
            onClick={() => onSettle(true)}
            autoFocus={!state.danger}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${state.danger ? "bg-red" : "bg-accent"}`}
          >
            {state.confirmLabel ?? "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé sous ConfirmProvider.");
  return ctx;
}
