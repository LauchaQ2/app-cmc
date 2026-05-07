import { getAuthenticatedClient } from "@/app/api/_auth";
import { appointmentSchema } from "@/lib/schemas";
import { calculateEndTime, isValidDuration } from "@/lib/time";
import { badRequest, created, ok, serverError } from "@/app/api/_shared";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    let query = supabase
      .from("appointments")
      .select("*, client:clients(*), employee:employees(*), service:services(*)")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (dateFrom) query = query.gte("appointment_date", dateFrom);
    if (dateTo) query = query.lte("appointment_date", dateTo);

    const { data, error } = await query;
    if (error) return serverError(error.message);

    return ok(data ?? []);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const payload = appointmentSchema.parse(body);

    const { data: employeeService, error: employeeServiceError } = await supabase
      .from("employee_services")
      .select("id")
      .eq("employee_id", payload.employee_id)
      .eq("service_id", payload.service_id)
      .maybeSingle();

    if (employeeServiceError) return badRequest(employeeServiceError.message);
    if (!employeeService) {
      return badRequest("La empleada seleccionada no realiza este servicio");
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", payload.service_id)
      .single();

    if (serviceError) return badRequest(serviceError.message);

    if (!isValidDuration(service.duration_minutes)) {
      return badRequest("La duracion del servicio debe ser multiplo de 15 minutos");
    }

    const endTime = calculateEndTime(payload.start_time, service.duration_minutes);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        ...payload,
        end_time: endTime,
      })
      .select("*, client:clients(*), employee:employees(*), service:services(*)")
      .single();

    if (error) return badRequest(error.message);
    return created(data);
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
