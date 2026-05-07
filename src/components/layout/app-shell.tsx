"use client";

import { CalendarDays, CalendarRange, Home, Scissors, UserCheck, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/turnos", label: "Turnos", icon: CalendarRange },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicios", label: "Servicios", icon: Scissors },
  { href: "/empleadas", label: "Empleadas", icon: UserCheck },
];

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/recuperar") ||
    pathname?.startsWith("/actualizar-password")
  ) {
    return <>{children}</>;
  }

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="page-gradient min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col p-3 sm:p-5 lg:flex-row lg:gap-4">
        <aside className="mb-3 rounded-xl border border-border bg-card p-2 lg:mb-0 lg:w-56 lg:p-4">
          <div className="mb-4 flex items-center justify-between gap-2 px-2 py-2">
            <h1 className="text-lg font-semibold">CMC Turnos</h1>
            <Button variant="outline" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
          <nav className="grid grid-cols-3 gap-1 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                    isActive
                      ? "bg-accent font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
