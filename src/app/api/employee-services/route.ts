import { getAuthenticatedClient } from "@/app/api/_auth";
import { badRequest, created, ok, serverError } from "@/app/api/_shared";

export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase
      .from("employee_services")
      .select("*")
      .order("employee_id", { ascending: true });

    if (error) return serverError(error.message);
    return ok(data ?? []);
  } catch (error) {
    return badRequest((error as Error).message);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = (await request.json()) as {
      employee_id?: string;
      service_id?: string;
    };

    if (!body.employee_id || !body.service_id) {
      return badRequest("employee_id y service_id son obligatorios");
    }

    const { data, error } = await supabase
      .from("employee_services")
      .insert({ employee_id: body.employee_id, service_id: body.service_id })
      .select("*")
      .single();

    if (error) return badRequest(error.message);
    return created(data);
  } catch (error) {
    return badRequest((error as Error).message);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = (await request.json()) as {
      employee_id?: string;
      service_id?: string;
    };

    if (!body.employee_id || !body.service_id) {
      return badRequest("employee_id y service_id son obligatorios");
    }

    const { error } = await supabase
      .from("employee_services")
      .delete()
      .eq("employee_id", body.employee_id)
      .eq("service_id", body.service_id);

    if (error) return badRequest(error.message);
    return ok({ success: true });
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
