"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

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
      {state && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] px-6"
          onClick={() => settle(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] bg-card border border-line rounded-2xl p-5"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              {state.danger && <TriangleAlert size={19} className="text-red shrink-0" />}
              <h2 className="font-display text-lg font-semibold">{state.title}</h2>
            </div>
            {state.message && <p className="text-sub text-sm leading-relaxed mb-4">{state.message}</p>}
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => settle(false)}
                className="flex-1 bg-card border border-line rounded-xl py-2.5 text-sm font-medium text-ink"
              >
                {state.cancelLabel ?? "Annuler"}
              </button>
              <button
                onClick={() => settle(true)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${state.danger ? "bg-red" : "bg-accent"}`}
              >
                {state.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé sous ConfirmProvider.");
  return ctx;
}
