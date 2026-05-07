import { getAuthenticatedClient } from "@/app/api/_auth";
import { calculateAvailableSlots } from "@/lib/time";
import { badRequest, ok, serverError } from "@/app/api/_shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const duration = Number(searchParams.get("duration") ?? "0");

    if (!date || !employeeId || !duration) {
      return badRequest("Faltan parametros date, employeeId o duration");
    }

    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (employeeError) return badRequest(employeeError.message);

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("appointment_date", date)
      .order("start_time", { ascending: true });

    if (appointmentsError) return serverError(appointmentsError.message);

    const slots = calculateAvailableSlots({
      date,
      durationMinutes: duration,
      employee,
      appointments: appointments ?? [],
    });

    return ok({ slots });
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
