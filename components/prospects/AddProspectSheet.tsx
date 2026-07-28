"use client";
import { useRouter } from "next/navigation";
import ProspectForm from "./ProspectForm";
import { createProspect, type ProspectFormData } from "@/app/(app)/prospects/actions";

export default function AddProspectSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  async function handleSubmit(data: ProspectFormData) {
    await createProspect(data);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg w-full max-w-[460px] rounded-t-[22px] px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-9 h-1 rounded-full bg-line mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold mb-4">Nouveau prospect</h2>
        <ProspectForm submitLabel="Ajouter" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
