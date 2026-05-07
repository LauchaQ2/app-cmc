"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Client, Employee, EmployeeService, Service } from "@/types/domain";
import { apiGet } from "@/lib/api";
import { AppointmentDetailDialog } from "@/features/appointments/appointment-detail-dialog";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { useOfflineAppointmentSync } from "@/features/appointments/use-offline-appointment-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#f59e0b",
  confirmado: "#22c55e",
  completado: "#3b82f6",
  cancelado: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export function TurnosPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);

  // Detail/edit dialog
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filterEmployee !== "all" && a.employee_id !== filterEmployee) return false;
        if (filterStatus !== "all" && a.status !== filterStatus) return false;
        if (filterDate && a.appointment_date !== filterDate) return false;
        return true;
      })
      .sort((a, b) => {
        const da = `${a.appointment_date} ${a.start_time}`;
        const db = `${b.appointment_date} ${b.start_time}`;
        return db.localeCompare(da);
      });
  }, [appointments, filterEmployee, filterStatus, filterDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Turnos</h2>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => void syncNow()}>
              Sincronizar ({pendingCount})
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo turno
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger>
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

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          placeholder="Filtrar por fecha"
        />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {loading
              ? "Cargando..."
              : `${filtered.length} turno${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-accent" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay turnos que coincidan con los filtros.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((appt) => (
                <button
                  key={appt.id}
                  className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/30"
                  onClick={() => setSelectedAppointment(appt)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {appt.start_time.slice(0, 5)}
                        </span>
                        <span className="truncate font-medium">
                          {appt.client?.name ?? "—"}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {format(parseISO(appt.appointment_date), "d MMM yyyy", { locale: es })}
                        {" · "}
                        {appt.service?.name ?? "—"}
                        {" · "}
                        {appt.employee?.name ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: STATUS_COLORS[appt.status] ?? "#6b7280" }}
                      >
                        {STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                      {appt.amount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ${appt.amount.toLocaleString("es-AR")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            clients={clients}
            employees={employees}
            services={services}
            employeeServices={employeeServices}
            initialSlot={null}
            onCreated={async () => {
              setShowCreate(false);
              await loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail / edit dialog */}
      <AppointmentDetailDialog
        key={selectedAppointment?.id ?? "appt-detail"}
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdated={loadData}
      />
    </div>
  );
}
