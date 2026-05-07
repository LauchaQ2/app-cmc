"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Client, Employee, EmployeeService, Service } from "@/types/domain";
import { appointmentSchema } from "@/lib/schemas";
import { apiGet, apiMutation } from "@/lib/api";
import { enqueuePendingAppointment } from "@/features/appointments/offline-queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AppointmentFormSchema = z.infer<typeof appointmentSchema>;

type AppointmentFormProps = {
  clients: Client[];
  employees: Employee[];
  services: Service[];
  employeeServices: EmployeeService[];
  initialSlot?: { date: string; startTime: string } | null;
  onCreated: () => Promise<void>;
};

export function AppointmentForm({
  clients,
  employees,
  services,
  employeeServices,
  initialSlot,
  onCreated,
}: AppointmentFormProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const form = useForm<AppointmentFormSchema>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      amount: 0,
      payment_status: "pendiente",
      status: "pendiente",
      notes: "",
      appointment_date: initialSlot?.date ?? "",
      start_time: initialSlot?.startTime ?? "",
    },
  });

  const selectedService = form.watch("service_id");
  const selectedEmployee = form.watch("employee_id");
  const selectedDate = form.watch("appointment_date");

  const activeServices = useMemo(() => {
    const enabledServices = services.filter((service) => service.active);

    if (!selectedEmployee) return enabledServices;

    const allowedServiceIds = new Set(
      employeeServices
        .filter((item) => item.employee_id === selectedEmployee)
        .map((item) => item.service_id),
    );

    return enabledServices.filter((service) => allowedServiceIds.has(service.id));
  }, [employeeServices, selectedEmployee, services]);

  useEffect(() => {
    if (!selectedService || !selectedEmployee || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const service = services.find((item) => item.id === selectedService);
    if (!service) return;

    const query = new URLSearchParams({
      employeeId: selectedEmployee,
      date: selectedDate,
      duration: String(service.duration_minutes),
    });

    apiGet<{ slots: string[] }>(`/api/availability?${query.toString()}`)
      .then((data) => setAvailableSlots(data.slots))
      .catch((error) => {
        toast.error(error.message);
        setAvailableSlots([]);
      });
  }, [selectedDate, selectedEmployee, selectedService, services]);

  useEffect(() => {
    if (initialSlot?.date) {
      form.setValue("appointment_date", initialSlot.date);
    }
    if (initialSlot?.startTime) {
      form.setValue("start_time", initialSlot.startTime);
    }
  }, [form, initialSlot]);

  const submit = form.handleSubmit(async (values) => {
    if (!availableSlots.includes(values.start_time)) {
      toast.error("Ese horario ya no esta disponible para la empleada seleccionada");
      return;
    }

    const service = services.find((item) => item.id === values.service_id);
    if (!service) {
      toast.error("Servicio no valido");
      return;
    }

    try {
      const payload = {
        ...values,
        amount: service.price,
      };

      if (!navigator.onLine) {
        enqueuePendingAppointment(payload);
        toast.info("Sin conexion: el turno quedo en cola para sincronizarse");
      } else {
        await apiMutation("/api/appointments", "POST", payload);
        toast.success("Turno creado correctamente");
      }

      form.reset({
        amount: 0,
        payment_status: "pendiente",
        status: "pendiente",
        notes: "",
      });
      setAvailableSlots([]);
      await onCreated();
    } catch (error) {
      if ((error as Error).message.toLowerCase().includes("failed to fetch")) {
        const payload = {
          ...values,
          amount: service.price,
        };
        enqueuePendingAppointment(payload);
        toast.info("No se pudo conectar: turno guardado para sincronizar");
        return;
      }

      toast.error((error as Error).message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo turno</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1">
            <Label>Cliente</Label>
            <Select onValueChange={(value) => form.setValue("client_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Empleada</Label>
            <Select onValueChange={(value) => form.setValue("employee_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleada" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter((employee) => employee.active)
                  .map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Servicio</Label>
            <Select onValueChange={(value) => form.setValue("service_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.watch("appointment_date") ?? ""}
                onChange={(event) => form.setValue("appointment_date", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Horario disponible</Label>
              <Select onValueChange={(value) => form.setValue("start_time", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir horario" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select
                defaultValue="pendiente"
                onValueChange={(value) => form.setValue("status", value as AppointmentFormSchema["status"])}
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
            <div className="space-y-1">
              <Label>Pago</Label>
              <Select
                defaultValue="pendiente"
                onValueChange={(value) =>
                  form.setValue("payment_status", value as AppointmentFormSchema["payment_status"])
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

          <div className="space-y-1">
            <Label>Notas</Label>
            <Input
              placeholder="Detalles opcionales"
              value={form.watch("notes") ?? ""}
              onChange={(event) => form.setValue("notes", event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Agendar turno
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
