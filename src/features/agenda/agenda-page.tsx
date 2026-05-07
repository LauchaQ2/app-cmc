"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import type { Appointment, Client, Employee, EmployeeService, Service } from "@/types/domain";
import { apiGet } from "@/lib/api";
import { AppointmentsCalendar } from "@/features/appointments/appointments-calendar";
import { AppointmentDetailDialog } from "@/features/appointments/appointment-detail-dialog";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { useOfflineAppointmentSync } from "@/features/appointments/use-offline-appointment-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const employeePalette = ["#4e7b68", "#d87543", "#1a759f", "#8f5db7", "#9c6644", "#a62934"];

export function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [filterEmployee, setFilterEmployee] = useState("all");
  const [slot, setSlot] = useState<{ date: string; startTime: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const [clientsRes, employeesRes, servicesRes, appointmentsRes, empSvcsRes] =
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
      setEmployeeServices(empSvcsRes);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(t);
  }, [loadData]);

  const { pendingCount, syncNow } = useOfflineAppointmentSync(loadData);

  const employeeColors = useMemo(
    () =>
      employees.reduce<Record<string, string>>((acc, emp, idx) => {
        acc[emp.id] = employeePalette[idx % employeePalette.length];
        return acc;
      }, {}),
    [employees],
  );

  const filteredAppointments = useMemo(
    () =>
      filterEmployee === "all"
        ? appointments
        : appointments.filter((a) => a.employee_id === filterEmployee),
    [appointments, filterEmployee],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Agenda</h2>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Todas las empleadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empleadas</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {employees.map((e) => (
                <Badge
                  key={e.id}
                  style={{ backgroundColor: employeeColors[e.id], color: "white" }}
                >
                  {e.name}
                </Badge>
              ))}
            </div>

            <div className="ml-auto flex gap-2">
              {pendingCount > 0 && (
                <Button variant="outline" size="sm" onClick={() => void syncNow()}>
                  Sincronizar ({pendingCount})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setSlot(null);
                  setShowCreateDialog(true);
                }}
              >
                Nuevo turno
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 animate-pulse rounded-lg bg-accent" />
          ) : (
            <AppointmentsCalendar
              appointments={filteredAppointments}
              employeeColors={employeeColors}
              onSelectSlot={(s) => {
                setSlot(s);
                setShowCreateDialog(true);
              }}
              onSelectEvent={(appt) => setSelectedAppointment(appt)}
            />
          )}
        </CardContent>
      </Card>

      {/* Create dialog (triggered from calendar slot or button) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            clients={clients}
            employees={employees}
            services={services}
            employeeServices={employeeServices}
            initialSlot={slot}
            onCreated={async () => {
              setShowCreateDialog(false);
              setSlot(null);
              await loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <AppointmentDetailDialog
        key={selectedAppointment?.id ?? "agenda-detail"}
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdated={loadData}
      />
    </div>
  );
}
