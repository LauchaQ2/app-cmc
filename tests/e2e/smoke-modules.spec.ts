import { test, expect, type Page } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL ?? process.env.TEST_USER_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? process.env.TEST_USER_PASSWORD;

function nextBusinessDateISO() {
  const date = new Date();
  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

async function selectRadixOption(page: Page, triggerText: string, optionText?: string) {
  await page.locator("button").filter({ hasText: triggerText }).first().click();

  if (optionText) {
    const option = page.locator('[role="option"]').filter({ hasText: optionText }).first();
    await expect(option).toBeVisible();
    await option.click();
    return;
  }

  const firstOption = page.locator('[role="option"]').first();
  await expect(firstOption).toBeVisible();
  await firstOption.click();
}

async function login(page: Page) {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Definir E2E_EMAIL y E2E_PASSWORD para ejecutar E2E");

  await page.goto("/login");
  await expect(page.getByText("Ingreso CMC Turnos")).toBeVisible();

  await page.locator('input[type="email"]').fill(E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByRole("button", { name: "Turnos" })).toBeVisible({
    timeout: 60_000,
  });
}

test("Smoke de modulos por UI", async ({ page }) => {
  await login(page);

  const suffix = Date.now().toString().slice(-6);
  const clientName = `Cliente UI ${suffix}`;
  const serviceName = `Servicio UI ${suffix}`;
  const employeeName = `Empleada UI ${suffix}`;

  await expect(page.getByRole("button", { name: "Turnos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clientes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Servicios" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Empleadas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reportes" })).toBeVisible();

  await page.getByRole("button", { name: "Clientes" }).click();
  await page.locator('input[placeholder="Nombre"]').first().fill(clientName);
  await page.locator('input[placeholder="Telefono"]').first().fill("3410000000");
  await page.getByRole("button", { name: "Agregar cliente" }).click();
  await expect(page.getByText(clientName)).toBeVisible();

  await page.getByRole("button", { name: "Servicios" }).click();
  await page.locator('input[placeholder="Nombre"]').first().fill(serviceName);
  await page.locator('input[placeholder="Duracion"]').fill("45");
  await page.locator('input[placeholder="Precio"]').fill("8000");
  await page.getByRole("button", { name: "Agregar servicio" }).click();
  await expect(page.getByText(serviceName)).toBeVisible();

  await page.getByRole("button", { name: "Empleadas" }).click();
  await page.locator('input[placeholder="Nombre"]').first().fill(employeeName);
  await page.locator('input[placeholder="Telefono"]').first().fill("3411111111");
  await page.getByRole("button", { name: "Agregar empleada" }).click();
  await expect(page.getByText(employeeName)).toBeVisible();

  const employeeCard = page.locator("div.rounded-lg.border").filter({ hasText: employeeName }).first();
  await employeeCard.locator("label").filter({ hasText: serviceName }).first().click();

  await page.getByRole("button", { name: "Turnos" }).click();

  await selectRadixOption(page, "Seleccionar cliente", clientName);
  await selectRadixOption(page, "Seleccionar empleada", employeeName);
  await selectRadixOption(page, "Seleccionar servicio", serviceName);

  await page.locator('input[type="date"]').first().fill(nextBusinessDateISO());
  await selectRadixOption(page, "Elegir horario");

  await page.getByRole("button", { name: "Agendar turno" }).click();
  await expect(page.getByText("Turno creado correctamente")).toBeVisible();
});
