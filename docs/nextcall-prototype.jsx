import React, { useReducer, useEffect, useState, useMemo, useRef } from "react";
import {
  Phone, PhoneMissed, PhoneOff, CalendarClock, Check, X, Handshake,
  ChevronRight, ChevronLeft, Search, Plus, Users, Settings as SettingsIcon,
  ShieldCheck, ShieldAlert, Target, Trash2, ArrowRight, CircleCheck, Home, Download
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  NextCall — prototype de la boucle centrale                         */
/*  Importer → savoir qui appeler → appeler → logger en <10s →         */
/*  relance programmée automatiquement. Pas un CRM.                    */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#F3F5F4", card: "#FFFFFF", ink: "#0E1B17", sub: "#5C6B66",
  faint: "#93A09B", line: "#E4E9E7", accent: "#0A7A55", accentDk: "#075E42",
  accentSoft: "#E4F1EA", amber: "#B8770F", amberSoft: "#FAEFDA",
  red: "#B4432E", redSoft: "#F5E5E0",
};
const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, -apple-system, sans-serif";

/* ---------- date helpers ---------- */
const dayMs = 86400000;
const toISO = (d) => d.toISOString().slice(0, 10);
const today = () => toISO(new Date());
const addDays = (iso, n) => toISO(new Date(new Date(iso + "T00:00:00").getTime() + n * dayMs));
const fmtShort = (iso) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso + "T00:00:00")) : "";
const fmtLong = (iso) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso + "T00:00:00")) : "";
const relDay = (iso) => {
  if (!iso) return "";
  const diff = Math.round((new Date(iso + "T00:00:00") - new Date(today() + "T00:00:00")) / dayMs);
  if (diff < 0) return `en retard de ${Math.abs(diff)} j`;
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "demain";
  return `dans ${diff} j`;
};
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- status meta ---------- */
const STATUS = {
  nouveau:        { label: "Nouveau",        color: C.sub,   soft: "#EEF1F0" },
  a_rappeler:     { label: "À rappeler",     color: C.amber, soft: C.amberSoft },
  interesse:      { label: "Intéressé",      color: C.accent, soft: C.accentSoft },
  rdv:            { label: "RDV obtenu",     color: C.accentDk, soft: C.accentSoft },
  pas_interesse:  { label: "Pas intéressé",  color: C.faint, soft: "#EEF1F0" },
  mauvais_numero: { label: "Mauvais numéro", color: C.red,   soft: C.redSoft },
  injoignable:    { label: "Pas répondu",    color: C.sub,   soft: "#EEF1F0" },
};

const OUTCOMES = [
  { key: "injoignable",   label: "Pas répondu",    Icon: PhoneMissed,   tone: C.sub,    kind: "requeue" },
  { key: "interesse",     label: "Intéressé",      Icon: Check,         tone: C.accent, kind: "schedule", defaultDelay: 3 },
  { key: "a_rappeler",    label: "À rappeler",     Icon: CalendarClock, tone: C.amber,  kind: "schedule", defaultDelay: 1 },
  { key: "rdv",           label: "RDV obtenu",     Icon: Handshake,     tone: C.accentDk, kind: "won" },
  { key: "pas_interesse", label: "Pas intéressé",  Icon: X,             tone: C.faint,  kind: "terminal" },
  { key: "mauvais_numero",label: "Mauvais numéro", Icon: PhoneOff,      tone: C.red,    kind: "terminal" },
];

