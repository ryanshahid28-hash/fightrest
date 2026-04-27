/**
 * generateCalendarEvent — Zero-dependency, client-side only.
 *
 * Creates an .ics (iCalendar) file from a title + date + time,
 * converts it to a Blob, and triggers a download so the phone's
 * native calendar app opens and imports the event.
 *
 * @param title  – Event / task title
 * @param date   – ISO date string "YYYY-MM-DD"
 * @param time   – 24-hour time string "HH:MM"
 */
export function generateCalendarEvent(
  title: string,
  date: string,
  time: string
): void {
  // ── Parse inputs ──────────────────────────────────────
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 min

  // ── Format to iCalendar UTC timestamps ────────────────
  const pad = (n: number) => String(n).padStart(2, "0");

  const toICSDate = (d: Date): string => {
    const y = d.getUTCFullYear();
    const mo = pad(d.getUTCMonth() + 1);
    const dy = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const mi = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${mo}${dy}T${h}${mi}${s}Z`;
  };

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@fightclub`;
  const now = toICSDate(new Date());
  const dtStart = toICSDate(start);
  const dtEnd = toICSDate(end);

  // ── Raw .ics template ─────────────────────────────────
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FightClub//TaskTracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Fight Club Task — ${title}`,
    "STATUS:CONFIRMED",
    // ── 15-minute reminder alarm ──
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${title} starts in 15 minutes`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // ── Blob → download trigger ───────────────────────────
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
