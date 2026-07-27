"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone, Check, CircleCheck } from "lucide-react";
import type { Prospect, InteractionType } from "@/types/db";
import { StatusChip } from "@/components/prospects/StatusChip";
import ConsentBadge from "@/components/prospects/ConsentBadge";
import { OUTCOMES, addDaysISO, fmtShortISO, todayISO, type Outcome } from "@/lib/call-outcomes";
import { logCallOutcome } from "@/app/(app)/call/actions";

type Step = "ready" | "outcome" | "schedule" | "finished";

export default function CallFlowScreen({ queue }: { queue: Prospect[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("ready");
  const [pending, setPending] = useState<Outcome | null>(null);
  const [note, setNote] = useState("");
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const p = queue[idx];

  function backToDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  function advance() {
    setNote("");
    setPending(null);
    if (idx + 1 < queue.length) {
      setIdx((i) => i + 1);
      setStep("ready");
    } else {
      setStep("finished");
    }
  }

  function commit(outcome: Outcome, followUpAt?: string | null) {
    startTransition(async () => {
      await logCallOutcome(p.id, outcome.key as InteractionType, { note, followUpAt });
      const msg =
        outcome.kind === "won"
          ? "Rendez-vous enregistré 🎯"
          : followUpAt
            ? `Relance programmée ${fmtShortISO(followUpAt)}`
            : outcome.kind === "requeue"
              ? "Reprogrammé dans 2 jours"
              : "Enregistré";
      setConfirmMsg(msg);
      setTimeout(() => {
        setConfirmMsg(null);
        advance();
      }, 900);
    });
  }

  function pick(outcome: Outcome) {
    if (outcome.kind === "schedule") {
      setPending(outcome);
      setStep("schedule");
    } else {
      commit(outcome);
    }
  }

  if (step === "finished") {
    return (
      <div className="px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-soft grid place-items-center mx-auto mb-4">
          <CircleCheck size={32} className="text-accent" />
        </div>
        <div className="font-display text-2xl font-semibold">File terminée</div>
        <div className="text-sub text-[15px] mt-1.5">Chaque appel est logué et les relances sont programmées.</div>
        <button
          onClick={backToDashboard}
          className="mt-6 bg-ink text-white rounded-2xl px-7 py-3.5 text-[15.5px] font-semibold"
        >
          Retour
        </button>
      </div>
    );
  }

  const tel = "tel:" + p.phone.replace(/\s/g, "");

  return (
    <div className="px-5 pt-4 pb-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <button onClick={backToDashboard} className="flex items-center gap-1 text-sub text-[15px] p-1">
          <ChevronLeft size={18} /> Quitter
        </button>
        <span className="font-display tabular-nums text-faint text-sm">
          {idx + 1} / {queue.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center pb-5">
        <div className="text-center mb-6">
          <StatusChip status={p.status} center />
          <div className="font-display text-[30px] font-semibold tracking-tight mt-3">
            {p.first_name} {p.last_name}
          </div>
          <div className="text-sub text-base mt-0.5">{p.company}</div>
          <div className="font-display tabular-nums text-xl mt-3.5 tracking-wide">{p.phone}</div>
          <div className="mt-2.5 flex justify-center">
            <ConsentBadge given={p.consent_given} at={p.consent_at} center />
          </div>
        </div>

        {confirmMsg ? (
          <div className="text-center py-6">
            <span className="inline-flex items-center gap-2 bg-accent-soft text-accent-dk px-5 py-3 rounded-full text-[15px] font-semibold">
              <Check size={17} /> {confirmMsg}
            </span>
          </div>
        ) : step === "ready" ? (
          <div>
            <a
              href={tel}
              onClick={() => setTimeout(() => setStep("outcome"), 250)}
              className="flex items-center justify-center gap-2.5 bg-accent text-white rounded-2xl py-[18px] text-[17px] font-semibold no-underline"
              style={{ boxShadow: "0 8px 20px rgba(10,122,85,.3)" }}
            >
              <Phone size={20} /> Appeler
            </a>
            <button
              onClick={() => setStep("outcome")}
              className="w-full mt-3 bg-transparent border-none text-faint text-sm py-2"
            >
              Passer / logger sans appeler
            </button>
          </div>
        ) : step === "outcome" ? (
          <div>
            <div className="text-center text-faint text-[13px] tracking-wide uppercase font-semibold mb-3">
              Résultat de l&apos;appel
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  onClick={() => pick(o)}
                  disabled={isPending}
                  className="bg-card border border-line rounded-[15px] px-2.5 py-4 flex flex-col items-center gap-2 disabled:opacity-50"
                >
                  <span className={`w-[38px] h-[38px] rounded-full grid place-items-center bg-current/10 ${o.toneClass}`}>
                    <o.Icon size={19} />
                  </span>
                  <span className="text-sm font-medium text-ink">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          pending && (
            <ScheduleStep
              outcome={pending}
              note={note}
              setNote={setNote}
              pending={isPending}
              onConfirm={(iso) => commit(pending, iso)}
              onBack={() => setStep("outcome")}
            />
          )
        )}
      </div>
    </div>
  );
}

function ScheduleStep({
  outcome,
  note,
  setNote,
  pending,
  onConfirm,
  onBack,
}: {
  outcome: Outcome;
  note: string;
  setNote: (v: string) => void;
  pending: boolean;
  onConfirm: (iso: string) => void;
  onBack: () => void;
}) {
  const t = todayISO();
  const base = [
    { label: "Demain", iso: addDaysISO(t, 1) },
    { label: "Dans 3 jours", iso: addDaysISO(t, 3) },
    { label: "Dans 1 semaine", iso: addDaysISO(t, 7) },
  ];
  const [custom, setCustom] = useState("");

  return (
    <div>
      <div className="text-center text-faint text-[13px] tracking-wide uppercase font-semibold mb-3.5">
        Programmer la relance
      </div>
      <div className="flex flex-col gap-2">
        {base.map((b) => (
          <button
            key={b.iso}
            onClick={() => onConfirm(b.iso)}
            disabled={pending}
            className="flex justify-between items-center bg-card border border-line rounded-2xl px-4 py-[15px] disabled:opacity-50"
          >
            <span className="text-[15.5px] font-medium">{b.label}</span>
            <span className="text-faint text-sm font-display flex items-center gap-1">
              {fmtShortISO(b.iso)} <ChevronRight size={15} />
            </span>
          </button>
        ))}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={custom}
            min={t}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1 border border-line rounded-2xl px-3.5 py-3 text-[15px] bg-card"
          />
          <button
            disabled={!custom || pending}
            onClick={() => onConfirm(custom)}
            className="bg-accent text-white rounded-2xl px-[18px] py-3 font-semibold disabled:bg-line disabled:text-faint"
          >
            OK
          </button>
        </div>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note rapide (optionnel)…"
        className="w-full mt-3.5 border border-line rounded-2xl px-3.5 py-3 text-sm resize-none bg-card"
      />
      <button onClick={onBack} className="w-full mt-2 bg-transparent border-none text-faint text-sm py-1.5">
        ← Autre résultat
      </button>
    </div>
  );
}
