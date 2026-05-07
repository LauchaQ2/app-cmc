export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-3xl font-semibold">Sin conexion</h1>
      <p className="text-muted-foreground">
        La aplicacion esta en modo offline. Cuando vuelva internet podras sincronizar
        turnos y cambios.
      </p>
    </main>
  );
}
