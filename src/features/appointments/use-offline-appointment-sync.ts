"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getPendingAppointmentsCount,
  syncPendingAppointments,
} from "@/features/appointments/offline-queue";

export function useOfflineAppointmentSync(onSynced?: () => Promise<void>) {
  const [pendingCount, setPendingCount] = useState(() =>
    getPendingAppointmentsCount(),
  );

  const refreshCount = useCallback(() => {
    setPendingCount(getPendingAppointmentsCount());
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      refreshCount();
      return;
    }

    const result = await syncPendingAppointments();
    refreshCount();

    if (result.synced > 0) {
      toast.success(`Se sincronizaron ${result.synced} operaciones pendientes`);
      if (onSynced) await onSynced();
    }
  }, [onSynced, refreshCount]);

  useEffect(() => {
    const onOnline = () => {
      void syncNow();
    };

    const onQueueUpdated = () => {
      refreshCount();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("cmc:queue-updated", onQueueUpdated);

    const interval = window.setInterval(() => {
      void syncNow();
    }, 60000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("cmc:queue-updated", onQueueUpdated);
      window.clearInterval(interval);
    };
  }, [refreshCount, syncNow]);

  return { pendingCount, syncNow };
}
