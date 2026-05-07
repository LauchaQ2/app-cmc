"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Employee, EmployeeService, Service } from "@/types/domain";
import { apiGet, apiMutation } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL_DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DAY_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

type EmployeeFormState = {
  name: string;
  phone: string;
  work_start_time: string;
  work_end_time: string;
  work_days: string[];
  active: boolean;
};

const EMPTY_FORM: EmployeeFormState = {
  name: "",
  phone: "",
  work_start_time: "09:00",
  work_end_time: "18:00",
  work_days: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
  active: true,
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeFormState>(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, svcs, empSvcs] = await Promise.all([
        apiGet<Employee[]>("/api/employees"),
        apiGet<Service[]>("/api/services"),
        apiGet<EmployeeService[]>("/api/employee-services"),
      ]);
      setEmployees(emps);
      setServices(svcs);
      setEmployeeServices(empSvcs);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!createForm.phone.trim() || createForm.phone.trim().length < 6) {
      toast.error("El telefono debe tener al menos 6 caracteres");
      return;
    }
    if (createForm.work_end_time <= createForm.work_start_time) {
      toast.error("La hora de fin debe ser mayor a la hora de inicio");
      return;
    }
    try {
      setSaving(true);
      await apiMutation("/api/employees", "POST", {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        work_start_time: createForm.work_start_time,
        work_end_time: createForm.work_end_time,
        work_days: createForm.work_days,
        active: createForm.active,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await load();
      toast.success("Empleada creada");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (employee: Employee) => {
    setEditEmployee(employee);
    setEditForm({
      name: employee.name,
      phone: employee.phone ?? "",
      work_start_time: employee.work_start_time.slice(0, 5),
      work_end_time: employee.work_end_time.slice(0, 5),
      work_days: employee.work_days ?? [],
      active: employee.active,
    });
  };

  const handleEdit = async () => {
    if (!editEmployee || !editForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!editForm.phone.trim() || editForm.phone.trim().length < 6) {
      toast.error("El telefono debe tener al menos 6 caracteres");
      return;
    }
    if (editForm.work_end_time <= editForm.work_start_time) {
      toast.error("La hora de fin debe ser mayor a la hora de inicio");
      return;
    }
    try {
      setSaving(true);
      await apiMutation(`/api/employees/${editEmployee.id}`, "PATCH", {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        work_start_time: editForm.work_start_time,
        work_end_time: editForm.work_end_time,
        work_days: editForm.work_days,
        active: editForm.active,
      });
      setEditEmployee(null);
      await load();
      toast.success("Empleada actualizada");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiMutation(`/api/employees/${deleteId}`, "DELETE");
      setDeleteId(null);
      await load();
      toast.success("Empleada eliminada");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleService = async (employeeId: string, serviceId: string, checked: boolean) => {
    try {
      if (checked) {
        await apiMutation("/api/employee-services", "POST", {
          employee_id: employeeId,
          service_id: serviceId,
        });
      } else {
        await apiMutation("/api/employee-services", "DELETE", {
          employee_id: employeeId,
          service_id: serviceId,
        });
      }
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleDay = (form: EmployeeFormState, day: string): EmployeeFormState => {
    const days = form.work_days.includes(day)
      ? form.work_days.filter((d) => d !== day)
      : [...form.work_days, day];
    return { ...form, work_days: days };
  };

  const renderEmployeeForm = (
    form: EmployeeFormState,
    onChange: (f: EmployeeFormState) => void,
  ) => (
    <div className="space-y-3">
      <div>
        <Label>Nombre *</Label>
        <Input
          placeholder="Nombre completo"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Teléfono</Label>
        <Input
          placeholder="Ej: 351-123-4567"
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Hora inicio</Label>
          <Input
            type="time"
            value={form.work_start_time}
            onChange={(e) => onChange({ ...form, work_start_time: e.target.value })}
          />
        </div>
        <div>
          <Label>Hora fin</Label>
          <Input
            type="time"
            value={form.work_end_time}
            onChange={(e) => onChange({ ...form, work_end_time: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Días laborables</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onChange(toggleDay(form, day))}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                form.work_days.includes(day)
                  ? "bg-accent text-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => onChange({ ...form, active: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        Empleada activa
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Empleadas</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva empleada
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar empleada..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {loading
              ? "Cargando..."
              : `${filtered.length} empleada${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-accent" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {search ? "Sin resultados." : "No hay empleadas registradas."}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((employee) => {
                const assignedServiceIds = employeeServices
                  .filter((es) => es.employee_id === employee.id)
                  .map((es) => es.service_id);

                return (
                  <div
                    key={employee.id}
                    className="rounded-lg border border-border p-3 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{employee.name}</p>
                          {!employee.active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactiva
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {employee.work_start_time.slice(0, 5)} –{" "}
                          {employee.work_end_time.slice(0, 5)}
                          {employee.phone && ` · ${employee.phone}`}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(employee.work_days ?? []).map((d) => (
                            <span
                              key={d}
                              className="rounded bg-accent px-1.5 py-0.5 text-xs"
                            >
                              {DAY_LABELS[d] ?? d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(employee)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(employee.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Service assignment */}
                    {services.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Servicios habilitados
                        </p>
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                          {services.map((service) => {
                            const checked = assignedServiceIds.includes(service.id);
                            return (
                              <label
                                key={service.id}
                                className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-accent/50"
                              >
                                <Checkbox
                                  checked={checked}
                                  onChange={(e) =>
                                    toggleService(employee.id, service.id, e.target.checked)
                                  }
                                />
                                <span>{service.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empleada</DialogTitle>
          </DialogHeader>
          {renderEmployeeForm(createForm, setCreateForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Guardando..." : "Crear empleada"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editEmployee} onOpenChange={(open) => !open && setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empleada</DialogTitle>
          </DialogHeader>
          {renderEmployeeForm(editForm, setEditForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditEmployee(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás segura de que querés eliminar esta empleada? Se perderán sus turnos asociados.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
