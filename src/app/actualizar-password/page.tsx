"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function UpdatePasswordContent() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (tokenHash && type === "recovery") {
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) {
            toast.error(error.message);
            return;
          }
        }

        setVerified(true);
      } catch (error) {
        toast.error((error as Error).message);
      }
    };

    void verifyToken();
  }, [searchParams]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Contrasena actualizada");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-gradient flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Actualizar contrasena</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label>Nueva contrasena</Label>
              <Input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !verified}>
              {loading ? "Guardando..." : "Guardar nueva contrasena"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline-offset-2 hover:underline">
                Ir al ingreso
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="page-gradient flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Actualizar contrasena</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
