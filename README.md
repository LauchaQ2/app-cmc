# CMC Turnos

Sistema de gestion de turnos para un negocio de estetica, construido con Next.js App Router, TypeScript, Tailwind CSS, componentes estilo shadcn/ui, Supabase y PWA.

## 1) Instalacion inicial

```bash
npm install
npm install @supabase/supabase-js @supabase/ssr next-pwa react-big-calendar date-fns clsx tailwind-merge class-variance-authority lucide-react @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-label react-hook-form zod @hookform/resolvers sonner
```

## 2) Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 2.1) Usuario para ingresar

Podes crear usuario de dos formas:

1. Desde Supabase Authentication (email/password).
2. Desde la app en `/register`.

Pantallas de autenticacion disponibles:

- `/login`
- `/register`
- `/recuperar`
- `/actualizar-password`

## 3) Base de datos Supabase

1. Crear proyecto en Supabase.
2. Ir a SQL Editor.
3. Ejecutar el script completo en `supabase/schema.sql`.

Opcional: cargar servicios de ejemplo.

```sql
insert into services (name, duration_minutes, price, active) values
('Manicura', 45, 12000, true),
('Pedicura', 60, 15000, true),
('Esmaltado semi-permanente', 30, 9000, true),
('Depilacion facial', 15, 5000, true),
('Lifting de pestanas', 60, 18000, true),
('Combo manicura + pedicura', 90, 25000, true);
```

## 4) Ejecutar en desarrollo

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## 5) Build de produccion

```bash
npm run build
npm run start
```

## Modulos incluidos

- Turnos: alta, edicion de estado/pago, eliminacion, vistas de calendario.
- Clientes: alta y baja.
- Servicios: alta y baja con duracion multiplo de 15 min.
- Empleadas: alta y baja con horario laboral.
- Reportes: turnos mensuales, ingresos y servicios mas solicitados.

## Calendario

- Agenda (lista)
- Semanal (7 dias)
- Quincenal (15 dias)
- Mensual
- Filtro por empleada
- Colores por empleada

## PWA

- `next-pwa` configurado en `next.config.ts`
- `public/manifest.json`
- Iconos en `public/icons`
- Pantalla offline en `src/app/offline/page.tsx`
- Cola offline de turnos: si no hay internet al crear, editar o eliminar, la operacion se guarda local y se sincroniza al volver la conexion.

## API interna (App Router)

- `/api/clients`
- `/api/employees`
- `/api/services`
- `/api/appointments`
- `/api/availability`
- `/api/employee-services`

## Reglas de disponibilidad

- Turnos en bloques de 15 min.
- Duracion de servicios valida si es multiplo de 15.
- Se consideran horarios laborales por empleada.
- Solo se permiten servicios asignados a cada empleada.
- Se bloquean superposiciones en API y en base de datos.