/* ---------- persistence ---------- */
const KEY = "nextcall_state_v1";
const store = {
  async load() {
    try {
      if (!window.storage) return null;
      const r = await window.storage.get(KEY);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async save(v) {
    try { if (window.storage) await window.storage.set(KEY, JSON.stringify(v)); } catch {}
  },
};

/* ---------- seed ---------- */
const seed = () => {
  const t = today();
  return {
    initialized: true,
    settings: { nom: "", entreprise: "Crystal Riviera", objectif: 30 },
    prospects: [
      { id: uid(), prenom: "Élodie", nom: "Marchand", entreprise: "Villa Azur Conciergerie", telephone: "06 12 34 56 78",
        email: "e.marchand@villazur.fr", secteur: "Conciergerie", statut: "a_rappeler",
        consentement: { recueilli: true, date: addDays(t, -6), source: "Formulaire salon Monaco" },
        prochaineRelance: t,
        historique: [{ date: addDays(t, -6), type: "interesse", note: "Gère 40 villas, cherche un prestataire ménage haut de gamme." }] },
      { id: uid(), prenom: "Marco", nom: "Ferri", entreprise: "Résidence Le Bristol", telephone: "07 88 44 22 11",
        email: "", secteur: "Immobilier de luxe", statut: "nouveau",
        consentement: { recueilli: false, date: null, source: "" },
        prochaineRelance: null, historique: [] },
      { id: uid(), prenom: "Sophie", nom: "Nguyen", entreprise: "Boutique Hôtel Beausoleil", telephone: "06 55 66 77 88",
        email: "contact@bh-beausoleil.mc", secteur: "Hôtellerie", statut: "nouveau",
        consentement: { recueilli: true, date: addDays(t, -1), source: "Demande de devis site web" },
        prochaineRelance: null, historique: [] },
    ],
  };
};

/* ---------- reducer ---------- */
function reducer(state, a) {
  switch (a.type) {
    case "LOAD": return a.state;
    case "ADD": return { ...state, prospects: [a.prospect, ...state.prospects] };
    case "PATCH":
      return { ...state, prospects: state.prospects.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };
    case "DELETE":
      return { ...state, prospects: state.prospects.filter((p) => p.id !== a.id) };
    case "SETTINGS": return { ...state, settings: { ...state.settings, ...a.patch } };
    case "LOG": {
      const t = today();
      return {
        ...state,
        prospects: state.prospects.map((p) => {
          if (p.id !== a.id) return p;
          return {
            ...p,
            statut: a.statut,
            prochaineRelance: a.relance ?? (a.kind === "requeue" ? addDays(t, 2) : a.clear ? null : p.prochaineRelance),
            historique: [{ date: t, type: a.statut, note: a.note || "" }, ...(p.historique || [])],
          };
        }),
      };
    }
    case "RESET": return seed();
    default: return state;
  }
}

/* ================================================================== */
export default function App() {
  const [state, dispatch] = useReducer(reducer, null);
  const [tab, setTab] = useState("today");     // today | prospects | settings
  const [calling, setCalling] = useState(false); // in the focused call flow
  const [openId, setOpenId] = useState(null);   // prospect detail
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let live = true;
    store.load().then((s) => { if (live) dispatch({ type: "LOAD", state: s || seed() }); });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (state) store.save(state); }, [state]);

  // inject fonts once
  useEffect(() => {
    if (document.getElementById("nc-fonts")) return;
    const l = document.createElement("style");
    l.id = "nc-fonts";
    l.textContent =
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');" +
      "*{-webkit-tap-highlight-color:transparent;} .nc-tab:focus-visible{outline:2px solid " + C.accent + ";outline-offset:2px;border-radius:12px;}";
    document.head.appendChild(l);
  }, []);

  const queue = useMemo(() => {
    if (!state) return [];
    const t = today();
    return state.prospects
      .filter((p) => !["mauvais_numero", "pas_interesse", "rdv"].includes(p.statut))
      .filter((p) => p.statut === "nouveau" || (p.prochaineRelance && p.prochaineRelance <= t))
      .sort((x, y) => {
        const xr = x.prochaineRelance || "9999", yr = y.prochaineRelance || "9999";
        if (xr !== yr) return xr < yr ? -1 : 1;
        return x.statut === "nouveau" ? 1 : -1; // due relances before brand-new
      });
  }, [state]);

  if (!state) return <div style={{ background: C.bg, minHeight: "100vh" }} />;

  const openProspect = state.prospects.find((p) => p.id === openId);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: BODY, color: C.ink }}>
      <div style={{ maxWidth: 460, margin: "0 auto", position: "relative", minHeight: "100vh", paddingBottom: 84 }}>
        {calling ? (
          <CallFlow state={state} queue={queue} dispatch={dispatch} onExit={() => setCalling(false)} />
        ) : openProspect ? (
          <ProspectDetail p={openProspect} dispatch={dispatch} onBack={() => setOpenId(null)} />
        ) : (
          <>
            {tab === "today" && <Today state={state} queue={queue} onStart={() => queue.length && setCalling(true)} />}
            {tab === "prospects" && (
              <Prospects state={state} onOpen={setOpenId} onAdd={() => setAdding(true)} />
            )}
            {tab === "settings" && <Settings state={state} dispatch={dispatch} />}
            <TabBar tab={tab} setTab={setTab} />
          </>
        )}
        {adding && <AddSheet dispatch={dispatch} onClose={() => setAdding(false)} />}
      </div>
    </div>
  );
}

