"use client";

import { useEffect, useRef } from "react";
import { differenceInMinutes, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Appointment } from "@/types/domain";

export function useAppointmentReminders(appointments: Appointment[]) {
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUpcoming = () => {
      const now = new Date();

      appointments
        .filter((appointment) =>
          ["pendiente", "confirmado"].includes(appointment.status),
        )
        .forEach((appointment) => {
          const appointmentDate = parseISO(
            `${appointment.appointment_date}T${appointment.start_time}`,
          );
          const minutesLeft = differenceInMinutes(appointmentDate, now);

          if (minutesLeft >= 0 && minutesLeft <= 60) {
            if (notifiedIdsRef.current.has(appointment.id)) return;

            notifiedIdsRef.current.add(appointment.id);
            const message = `${appointment.client?.name ?? "Cliente"} en ${minutesLeft} min (${appointment.service?.name ?? "Servicio"})`;

            toast.info(`Recordatorio: ${message}`);

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Turno proximo", {
                body: message,
              });
            }
          }
        });
    };

    checkUpcoming();
    const interval = window.setInterval(checkUpcoming, 60000);

    return () => window.clearInterval(interval);
  }, [appointments]);
}
