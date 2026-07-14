import { dueNotifications, type PushSchedule } from "./schedule.ts";

function assertEquals(actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) throw new Error(`Expected ${expectedJson}, received ${actualJson}`);
}

function schedule(overrides: Partial<PushSchedule> = {}): PushSchedule {
  return {
    timezone: "America/New_York",
    morning_time: "07:00:00",
    evening_enabled: true,
    evening_time: "18:00:00",
    last_opened_at: "2026-07-13T12:00:00.000Z",
    last_morning_sent_on: null,
    last_evening_sent_on: null,
    ...overrides,
  };
}

Deno.test("morning reminder follows the device timezone", () => {
  const due = dueNotifications(schedule(), new Date("2026-07-14T11:04:00.000Z"));
  assertEquals(due, [{ kind: "morning", localDate: "2026-07-14" }]);
});

Deno.test("evening reminder is suppressed after a same-day open", () => {
  const due = dueNotifications(
    schedule({ last_opened_at: "2026-07-14T15:30:00.000Z" }),
    new Date("2026-07-14T22:04:00.000Z"),
  );
  assertEquals(due, []);
});

Deno.test("evening reminder is due when the app was not opened today", () => {
  const due = dueNotifications(schedule(), new Date("2026-07-14T22:04:00.000Z"));
  assertEquals(due, [{ kind: "evening", localDate: "2026-07-14" }]);
});

Deno.test("a claimed local date is not sent twice", () => {
  const due = dueNotifications(
    schedule({ last_morning_sent_on: "2026-07-14" }),
    new Date("2026-07-14T11:04:00.000Z"),
  );
  assertEquals(due, []);
});

Deno.test("late-night schedules survive a cron tick after midnight", () => {
  const due = dueNotifications(
    schedule({ timezone: "UTC", morning_time: "23:58:00", evening_enabled: false }),
    new Date("2026-07-15T00:03:00.000Z"),
  );
  assertEquals(due, [{ kind: "morning", localDate: "2026-07-14" }]);
});
