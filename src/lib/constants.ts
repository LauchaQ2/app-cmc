export const SLOT_MINUTES = 15;

export const DEFAULT_BUSINESS_HOURS = {
  start: "09:00",
  end: "20:00",
};

export const APPOINTMENT_STATUSES = [
  "pendiente",
  "confirmado",
  "completado",
  "cancelado",
] as const;

export const PAYMENT_STATUSES = ["pendiente", "pagado"] as const;

export const WEEK_DAYS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
] as const;
