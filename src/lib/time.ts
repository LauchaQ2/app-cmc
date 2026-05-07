import { addMinutes, format, parse, set } from "date-fns";
import { SLOT_MINUTES, WEEK_DAYS } from "@/lib/constants";
import type { Appointment, Employee } from "@/types/domain";

export function parseTimeToDate(baseDate: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export function dateToTimeString(date: Date) {
  return format(date, "HH:mm");
}

export function calculateEndTime(startTime: string, durationMinutes: number) {
  const parsed = parse(startTime, "HH:mm", new Date());
  return format(addMinutes(parsed, durationMinutes), "HH:mm");
}

export function isValidDuration(duration: number) {
  return duration >= SLOT_MINUTES && duration % SLOT_MINUTES === 0;
}

export function getDayName(dateStr: string) {
  const dayIndex = new Date(`${dateStr}T00:00:00`).getDay();
  return WEEK_DAYS[dayIndex];
}

export function calculateAvailableSlots(params: {
  date: string;
  durationMinutes: number;
  employee: Employee;
  appointments: Appointment[];
}) {
  const { date, durationMinutes, employee, appointments } = params;

  if (!isValidDuration(durationMinutes)) return [];
  if (!employee.work_days.includes(getDayName(date))) return [];

  const day = new Date(`${date}T00:00:00`);
  const workStart = parseTimeToDate(day, employee.work_start_time);
  const workEnd = parseTimeToDate(day, employee.work_end_time);

  const blocked = appointments
    .filter((a) => a.status !== "cancelado")
    .map((a) => ({
      start: parseTimeToDate(day, a.start_time),
      end: parseTimeToDate(day, a.end_time),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: string[] = [];
  let cursor = workStart;

  while (cursor < workEnd) {
    const slotEnd = addMinutes(cursor, durationMinutes);

    if (slotEnd <= workEnd) {
      const overlaps = blocked.some(
        (b) => cursor < b.end && slotEnd > b.start,
      );
      if (!overlaps) {
        slots.push(dateToTimeString(cursor));
      }
    }

    cursor = addMinutes(cursor, SLOT_MINUTES);
  }

  return slots;
}
