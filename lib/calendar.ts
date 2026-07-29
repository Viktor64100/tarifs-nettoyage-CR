// Génère un événement calendrier pour un rendez-vous obtenu, sans dépendance externe :
// un lien Google Calendar (pré-rempli, aucun fichier) et un .ics téléchargeable pour
// Apple Calendar / Outlook. Durée par défaut de 30 minutes, non stockée en base.

type CalendarEvent = {
  title: string;
  description?: string;
  start: Date;
  durationMinutes?: number;
};

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildICS({ title, description, start, durationMinutes = 30 }: CalendarEvent): string {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const uid = `${toICSDate(start)}-${Math.random().toString(36).slice(2, 10)}@nextcall.tech`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NextCall//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return lines.join("\r\n");
}

export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl({ title, description, start, durationMinutes = 30 }: CalendarEvent): string {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toICSDate(start)}/${toICSDate(end)}`,
    details: description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
