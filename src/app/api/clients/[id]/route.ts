import { getAuthenticatedClient } from "@/app/api/_auth";
import { clientSchema } from "@/lib/schemas";
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
    const payload = clientSchema.partial().parse(body);

    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return serverError(error.message);
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
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) return serverError(error.message);
    return ok({ success: true });
  } catch (error) {
    return badRequest((error as Error).message);
  }
}
