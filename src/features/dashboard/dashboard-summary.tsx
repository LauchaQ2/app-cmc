"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, Clock, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Appointment, Employee } from "@/types/domain";
import { apiGet } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const employeePalette = ["#4e7b68", "#d87543", "#1a759f", "#8f5db7", "#9c6644", "#a62934"];

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#f59e0b",
  confirmado: "#22c55e",
  completado: "#3b82f6",
  cancelado: "#6b7280",
};

export function DashboardSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const [employeesRes, appointmentsRes] = await Promise.all([
        apiGet<Employee[]>("/api/employees"),
        apiGet<Appointment[]>(`/api/appointments?from=${today}`),
      ]);
      setEmployees(employeesRes);
      setAppointments(appointmentsRes);
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

  const todayAppointments = useMemo(
    () => appointments.filter((a) => isToday(parseISO(a.appointment_date))),
    [appointments],
  );

  const employeeCards = useMemo(() => {
    const now = new Date();
    const nowTime = format(now, "HH:mm");
    const todayStr = format(now, "yyyy-MM-dd");

    return employees.map((emp, idx) => {
      const upcoming = appointments
        .filter(
          (a) =>
            a.employee_id === emp.id &&
            (a.appointment_date > todayStr ||
              (a.appointment_date === todayStr && a.start_time >= nowTime)) &&
            a.status !== "cancelado",
        )
        .sort((a, b) =>
          `${a.appointment_date} ${a.start_time}`.localeCompare(
            `${b.appointment_date} ${b.start_time}`,
          ),
        );

      return {
        employee: emp,
        color: employeePalette[idx % employeePalette.length],
        next: upcoming[0] ?? null,
        todayCount: appointments.filter(
          (a) => a.employee_id === emp.id && a.appointment_date === todayStr,
        ).length,
      };
    });
  }, [employees, appointments]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-accent" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-accent" />
          ))}
        </div>
      </div>
    );
  }

  const pendingToday = todayAppointments.filter((a) => a.status === "pendiente").length;
  const confirmedToday = todayAppointments.filter((a) => a.status === "confirmado").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-xs text-muted-foreground">Turnos hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{pendingToday}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{confirmedToday}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{employees.filter((e) => e.active).length}</p>
                <p className="text-xs text-muted-foreground">Empleadas activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee next appointment cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium">Próximos turnos por empleada</h3>
          <Button variant="outline" size="sm" onClick={() => router.push("/turnos")}>
            Ver todos
          </Button>
        </div>
        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay empleadas registradas.{" "}
                <button
                  className="underline hover:no-underline"
                  onClick={() => router.push("/empleadas")}
                >
                  Agregar empleada
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {employeeCards.map(({ employee, color, next, todayCount }) => (
              <Card key={employee.id} className="overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: color }} />
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span style={{ color }}>{employee.name}</span>
                    <Badge variant="secondary">{todayCount} hoy</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {next ? (
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {next.appointment_date === format(new Date(), "yyyy-MM-dd")
                          ? "Hoy"
                          : format(parseISO(next.appointment_date), "EEEE d MMM", {
                              locale: es,
                            })}
                        {" · "}
                        {next.start_time.slice(0, 5)}
                      </p>
                      <p className="text-muted-foreground">
                        {next.client?.name ?? "—"} — {next.service?.name ?? "—"}
                      </p>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: STATUS_COLORS[next.status] ?? "#6b7280" }}
                      >
                        {STATUS_LABELS[next.status] ?? next.status}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin turnos próximos</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Today's schedule */}
      {todayAppointments.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-medium">Agenda de hoy</h3>
          <div className="space-y-2">
            {todayAppointments
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-mono text-sm font-medium">
                      {appt.start_time.slice(0, 5)}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{appt.client?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {appt.service?.name ?? "—"} · {appt.employee?.name ?? "—"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: STATUS_COLORS[appt.status] ?? "#6b7280" }}
                  >
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
