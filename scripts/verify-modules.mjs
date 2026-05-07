import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan variables de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const testSuffix = Date.now();
const email = process.env.TEST_USER_EMAIL || `cmc-test-${testSuffix}@example.com`;
const password = process.env.TEST_USER_PASSWORD || `Test12345!${testSuffix}`;

function log(title, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${title}${detail ? ` | ${detail}` : ""}`);
}

async function main() {
  const created = {
    clientId: null,
    employeeId: null,
    serviceId: null,
    appointmentId: null,
  };

  try {
    let session = null;

    if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error || !signIn.data.session) {
        log(
          "Inicio de sesión usuario prueba",
          false,
          signIn.error?.message || "No se obtuvo sesión",
        );
        return;
      }
      session = signIn.data.session;
    } else {
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) {
        log("Registro usuario prueba", false, signUp.error.message);
        return;
      }

      session = signUp.data.session;
      if (!session) {
        const signIn = await supabase.auth.signInWithPassword({ email, password });
        if (signIn.error || !signIn.data.session) {
          log(
            "Inicio de sesión usuario prueba",
            false,
            signIn.error?.message || "No se obtuvo sesión (confirmación de email activa)",
          );
          console.log("No se puede validar CRUD autenticado sin sesión activa.");
          return;
        }
        session = signIn.data.session;
      }
    }

    log("Autenticación", true, `user=${session.user.id}`);

    const clientRes = await supabase
      .from("clients")
      .insert({ name: "Cliente Test", phone: "111111" })
      .select("id,name")
      .single();

    if (clientRes.error) {
      log("Alta cliente", false, clientRes.error.message);
      return;
    }
    created.clientId = clientRes.data.id;
    log("Alta cliente", true, `id=${created.clientId}`);

    const employeeRes = await supabase
      .from("employees")
      .insert({
        name: "Empleada Test",
        phone: "222222",
        active: true,
        work_start_time: "09:00",
        work_end_time: "18:00",
        work_days: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
      })
      .select("id,name")
      .single();

    if (employeeRes.error) {
      log("Alta empleada", false, employeeRes.error.message);
      return;
    }
    created.employeeId = employeeRes.data.id;
    log("Alta empleada", true, `id=${created.employeeId}`);

    const serviceRes = await supabase
      .from("services")
      .insert({
        name: "Servicio Test",
        duration_minutes: 45,
        price: 1000,
        active: true,
      })
      .select("id,name,duration_minutes")
      .single();

    if (serviceRes.error) {
      log("Alta servicio", false, serviceRes.error.message);
      return;
    }
    created.serviceId = serviceRes.data.id;
    log("Alta servicio", true, `id=${created.serviceId}`);

    const relationRes = await supabase
      .from("employee_services")
      .insert({ employee_id: created.employeeId, service_id: created.serviceId });

    if (relationRes.error) {
      log("Asignar servicio a empleada", false, relationRes.error.message);
      return;
    }
    log("Asignar servicio a empleada", true);

    const apptDate = "2026-05-15";
    const appointmentRes = await supabase
      .from("appointments")
      .insert({
        client_id: created.clientId,
        employee_id: created.employeeId,
        service_id: created.serviceId,
        appointment_date: apptDate,
        start_time: "10:00",
        status: "pendiente",
        payment_status: "pendiente",
        amount: 1000,
      })
      .select("id,start_time,end_time,status,payment_status")
      .single();

    if (appointmentRes.error) {
      log("Alta turno", false, appointmentRes.error.message);
      return;
    }
    created.appointmentId = appointmentRes.data.id;
    log("Alta turno", true, `id=${created.appointmentId}, end=${appointmentRes.data.end_time}`);

    const overlapRes = await supabase.from("appointments").insert({
      client_id: created.clientId,
      employee_id: created.employeeId,
      service_id: created.serviceId,
      appointment_date: apptDate,
      start_time: "10:15",
      status: "pendiente",
      payment_status: "pendiente",
      amount: 1000,
    });

    log(
      "Bloqueo superposición turnos",
      Boolean(overlapRes.error),
      overlapRes.error ? overlapRes.error.message : "No bloqueó superposición",
    );

    const updateRes = await supabase
      .from("appointments")
      .update({ status: "confirmado", payment_status: "pagado" })
      .eq("id", created.appointmentId)
      .select("status,payment_status")
      .single();

    if (updateRes.error) {
      log("Editar turno", false, updateRes.error.message);
      return;
    }
    log(
      "Editar turno",
      updateRes.data.status === "confirmado" && updateRes.data.payment_status === "pagado",
      `${updateRes.data.status}/${updateRes.data.payment_status}`,
    );

    const deleteRes = await supabase.from("appointments").delete().eq("id", created.appointmentId);
    if (deleteRes.error) {
      log("Eliminar turno", false, deleteRes.error.message);
      return;
    }
    created.appointmentId = null;
    log("Eliminar turno", true);

    log("Validación módulos CRUD", true, "clientes, empleadas, servicios, turnos");
  } finally {
    if (created.appointmentId) {
      await supabase.from("appointments").delete().eq("id", created.appointmentId);
    }
    if (created.serviceId && created.employeeId) {
      await supabase
        .from("employee_services")
        .delete()
        .eq("employee_id", created.employeeId)
        .eq("service_id", created.serviceId);
    }
    if (created.serviceId) {
      await supabase.from("services").delete().eq("id", created.serviceId);
    }
    if (created.employeeId) {
      await supabase.from("employees").delete().eq("id", created.employeeId);
    }
    if (created.clientId) {
      await supabase.from("clients").delete().eq("id", created.clientId);
    }
    await supabase.auth.signOut();
  }
}

main().catch((error) => {
  console.error("Error inesperado:", error);
  process.exit(1);
});
