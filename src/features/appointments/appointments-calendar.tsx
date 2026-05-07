"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type SlotInfo,
  Views,
} from "react-big-calendar";
import {
  addDays,
  format,
  getDay,
  parse,
  startOfWeek,
  type Locale,
} from "date-fns";
import { es } from "date-fns/locale/es";
import type { Appointment } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CalendarView = "agenda" | "week" | "fortnight" | "month";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  employeeId: string;
  color: string;
  appointment: Appointment;
};

type AppointmentsCalendarProps = {
  appointments: Appointment[];
  employeeColors: Record<string, string>;
  onSelectSlot: (slot: { date: string; startTime: string }) => void;
  onSelectEvent: (appointment: Appointment) => void;
};

const locales: Record<string, Locale> = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  today: "Hoy",
  previous: "Anterior",
  next: "Siguiente",
  month: "Mes",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Turno",
  noEventsInRange: "Sin turnos en este rango",
};

const calendarFormats = {
  weekdayFormat: "eee",
  dayFormat: "eee d/M",
  dayHeaderFormat: "eeee d 'de' MMMM",
};

const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 8, 0, 0);

export function AppointmentsCalendar({
  appointments,
  employeeColors,
  onSelectEvent,
  onSelectSlot,
}: AppointmentsCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [date, setDate] = useState(new Date());

  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.client?.name ?? "Cliente"} - ${appointment.service?.name ?? "Servicio"}`,
        start: new Date(`${appointment.appointment_date}T${appointment.start_time}`),
        end: new Date(`${appointment.appointment_date}T${appointment.end_time}`),
        employeeId: appointment.employee_id,
        color: employeeColors[appointment.employee_id] ?? "#4e7b68",
        appointment,
      })),
    [appointments, employeeColors],
  );

  const fortnightDays = useMemo(() => {
    return Array.from({ length: 15 }, (_, index) => addDays(date, index));
  }, [date]);

  const rangeLabel = useMemo(() => {
    if (view === "month") return format(date, "MMMM yyyy", { locale: es });
    if (view === "week") return `Semana de ${format(startOfWeek(date, { weekStartsOn: 1 }), "d MMM", { locale: es })}`;
    if (view === "agenda") return `Agenda desde ${format(date, "d MMM yyyy", { locale: es })}`;
    return `Quincena desde ${format(date, "d MMM yyyy", { locale: es })}`;
  }, [date, view]);

  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setDate(new Date());
      return;
    }

    if (view === "month") {
      setDate((current) => addDays(current, direction === "next" ? 30 : -30));
      return;
    }

    if (view === "week") {
      setDate((current) => addDays(current, direction === "next" ? 7 : -7));
      return;
    }

    if (view === "fortnight") {
      setDate((current) => addDays(current, direction === "next" ? 15 : -15));
      return;
    }

    setDate((current) => addDays(current, direction === "next" ? 1 : -1));
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle>Calendario de turnos</CardTitle>
          <p className="text-sm capitalize text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("today")}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("prev")}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("next")}>Siguiente</Button>
          <Button variant={view === "agenda" ? "default" : "outline"} size="sm" onClick={() => setView("agenda")}>Agenda</Button>
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Semanal</Button>
          <Button variant={view === "fortnight" ? "default" : "outline"} size="sm" onClick={() => setView("fortnight")}>Quincenal</Button>
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>Mensual</Button>
        </div>
      </CardHeader>
      <CardContent>
        {view !== "fortnight" ? (
          <div className="h-[70vh] min-h-[500px]">
            <Calendar
              localizer={localizer}
              culture="es"
              formats={calendarFormats}
              date={date}
              onNavigate={setDate}
              events={events}
              view={view === "week" ? Views.WEEK : view === "month" ? Views.MONTH : Views.AGENDA}
              views={[Views.AGENDA, Views.WEEK, Views.MONTH]}
              startAccessor="start"
              endAccessor="end"
              messages={messages}
              toolbar={false}
              popup
              selectable
              min={CALENDAR_MIN_TIME}
              step={15}
              timeslots={1}
              defaultDate={new Date()}
              onSelectEvent={(event) => onSelectEvent(event.appointment)}
              onSelectSlot={(slot: SlotInfo) => {
                const start = slot.start;
                onSelectSlot({
                  date: format(start, "yyyy-MM-dd"),
                  startTime: format(start, "HH:mm"),
                });
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color,
                },
              })}
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {fortnightDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointments.filter(
                (appointment) => appointment.appointment_date === dayKey,
              );
              return (
                <div key={dayKey} className="rounded-lg border border-border bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium capitalize">{format(day, "EEEE d 'de' MMMM", { locale: es })}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onSelectSlot({ date: dayKey, startTime: "09:00" })
                      }
                    >
                      Nuevo
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {dayAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin turnos</p>
                    ) : (
                      dayAppointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          className="w-full rounded-md p-2 text-left text-sm"
                          style={{
                            backgroundColor:
                              employeeColors[appointment.employee_id] ?? "#d9e9e2",
                          }}
                          onClick={() => onSelectEvent(appointment)}
                        >
                          {appointment.start_time} {appointment.client?.name} - {appointment.service?.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