/* ---------- Today / dashboard ---------- */
function Today({ state, queue, onStart }) {
  const t = today();
  const calls = state.prospects.reduce(
    (n, p) => n + (p.historique || []).filter((h) => h.date === t).length, 0);
  const rdv = state.prospects.reduce(
    (n, p) => n + (p.historique || []).filter((h) => h.date === t && h.type === "rdv").length, 0);
  const relances = state.prospects.filter(
    (p) => p.prochaineRelance && p.prochaineRelance <= t && !["mauvais_numero","pas_interesse","rdv"].includes(p.statut)).length;
  const obj = state.settings.objectif || 30;
  const pct = Math.min(100, Math.round((calls / obj) * 100));
  const next = queue[0];

  return (
    <div style={{ padding: "26px 20px 8px" }}>
      <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: C.faint, fontWeight: 600 }}>
        {fmtLong(t)}
      </div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, margin: "4px 0 22px", letterSpacing: "-.02em" }}>
        Aujourd'hui
      </h1>

      {/* stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Stat n={calls} label="appels" />
        <Stat n={relances} label="relances" tone={relances ? C.amber : C.ink} />
        <Stat n={rdv} label="rendez-vous" tone={rdv ? C.accent : C.ink} />
      </div>

      {/* objective */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: C.sub, fontSize: 14, fontWeight: 500 }}>
            <Target size={15} color={C.accent} /> Objectif du jour
          </span>
          <span style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums", fontSize: 15, color: C.ink }}>
            {calls} / {obj}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "#EDF1EF", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 99, transition: "width .5s cubic-bezier(.2,.7,.3,1)" }} />
        </div>
      </div>

      {/* next up — the signature card */}
      <div style={{ fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: C.faint, fontWeight: 600, margin: "4px 2px 10px" }}>
        Prochain appel
      </div>
      {next ? (
        <>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, boxShadow: "0 1px 2px rgba(14,27,23,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, letterSpacing: "-.01em" }}>
                  {next.prenom} {next.nom}
                </div>
                <div style={{ color: C.sub, fontSize: 15, marginTop: 2 }}>{next.entreprise}</div>
              </div>
              <StatusChip statut={next.statut} />
            </div>
            {next.prochaineRelance && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: C.amber, fontSize: 13.5, fontWeight: 500 }}>
                <CalendarClock size={14} /> Relance {relDay(next.prochaineRelance)}
              </div>
            )}
            <ConsentLine c={next.consentement} />
            {(next.historique?.[0]?.note) && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: C.bg, borderRadius: 12, fontSize: 14, color: C.sub, lineHeight: 1.45 }}>
                {next.historique[0].note}
              </div>
            )}
          </div>
          <button onClick={onStart} className="nc-tab"
            style={{ width: "100%", marginTop: 14, background: C.accent, color: "#fff", border: "none", borderRadius: 16,
              padding: "17px", fontSize: 16.5, fontWeight: 600, fontFamily: BODY, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 9, cursor: "pointer", boxShadow: "0 6px 16px rgba(10,122,85,.28)" }}>
            <Phone size={19} /> Appeler le prochain prospect
          </button>
          {queue.length > 1 && (
            <div style={{ textAlign: "center", color: C.faint, fontSize: 13.5, marginTop: 12 }}>
              {queue.length - 1} autre{queue.length > 2 ? "s" : ""} dans la file
            </div>
          )}
        </>
      ) : (
        <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 20, padding: "34px 20px", textAlign: "center" }}>
          <CircleCheck size={30} color={C.accent} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600 }}>File vide</div>
          <div style={{ color: C.sub, fontSize: 14.5, marginTop: 4 }}>
            Aucun appel en attente. Ajoute des prospects ou reviens à la prochaine relance.
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, tone = C.ink }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 12px" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 600, color: tone, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12.5, color: C.faint, marginTop: 5 }}>{label}</div>
    </div>
  );
}

