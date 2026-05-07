import { apiMutation } from "@/lib/api";

const QUEUE_KEY = "cmc_pending_appointments";

export type AppointmentQueuePayload = {
  client_id: string;
  employee_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  status: "pendiente" | "confirmado" | "completado" | "cancelado";
  payment_status: "pendiente" | "pagado";
  amount: number;
  notes?: string;
};

type PendingAppointment = {
  id: string;
  action: "create" | "update" | "delete";
  appointmentId?: string;
  payload?: AppointmentQueuePayload | Partial<AppointmentQueuePayload>;
  createdAt: string;
  retries: number;
  lastError?: string;
};

function readQueue(): PendingAppointment[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PendingAppointment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingAppointment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cmc:queue-updated"));
}

export function getPendingAppointmentsCount() {
  return readQueue().length;
}

function pushPending(item: Omit<PendingAppointment, "id" | "createdAt" | "retries">) {
  const queue = readQueue();
  queue.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retries: 0,
    ...item,
  });
  writeQueue(queue);
}

export function enqueuePendingAppointment(payload: AppointmentQueuePayload) {
  pushPending({
    action: "create",
    payload,
  });
}

export function enqueuePendingAppointmentUpdate(
  appointmentId: string,
  payload: Partial<AppointmentQueuePayload>,
) {
  pushPending({
    action: "update",
    appointmentId,
    payload,
  });
}

export function enqueuePendingAppointmentDelete(appointmentId: string) {
  pushPending({
    action: "delete",
    appointmentId,
  });
}

export async function syncPendingAppointments() {
  const queue = readQueue();
  if (queue.length === 0) {
    return { synced: 0, pending: 0 };
  }

  const pending = [...queue];
  let synced = 0;

  for (let i = 0; i < pending.length; i += 1) {
    const item = pending[i];

    try {
      if (item.action === "create") {
        await apiMutation("/api/appointments", "POST", item.payload);
      }

      if (item.action === "update") {
        await apiMutation(
          `/api/appointments/${item.appointmentId}`,
          "PATCH",
          item.payload,
        );
      }

      if (item.action === "delete") {
        await apiMutation(`/api/appointments/${item.appointmentId}`, "DELETE");
      }

      pending.splice(i, 1);
      i -= 1;
      synced += 1;
    } catch (error) {
      pending[i] = {
        ...item,
        retries: item.retries + 1,
        lastError: (error as Error).message,
      };

      if (!navigator.onLine) break;
    }
  }

  writeQueue(pending);
  return { synced, pending: pending.length };
}
