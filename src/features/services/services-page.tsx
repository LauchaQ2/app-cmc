"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Service } from "@/types/domain";
import { apiGet, apiMutation } from "@/lib/api";
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
import { Label } from "@/components/ui/label";

type ServiceFormState = {
  name: string;
  duration_minutes: string;
  price: string;
  description: string;
  active: boolean;
};

const EMPTY_FORM: ServiceFormState = {
  name: "",
  duration_minutes: "30",
  price: "0",
  description: "",
  active: true,
};

function parsePriceInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editService, setEditService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState<ServiceFormState>(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Service[]>("/api/services");
      setServices(data);
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

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const duration = Number(createForm.duration_minutes);
    if (!duration || duration % 15 !== 0) {
      toast.error("La duración debe ser múltiplo de 15");
      return;
    }
    const price = parsePriceInput(createForm.price);
    if (price === null) {
      toast.error("Ingresá un precio válido");
      return;
    }
    try {
      setSaving(true);
      await apiMutation("/api/services", "POST", {
        name: createForm.name.trim(),
        duration_minutes: duration,
        price,
        description: createForm.description.trim() || undefined,
        active: createForm.active,
      });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await load();
      toast.success("Servicio creado");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (service: Service) => {
    setEditService(service);
    setEditForm({
      name: service.name,
      duration_minutes: String(service.duration_minutes),
      price: String(service.price),
      description: service.description ?? "",
      active: service.active,
    });
  };

  const handleEdit = async () => {
    if (!editService || !editForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const duration = Number(editForm.duration_minutes);
    if (!duration || duration % 15 !== 0) {
      toast.error("La duración debe ser múltiplo de 15");
      return;
    }
    const price = parsePriceInput(editForm.price);
    if (price === null) {
      toast.error("Ingresá un precio válido");
      return;
    }
    try {
      setSaving(true);
      await apiMutation(`/api/services/${editService.id}`, "PATCH", {
        name: editForm.name.trim(),
        duration_minutes: duration,
        price,
        description: editForm.description.trim() || undefined,
        active: editForm.active,
      });
      setEditService(null);
      await load();
      toast.success("Servicio actualizado");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiMutation(`/api/services/${deleteId}`, "DELETE");
      setDeleteId(null);
      await load();
      toast.success("Servicio eliminado");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const renderServiceForm = (
    form: ServiceFormState,
    onChange: (f: ServiceFormState) => void,
  ) => (
    <div className="space-y-3">
      <div>
        <Label>Nombre *</Label>
        <Input
          placeholder="Ej: Depilación facial"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Duración (minutos) *</Label>
          <Input
            type="number"
            min={15}
            step={15}
            placeholder="30"
            value={form.duration_minutes}
            onChange={(e) => onChange({ ...form, duration_minutes: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">Múltiplos de 15</p>
        </div>
        <div>
          <Label>Precio ($)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Descripción</Label>
        <Input
          placeholder="Descripción opcional"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => onChange({ ...form, active: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        Servicio activo
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Servicios</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {loading
              ? "Cargando..."
              : `${filtered.length} servicio${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-accent" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {search ? "Sin resultados para esa búsqueda." : "No hay servicios registrados."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.name}</p>
                      {!service.active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.duration_minutes} min · ${service.price.toLocaleString("es-AR")}
                    </p>
                    {service.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground italic">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(service)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteId(service.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          {renderServiceForm(createForm, setCreateForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Guardando..." : "Crear servicio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editService} onOpenChange={(open) => !open && setEditService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
          </DialogHeader>
          {renderServiceForm(editForm, setEditForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditService(null)}>
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
            ¿Estás segura de que querés eliminar este servicio? Esta acción no se puede deshacer.
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
