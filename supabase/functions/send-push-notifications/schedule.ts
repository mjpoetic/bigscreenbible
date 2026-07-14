export type PushSchedule = {
  timezone: string;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  last_opened_at: string;
  last_morning_sent_on: string | null;
  last_evening_sent_on: string | null;
};

export type DueNotification = {
  kind: "morning" | "evening";
  localDate: string;
};

function clockParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

function previousDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return date.toISOString().slice(0, 10);
}

function scheduleOccurrence(now: Date, timezone: string, time: string, windowMinutes: number) {
  const local = clockParts(now, timezone);
  const match = String(time).match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const scheduledMinutes = Number(match[1]) * 60 + Number(match[2]);
  const elapsed = (local.minutes - scheduledMinutes + 1440) % 1440;
  if (elapsed > windowMinutes) return null;
  return {
    localDate: scheduledMinutes > local.minutes ? previousDate(local.date) : local.date,
  };
}

function openedOnDate(timestamp: string, timezone: string, dateKey: string) {
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return false;
  return clockParts(new Date(timestamp), timezone).date === dateKey;
}

export function dueNotifications(schedule: PushSchedule, now = new Date(), windowMinutes = 9): DueNotification[] {
  const due: DueNotification[] = [];
  const morning = scheduleOccurrence(now, schedule.timezone, schedule.morning_time, windowMinutes);
  if (morning && schedule.last_morning_sent_on !== morning.localDate) {
    due.push({ kind: "morning", localDate: morning.localDate });
  }

  const evening = schedule.evening_enabled
    ? scheduleOccurrence(now, schedule.timezone, schedule.evening_time, windowMinutes)
    : null;
  if (
    evening && schedule.last_evening_sent_on !== evening.localDate &&
    !openedOnDate(schedule.last_opened_at, schedule.timezone, evening.localDate)
  ) {
    due.push({ kind: "evening", localDate: evening.localDate });
  }
  return due;
}
