"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Client, Employee, EmployeeService, Service } from "@/types/domain";
import { apiMutation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModuleProps = {
  clients: Client[];
  employees: Employee[];
  services: Service[];
  employeeServices: EmployeeService[];
  onUpdated: () => Promise<void>;
};

export function ClientsModule({ clients, onUpdated }: Pick<ModuleProps, "clients" | "onUpdated">) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const create = async () => {
    try {
      await apiMutation("/api/clients", "POST", { name, phone });
      setName("");
      setPhone("");
      await onUpdated();
      toast.success("Cliente creado");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button onClick={create}>Agregar cliente</Button>
        </div>

        <div className="space-y-2">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between rounded-lg border border-border p-2">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await apiMutation(`/api/clients/${client.id}`, "DELETE");
                  await onUpdated();
                  toast.success("Cliente eliminado");
                }}
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ServicesModule({ services, onUpdated }: Pick<ModuleProps, "services" | "onUpdated">) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("0");

  const create = async () => {
    try {
      await apiMutation("/api/services", "POST", {
        name,
        duration_minutes: Number(duration),
        price: Number(price),
        active: true,
      });
      setName("");
      setDuration("30");
      setPrice("0");
      await onUpdated();
      toast.success("Servicio creado");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Duracion"
            type="number"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <Input
            placeholder="Precio"
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Button onClick={create}>Agregar servicio</Button>
        </div>

        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between rounded-lg border border-border p-2">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.duration_minutes} min - ${service.price}
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await apiMutation(`/api/services/${service.id}`, "DELETE");
                  await onUpdated();
                  toast.success("Servicio eliminado");
                }}
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeesModule({
  employees,
  services,
  employeeServices,
  onUpdated,
}: Pick<ModuleProps, "employees" | "services" | "employeeServices" | "onUpdated">) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  const create = async () => {
    try {
      await apiMutation("/api/employees", "POST", {
        name,
        phone,
        active: true,
        work_start_time: start,
        work_end_time: end,
        work_days: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
      });
      setName("");
      setPhone("");
      setStart("09:00");
      setEnd("18:00");
      await onUpdated();
      toast.success("Empleada creada");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empleadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div>
            <Label>Inicio</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>Fin</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button onClick={create}>Agregar empleada</Button>
        </div>

        <div className="space-y-2">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {employee.work_start_time.slice(0, 5)} - {employee.work_end_time.slice(0, 5)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await apiMutation(`/api/employees/${employee.id}`, "DELETE");
                    await onUpdated();
                    toast.success("Empleada eliminada");
                  }}
                >
                  Eliminar
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {services.map((service) => {
                  const checked = employeeServices.some(
                    (item) =>
                      item.employee_id === employee.id && item.service_id === service.id,
                  );

                  return (
                    <label key={service.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onChange={async (event) => {
                          try {
                            if (event.target.checked) {
                              await apiMutation("/api/employee-services", "POST", {
                                employee_id: employee.id,
                                service_id: service.id,
                              });
                            } else {
                              await apiMutation("/api/employee-services", "DELETE", {
                                employee_id: employee.id,
                                service_id: service.id,
                              });
                            }

                            await onUpdated();
                          } catch (error) {
                            toast.error((error as Error).message);
                          }
                        }}
                      />
                      <span>{service.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
