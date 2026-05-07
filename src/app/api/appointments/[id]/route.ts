import { getAuthenticatedClient } from "@/app/api/_auth";
import { appointmentSchema } from "@/lib/schemas";
import { calculateEndTime, isValidDuration } from "@/lib/time";
import { badRequest, ok, serverError } from "@/app/api/_shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { id } = await params;
    const body = await request.json();
    const payload = appointmentSchema.partial().parse(body);
    const updatePayload: Record<string, unknown> = { ...payload };

    if (payload.employee_id || payload.service_id) {
      const { data: existingForValidation, error: existingForValidationError } =
        await supabase
          .from("appointments")
          .select("employee_id, service_id")
          .eq("id", id)
          .single();

      if (existingForValidationError) {
        return badRequest(existingForValidationError.message);
      }

      const employeeId = payload.employee_id ?? existingForValidation.employee_id;
      const serviceId = payload.service_id ?? existingForValidation.service_id;

      const { data: employeeService, error: employeeServiceError } = await supabase
        .from("employee_services")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("service_id", serviceId)
        .maybeSingle();

      if (employeeServiceError) return badRequest(employeeServiceError.message);
      if (!employeeService) {
        return badRequest("La empleada seleccionada no realiza este servicio");
      }
    }

    if (payload.service_id || payload.start_time) {
      const { data: existing, error: existingError } = await supabase
        .from("appointments")
        .select("service_id, start_time")
        .eq("id", id)
        .single();

      if (existingError) return badRequest(existingError.message);

      const serviceId = payload.service_id ?? existing.service_id;
      const startTime = payload.start_time ?? existing.start_time;

      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .single();

      if (serviceError) return badRequest(serviceError.message);
      if (!isValidDuration(service.duration_minutes)) {
        return badRequest("La duracion del servicio debe ser multiplo de 15 minutos");
      }

      updatePayload.end_time = calculateEndTime(startTime, service.duration_minutes);
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id)
      .select("*, client:clients(*), employee:employees(*), service:services(*)")
      .single();

    if (error) return badRequest(error.message);
    return ok(data);
  } catch (error) {
    return badRequest((error as Error).message);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { id } = await params;
    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) return serverError(error.message);
    return ok({ success: true });
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
