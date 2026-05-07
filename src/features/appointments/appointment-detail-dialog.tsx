"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Appointment } from "@/types/domain";
import { apiMutation } from "@/lib/api";
import {
  enqueuePendingAppointmentDelete,
  enqueuePendingAppointmentUpdate,
} from "@/features/appointments/offline-queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppointmentDetailDialogProps = {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => Promise<void>;
};

export function AppointmentDetailDialog({
  appointment,
  onOpenChange,
  onUpdated,
}: AppointmentDetailDialogProps) {
  const [status, setStatus] = useState<Appointment["status"]>(
    appointment?.status ?? "pendiente",
  );
  const [paymentStatus, setPaymentStatus] = useState<Appointment["payment_status"]>(
    appointment?.payment_status ?? "pendiente",
  );
  const [appointmentDate, setAppointmentDate] = useState(
    appointment?.appointment_date ?? "",
  );
  const [startTime, setStartTime] = useState(appointment?.start_time.slice(0, 5) ?? "");

  if (!appointment) return null;

  const update = async () => {
    try {
      const payload = {
        appointment_date: appointmentDate,
        start_time: startTime,
        status,
        payment_status: paymentStatus,
      };

      if (!navigator.onLine) {
        enqueuePendingAppointmentUpdate(appointment.id, payload);
        toast.info("Sin conexion: cambios en cola para sincronizar");
        onOpenChange(false);
        return;
      }

      await apiMutation(`/api/appointments/${appointment.id}`, "PATCH", {
        ...payload,
      });
      toast.success("Turno actualizado");
      await onUpdated();
      onOpenChange(false);
    } catch (error) {
      if ((error as Error).message.toLowerCase().includes("failed to fetch")) {
        enqueuePendingAppointmentUpdate(appointment.id, {
          appointment_date: appointmentDate,
          start_time: startTime,
          status,
          payment_status: paymentStatus,
        });
        toast.info("No se pudo conectar: cambios guardados para sincronizar");
        onOpenChange(false);
        return;
      }

      toast.error((error as Error).message);
    }
  };

  const remove = async () => {
    try {
      if (!navigator.onLine) {
        enqueuePendingAppointmentDelete(appointment.id);
        toast.info("Sin conexion: eliminacion en cola para sincronizar");
        onOpenChange(false);
        return;
      }

      await apiMutation(`/api/appointments/${appointment.id}`, "DELETE");
      toast.success("Turno eliminado");
      await onUpdated();
      onOpenChange(false);
    } catch (error) {
      if ((error as Error).message.toLowerCase().includes("failed to fetch")) {
        enqueuePendingAppointmentDelete(appointment.id);
        toast.info("No se pudo conectar: eliminacion guardada para sincronizar");
        onOpenChange(false);
        return;
      }

      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={Boolean(appointment)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle del turno</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            <strong>Cliente:</strong> {appointment.client?.name}
          </p>
          <p>
            <strong>Servicio:</strong> {appointment.service?.name}
          </p>
          <p>
            <strong>Empleada:</strong> {appointment.employee?.name}
          </p>
          <p>
            <strong>Fecha:</strong> {appointment.appointment_date}
          </p>
          <p>
            <strong>Horario:</strong> {appointment.start_time} - {appointment.end_time}
          </p>
          <p>
            <strong>Monto:</strong> ${appointment.amount}
          </p>
          <div className="flex items-center gap-2">
            <Badge>{appointment.status}</Badge>
            <Badge>{appointment.payment_status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
              />
            </div>

            <div>
              <Label>Hora inicio</Label>
              <Input
                type="time"
                step={900}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div>
              <Label>Estado</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as Appointment["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            </div>

            <div>
              <Label>Pago</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) =>
                setPaymentStatus(value as Appointment["payment_status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={update} className="flex-1">
            Guardar cambios
          </Button>
          <Button onClick={remove} variant="destructive" className="flex-1">
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
