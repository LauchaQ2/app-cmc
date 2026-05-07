import { getAuthenticatedClient } from "@/app/api/_auth";
import { employeeSchema } from "@/lib/schemas";
import { badRequest, created, ok, serverError } from "@/app/api/_shared";

export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true });

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
    const payload = employeeSchema.parse(body);

    const { data, error } = await supabase
      .from("employees")
      .insert(payload)
      .select("*")
      .single();

    if (error) return serverError(error.message);
    return created(data);
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