/* ---------- Call flow — the sub-10s loop ---------- */
function CallFlow({ state, queue, dispatch, onExit }) {
  const [snapshot] = useState(queue);          // freeze the queue at start
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState("ready");   // ready | outcome | schedule | done
  const [pending, setPending] = useState(null); // outcome awaiting schedule
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(null); // confirmation text
  const p = snapshot[idx];

  const advance = () => {
    setNote(""); setPending(null);
    if (idx + 1 < snapshot.length) { setIdx(idx + 1); setStep("ready"); }
    else setStep("finished");
  };

  const commit = (o, relance) => {
    dispatch({
      type: "LOG", id: p.id, statut: o.key, kind: o.kind,
      relance: relance ?? (o.kind === "won" || o.kind === "terminal" ? null : undefined),
      clear: o.kind === "won" || o.kind === "terminal", note,
    });
    const msg =
      o.kind === "won" ? "Rendez-vous enregistré 🎯" :
      relance ? `Relance programmée ${relDay(relance)} (${fmtShort(relance)})` :
      o.kind === "requeue" ? "Reprogrammé dans 2 jours" : "Enregistré";
    setConfirm(msg);
    setTimeout(() => { setConfirm(null); advance(); }, 950);
  };

  const pick = (o) => {
    if (o.kind === "schedule") { setPending(o); setStep("schedule"); }
    else commit(o);
  };

  if (step === "finished") {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: C.accentSoft, display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <CircleCheck size={32} color={C.accent} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600 }}>File terminée</div>
        <div style={{ color: C.sub, fontSize: 15, marginTop: 6 }}>Chaque appel est logué et les relances sont programmées.</div>
        <button onClick={onExit} className="nc-tab"
          style={{ marginTop: 26, background: C.ink, color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15.5, fontWeight: 600, fontFamily: BODY, cursor: "pointer" }}>
          Retour
        </button>
      </div>
    );
  }

  const tel = "tel:" + (p.telephone || "").replace(/\s/g, "");

  return (
    <div style={{ padding: "18px 20px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onExit} className="nc-tab" style={{ background: "none", border: "none", color: C.sub, display: "flex", alignItems: "center", gap: 4, fontSize: 15, cursor: "pointer", fontFamily: BODY, padding: 4 }}>
          <ChevronLeft size={18} /> Quitter
        </button>
        <span style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums", color: C.faint, fontSize: 14 }}>
          {idx + 1} / {snapshot.length}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 20 }}>
        {/* prospect card */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <StatusChip statut={p.statut} center />
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", marginTop: 12 }}>
            {p.prenom} {p.nom}
          </div>
          <div style={{ color: C.sub, fontSize: 16, marginTop: 3 }}>{p.entreprise}</div>
          <div style={{ fontFamily: DISPLAY, fontVariantNumeric: "tabular-nums", fontSize: 20, marginTop: 14, letterSpacing: ".02em" }}>{p.telephone}</div>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}><ConsentLine c={p.consentement} center /></div>
          {p.historique?.[0]?.note && (
            <div style={{ margin: "16px auto 0", maxWidth: 340, padding: "11px 14px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, fontSize: 14.5, color: C.sub, lineHeight: 1.45 }}>
              « {p.historique[0].note} »
            </div>
          )}
        </div>

        {confirm ? (
          <div style={{ textAlign: "center", padding: "24px 0", animation: "none" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accentSoft, color: C.accentDk, padding: "12px 20px", borderRadius: 99, fontSize: 15, fontWeight: 600 }}>
              <Check size={17} /> {confirm}
            </div>
          </div>
        ) : step === "ready" ? (
          <div>
            <a href={tel} onClick={() => setTimeout(() => setStep("outcome"), 250)} className="nc-tab"
              style={{ textDecoration: "none", background: C.accent, color: "#fff", borderRadius: 18, padding: "18px",
                fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 8px 20px rgba(10,122,85,.3)" }}>
              <Phone size={20} /> Appeler
            </a>
            <button onClick={() => setStep("outcome")} className="nc-tab"
              style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: C.faint, fontSize: 14.5, cursor: "pointer", fontFamily: BODY, padding: 8 }}>
              Passer / logger sans appeler
            </button>
          </div>
        ) : step === "outcome" ? (
          <div>
            <div style={{ textAlign: "center", color: C.faint, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
              Résultat de l'appel
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {OUTCOMES.map((o) => (
                <button key={o.key} onClick={() => pick(o)} className="nc-tab"
                  style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 15, padding: "16px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: BODY }}>
                  <span style={{ width: 38, height: 38, borderRadius: 99, background: o.tone + "18", display: "grid", placeItems: "center" }}>
                    <o.Icon size={19} color={o.tone} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* schedule step */
          <ScheduleStep outcome={pending} note={note} setNote={setNote}
            onConfirm={(rel) => commit(pending, rel)} onBack={() => setStep("outcome")} />
        )}
      </div>
    </div>
  );
}

function ScheduleStep({ outcome, note, setNote, onConfirm, onBack }) {
  const t = today();
  const base = [
    { label: "Demain", iso: addDays(t, 1) },
    { label: "Dans 3 jours", iso: addDays(t, 3) },
    { label: "Dans 1 semaine", iso: addDays(t, 7) },
  ];
  const [custom, setCustom] = useState("");
  return (
    <div>
      <div style={{ textAlign: "center", color: C.faint, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
        Programmer la relance
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {base.map((b) => (
          <button key={b.iso} onClick={() => onConfirm(b.iso)} className="nc-tab"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card,
              border: `1px solid ${C.line}`, borderRadius: 14, padding: "15px 16px", cursor: "pointer", fontFamily: BODY }}>
            <span style={{ fontSize: 15.5, fontWeight: 500 }}>{b.label}</span>
            <span style={{ color: C.faint, fontSize: 14, fontFamily: DISPLAY }}>{fmtShort(b.iso)} <ChevronRight size={15} style={{ verticalAlign: "-2px" }} /></span>
          </button>
        ))}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={custom} min={t} onChange={(e) => setCustom(e.target.value)}
            style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 14px", fontSize: 15, fontFamily: BODY, color: C.ink, background: C.card }} />
          <button disabled={!custom} onClick={() => onConfirm(custom)} className="nc-tab"
            style={{ background: custom ? C.accent : "#CBD5D0", color: "#fff", border: "none", borderRadius: 14, padding: "13px 18px", fontWeight: 600, cursor: custom ? "pointer" : "default", fontFamily: BODY }}>
            OK
          </button>
        </div>
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note rapide (optionnel)…"
        style={{ width: "100%", marginTop: 14, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", fontSize: 14.5, fontFamily: BODY, color: C.ink, resize: "none", background: C.card, boxSizing: "border-box" }} />
      <button onClick={onBack} className="nc-tab" style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: C.faint, fontSize: 14, cursor: "pointer", fontFamily: BODY, padding: 6 }}>
        ← Autre résultat
      </button>
    </div>
  );
}

/* ---------- Prospects list ---------- */
function Prospects({ state, onOpen, onAdd }) {
  const [q, setQ] = useState("");
  const list = state.prospects.filter((p) => {
    const s = (p.prenom + " " + p.nom + " " + p.entreprise + " " + p.telephone).toLowerCase();
    return s.includes(q.toLowerCase());
  });
  return (
    <div style={{ padding: "26px 20px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 600, margin: 0, letterSpacing: "-.02em" }}>Prospects</h1>
        <button onClick={onAdd} className="nc-tab" style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, width: 40, height: 40, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <Plus size={20} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: "11px 13px", marginBottom: 16 }}>
        <Search size={17} color={C.faint} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, entreprise, téléphone…"
          style={{ border: "none", outline: "none", flex: 1, fontSize: 15, fontFamily: BODY, background: "transparent", color: C.ink }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((p) => (
          <button key={p.id} onClick={() => onOpen(p.id)} className="nc-tab"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.line}`, borderRadius: 15, padding: "14px 15px", cursor: "pointer", fontFamily: BODY, textAlign: "left" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{p.prenom} {p.nom}</div>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.entreprise}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {p.prochaineRelance && !["mauvais_numero","pas_interesse","rdv"].includes(p.statut) && (
                <span style={{ fontSize: 12.5, color: p.prochaineRelance <= today() ? C.amber : C.faint, fontFamily: DISPLAY }}>{fmtShort(p.prochaineRelance)}</span>
              )}
              <StatusDot statut={p.statut} />
              <ChevronRight size={17} color={C.faint} />
            </div>
          </button>
        ))}
        {!list.length && (
          <div style={{ textAlign: "center", color: C.faint, fontSize: 14.5, padding: "40px 0" }}>
            Aucun prospect. Touche + pour en ajouter.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Prospect detail ---------- */
function ProspectDetail({ p, dispatch, onBack }) {
  const setConsent = () => {
    const has = p.consentement?.recueilli;
    dispatch({ type: "PATCH", id: p.id, patch: { consentement: has
      ? { recueilli: false, date: null, source: "" }
      : { recueilli: true, date: today(), source: "Saisie manuelle" } } });
  };
  const tel = "tel:" + (p.telephone || "").replace(/\s/g, "");
  return (
    <div style={{ padding: "18px 20px 8px", minHeight: "100vh" }}>
      <button onClick={onBack} className="nc-tab" style={{ background: "none", border: "none", color: C.sub, display: "flex", alignItems: "center", gap: 4, fontSize: 15, cursor: "pointer", fontFamily: BODY, padding: 4, marginBottom: 8 }}>
        <ChevronLeft size={18} /> Prospects
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: "-.02em" }}>{p.prenom} {p.nom}</h1>
          <div style={{ color: C.sub, fontSize: 15.5, marginTop: 2 }}>{p.entreprise}{p.secteur ? " · " + p.secteur : ""}</div>
        </div>
        <StatusChip statut={p.statut} />
      </div>

      <a href={tel} className="nc-tab" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: C.accent, color: "#fff", borderRadius: 15, padding: "14px", fontSize: 16, fontWeight: 600, margin: "16px 0 18px", boxShadow: "0 6px 16px rgba(10,122,85,.26)" }}>
        <Phone size={18} /> {p.telephone}
      </a>

      {/* consent — the 2026 compliance field */}
      <div onClick={setConsent} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, background: p.consentement?.recueilli ? C.accentSoft : C.amberSoft, border: `1px solid ${p.consentement?.recueilli ? "#CBE6D8" : "#EEDFBF"}`, borderRadius: 15, padding: "14px 15px", marginBottom: 18 }}>
        {p.consentement?.recueilli ? <ShieldCheck size={22} color={C.accent} /> : <ShieldAlert size={22} color={C.amber} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: p.consentement?.recueilli ? C.accentDk : C.amber }}>
            {p.consentement?.recueilli ? "Consentement recueilli" : "Consentement non recueilli"}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>
            {p.consentement?.recueilli
              ? `${fmtShort(p.consentement.date)} · ${p.consentement.source || "source non précisée"}`
              : "Requis pour démarcher un particulier (loi opt-in, 11 août 2026)"}
          </div>
        </div>
        <span style={{ fontSize: 12.5, color: C.faint }}>modifier</span>
      </div>

      {/* history */}
      <div style={{ fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: C.faint, fontWeight: 600, margin: "4px 2px 10px" }}>Historique</div>
      {p.historique?.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {p.historique.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <StatusDot statut={h.type} />
                {i < p.historique.length - 1 && <div style={{ width: 1, flex: 1, background: C.line, marginTop: 4 }} />}
              </div>
              <div style={{ flex: 1, marginTop: -3 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: STATUS[h.type]?.color || C.ink }}>{STATUS[h.type]?.label || h.type}</span>
                  <span style={{ fontSize: 12.5, color: C.faint, fontFamily: DISPLAY }}>{fmtShort(h.date)}</span>
                </div>
                {h.note && <div style={{ fontSize: 14, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>{h.note}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: C.faint, fontSize: 14, padding: "6px 2px 16px" }}>Aucun appel encore.</div>
      )}

      <button onClick={() => { if (confirm("Supprimer ce prospect ?")) { dispatch({ type: "DELETE", id: p.id }); onBack(); } }}
        className="nc-tab" style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: C.red, fontSize: 14, cursor: "pointer", fontFamily: BODY, padding: "10px 2px", marginTop: 8 }}>
        <Trash2 size={15} /> Supprimer
      </button>
    </div>
  );
}

/* ---------- Add prospect sheet ---------- */
function AddSheet({ dispatch, onClose }) {
  const [f, setF] = useState({ prenom: "", nom: "", entreprise: "", telephone: "", email: "", secteur: "", consent: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.prenom.trim() && f.telephone.trim();
  const save = () => {
    dispatch({ type: "ADD", prospect: {
      id: uid(), prenom: f.prenom.trim(), nom: f.nom.trim(), entreprise: f.entreprise.trim(),
      telephone: f.telephone.trim(), email: f.email.trim(), secteur: f.secteur.trim(),
      statut: "nouveau",
      consentement: f.consent ? { recueilli: true, date: today(), source: "Saisie manuelle" } : { recueilli: false, date: null, source: "" },
      prochaineRelance: null, historique: [],
    }});
    onClose();
  };
  const inp = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px", fontSize: 15.5, fontFamily: BODY, color: C.ink, background: C.card, boxSizing: "border-box", marginBottom: 10 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(14,27,23,.32)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, width: "100%", maxWidth: 460, borderRadius: "22px 22px 0 0", padding: "22px 20px 28px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: C.line, margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, margin: "0 0 16px" }}>Nouveau prospect</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Prénom *" value={f.prenom} onChange={set("prenom")} style={{ ...inp, flex: 1 }} />
          <input placeholder="Nom" value={f.nom} onChange={set("nom")} style={{ ...inp, flex: 1 }} />
        </div>
        <input placeholder="Entreprise" value={f.entreprise} onChange={set("entreprise")} style={inp} />
        <input placeholder="Téléphone *" value={f.telephone} onChange={set("telephone")} inputMode="tel" style={inp} />
        <input placeholder="Email (optionnel)" value={f.email} onChange={set("email")} inputMode="email" style={inp} />
        <input placeholder="Secteur (optionnel)" value={f.secteur} onChange={set("secteur")} style={inp} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 2px 4px", cursor: "pointer" }}>
          <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.accent }} />
          <span style={{ fontSize: 14, color: C.sub }}>Consentement au démarchage recueilli</span>
        </label>
        <button disabled={!valid} onClick={save} className="nc-tab"
          style={{ width: "100%", marginTop: 14, background: valid ? C.accent : "#CBD5D0", color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 16, fontWeight: 600, cursor: valid ? "pointer" : "default", fontFamily: BODY }}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
function Settings({ state, dispatch }) {
  const s = state.settings;
  const exportCSV = () => {
    const head = ["prenom","nom","entreprise","telephone","email","secteur","statut","prochaineRelance","consentement","date_consentement"];
    const rows = state.prospects.map((p) => [p.prenom,p.nom,p.entreprise,p.telephone,p.email,p.secteur,p.statut,p.prochaineRelance||"",
      p.consentement?.recueilli?"oui":"non", p.consentement?.date||""].map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(","));
    const csv = [head.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "nextcall-prospects.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const inp = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 15.5, fontFamily: BODY, color: C.ink, background: C.card, boxSizing: "border-box" };
  const Row = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
  return (
    <div style={{ padding: "26px 20px 8px" }}>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 600, margin: "0 0 20px", letterSpacing: "-.02em" }}>Réglages</h1>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginBottom: 16 }}>
        <Row label="Entreprise"><input value={s.entreprise} onChange={(e)=>dispatch({type:"SETTINGS",patch:{entreprise:e.target.value}})} style={inp} /></Row>
        <Row label="Objectif d'appels par jour">
          <input type="number" min={1} value={s.objectif} onChange={(e)=>dispatch({type:"SETTINGS",patch:{objectif:Math.max(1,+e.target.value||1)}})} style={inp} />
        </Row>
      </div>
      <button onClick={exportCSV} className="nc-tab" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 500, color: C.ink, cursor: "pointer", fontFamily: BODY, marginBottom: 10 }}>
        <Download size={17} /> Exporter les prospects (CSV)
      </button>
      <button onClick={() => { if (confirm("Réinitialiser toutes les données de démonstration ?")) dispatch({ type: "RESET" }); }}
        className="nc-tab" style={{ width: "100%", background: "none", border: "none", color: C.faint, fontSize: 13.5, cursor: "pointer", fontFamily: BODY, padding: 10 }}>
        Réinitialiser la démo
      </button>
      <div style={{ textAlign: "center", color: C.faint, fontSize: 12, marginTop: 20, lineHeight: 1.5 }}>
        NextCall · prototype de la boucle centrale<br/>Données stockées sur cet appareil
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function StatusChip({ statut, center }) {
  const s = STATUS[statut] || STATUS.nouveau;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: s.soft, color: s.color, padding: "5px 11px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, margin: center ? "0 auto" : 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color }} /> {s.label}
    </span>
  );
}
function StatusDot({ statut }) {
  const s = STATUS[statut] || STATUS.nouveau;
  return <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color, flexShrink: 0, display: "inline-block" }} />;
}
function ConsentLine({ c, center }) {
  const ok = c?.recueilli;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: ok ? C.accent : C.amber, marginTop: center ? 0 : 10, justifyContent: center ? "center" : "flex-start" }}>
      {ok ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
      {ok ? `Consentement OK · ${fmtShort(c.date)}` : "Consentement à recueillir"}
    </span>
  );
}

/* ---------- bottom tab bar ---------- */
function TabBar({ tab, setTab }) {
  const items = [
    { key: "today", label: "Aujourd'hui", Icon: Home },
    { key: "prospects", label: "Prospects", Icon: Users },
    { key: "settings", label: "Réglages", Icon: SettingsIcon },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ width: "100%", maxWidth: 460, background: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.line}`, display: "flex", pointerEvents: "auto", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {items.map((it) => {
          const on = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} className="nc-tab"
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "11px 0 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: BODY }}>
              <it.Icon size={21} color={on ? C.accent : C.faint} strokeWidth={on ? 2.4 : 2} />
              <span style={{ fontSize: 11, fontWeight: on ? 600 : 500, color: on ? C.accent : C.faint }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
