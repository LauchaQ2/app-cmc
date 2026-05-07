"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import type {
  Appointment,
  Client,
  Employee,
  EmployeeService,
  Service,
} from "@/types/domain";
import { apiGet } from "@/lib/api";
import { AppointmentsCalendar } from "@/features/appointments/appointments-calendar";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { AppointmentDetailDialog } from "@/features/appointments/appointment-detail-dialog";
import { useAppointmentReminders } from "@/features/appointments/use-appointment-reminders";
import { useOfflineAppointmentSync } from "@/features/appointments/use-offline-appointment-sync";
import {
  ClientsModule,
  EmployeesModule,
  ServicesModule,
} from "@/features/entities/entity-modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardTab = "turnos" | "clientes" | "servicios" | "empleadas" | "reportes";

const employeePalette = ["#4e7b68", "#d87543", "#1a759f", "#8f5db7", "#9c6644", "#a62934"];

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DashboardTab>("turnos");

  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [slot, setSlot] = useState<{ date: string; startTime: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const [clientsRes, employeesRes, servicesRes, appointmentsRes, employeeServicesRes] =
        await Promise.all([
          apiGet<Client[]>("/api/clients"),
          apiGet<Employee[]>("/api/employees"),
          apiGet<Service[]>("/api/services"),
          apiGet<Appointment[]>(`/api/appointments?from=${monthStart}`),
          apiGet<EmployeeService[]>("/api/employee-services"),
        ]);
      setClients(clientsRes);
      setEmployees(employeesRes);
      setServices(servicesRes);
      setAppointments(appointmentsRes);
      setEmployeeServices(employeeServicesRes);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  useAppointmentReminders(appointments);
  const { pendingCount, syncNow } = useOfflineAppointmentSync(loadData);

  const askBrowserNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Este navegador no soporta notificaciones");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notificaciones activadas");
    } else {
      toast.error("No se habilitaron notificaciones");
    }
  };

  const employeeColors = useMemo(() => {
    return employees.reduce<Record<string, string>>((accumulator, employee, index) => {
      accumulator[employee.id] = employeePalette[index % employeePalette.length];
      return accumulator;
    }, {});
  }, [employees]);

  const filteredAppointments = useMemo(() => {
    if (selectedEmployee === "all") return appointments;
    return appointments.filter((appointment) => appointment.employee_id === selectedEmployee);
  }, [appointments, selectedEmployee]);

  const reportData = useMemo(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    const monthAppointments = appointments.filter((appointment) =>
      appointment.appointment_date.startsWith(currentMonth),
    );

    const revenue = monthAppointments.reduce(
      (sum, appointment) => sum + Number(appointment.amount ?? 0),
      0,
    );

    const serviceCount = monthAppointments.reduce<Record<string, number>>((acc, item) => {
      const key = item.service?.name ?? "Sin servicio";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      monthlyAppointments: monthAppointments.length,
      revenue,
      topServices,
    };
  }, [appointments]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Gestion de turnos CMC</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant={tab === "turnos" ? "default" : "outline"} onClick={() => setTab("turnos")}>Turnos</Button>
            <Button variant={tab === "clientes" ? "default" : "outline"} onClick={() => setTab("clientes")}>Clientes</Button>
            <Button variant={tab === "servicios" ? "default" : "outline"} onClick={() => setTab("servicios")}>Servicios</Button>
            <Button variant={tab === "empleadas" ? "default" : "outline"} onClick={() => setTab("empleadas")}>Empleadas</Button>
            <Button variant={tab === "reportes" ? "default" : "outline"} onClick={() => setTab("reportes")}>Reportes</Button>
            <Button variant="outline" onClick={askBrowserNotificationPermission}>Notificaciones</Button>
            <Button variant="outline" onClick={() => void syncNow()}>
              Sincronizar offline ({pendingCount})
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? <p>Cargando datos...</p> : null}

      {tab === "turnos" && !loading ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-center">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por empleada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    {employees.map((employee) => (
                      <Badge
                        key={employee.id}
                        style={{
                          backgroundColor: employeeColors[employee.id],
                          color: "white",
                        }}
                      >
                        {employee.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <AppointmentsCalendar
              appointments={filteredAppointments}
              employeeColors={employeeColors}
              onSelectSlot={setSlot}
              onSelectEvent={(appointment) => setSelectedAppointment(appointment)}
            />
          </div>

          <AppointmentForm
            clients={clients}
            employees={employees}
            services={services}
            employeeServices={employeeServices}
            initialSlot={slot}
            onCreated={loadData}
          />
        </div>
      ) : null}

      {tab === "clientes" && !loading ? (
        <ClientsModule clients={clients} onUpdated={loadData} />
      ) : null}

      {tab === "servicios" && !loading ? (
        <ServicesModule services={services} onUpdated={loadData} />
      ) : null}

      {tab === "empleadas" && !loading ? (
        <EmployeesModule
          employees={employees}
          services={services}
          employeeServices={employeeServices}
          onUpdated={loadData}
        />
      ) : null}

      {tab === "reportes" && !loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Turnos del mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{reportData.monthlyAppointments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ingresos del mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">${reportData.revenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Servicios mas solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {reportData.topServices.map(([service, count]) => (
                  <li key={service}>
                    {service}: {count}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <AppointmentDetailDialog
        key={selectedAppointment?.id ?? "appointment-dialog"}
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdated={loadData}
      />
    </div>
  );
}
