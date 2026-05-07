import { z } from "zod";
import { APPOINTMENT_STATUSES, PAYMENT_STATUSES, SLOT_MINUTES } from "@/lib/constants";

export const clientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  active: z.boolean().default(true),
  work_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  work_end_time: z.string().regex(/^\d{2}:\d{2}$/),
  work_days: z.array(z.string()).min(1),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  duration_minutes: z
    .coerce.number()
    .min(SLOT_MINUTES)
    .refine((v) => v % SLOT_MINUTES === 0, "Debe ser multiplo de 15 minutos"),
  price: z.coerce.number().min(0),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const appointmentSchema = z.object({
  client_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  service_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(APPOINTMENT_STATUSES).default("pendiente"),
  payment_status: z.enum(PAYMENT_STATUSES).default("pendiente"),
  amount: z.coerce.number().min(0),
  notes: z.string().optional(),
});
