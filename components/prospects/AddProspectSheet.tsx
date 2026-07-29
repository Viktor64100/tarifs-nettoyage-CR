"use client";
import ProspectForm from "./ProspectForm";
import type { ProspectFormData } from "@/app/(app)/prospects/actions";
import { useModalBehavior } from "@/lib/use-modal-behavior";

export default function AddProspectSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: ProspectFormData) => Promise<boolean>;
}) {
  useModalBehavior(onClose);

  async function handleSubmit(data: ProspectFormData) {
    const created = await onCreate(data);
    if (created) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 animate-overlay-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-prospect-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-bg w-full max-w-[460px] rounded-t-[22px] px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto animate-sheet-in"
      >
        <div className="w-9 h-1 rounded-full bg-line mx-auto mb-4" />
        <h2 id="add-prospect-title" className="font-display text-xl font-semibold mb-4">
          Nouveau prospect
        </h2>
        <ProspectForm submitLabel="Ajouter" onSubmit={handleSubmit} autoFocus />
      </div>
    </div>
  );
}
