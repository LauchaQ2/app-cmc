# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-modules.spec.ts >> Smoke de modulos por UI
- Location: tests\e2e\smoke-modules.spec.ts:44:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Turnos' })
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for getByRole('button', { name: 'Turnos' })

```

# Test source

```ts
  1  | import { test, expect, type Page } from "@playwright/test";
  2  | 
  3  | const E2E_EMAIL = process.env.E2E_EMAIL ?? process.env.TEST_USER_EMAIL;
  4  | const E2E_PASSWORD = process.env.E2E_PASSWORD ?? process.env.TEST_USER_PASSWORD;
  5  | 
  6  | function nextBusinessDateISO() {
  7  |   const date = new Date();
  8  |   while (date.getDay() === 0) {
  9  |     date.setDate(date.getDate() + 1);
  10 |   }
  11 |   return date.toISOString().slice(0, 10);
  12 | }
  13 | 
  14 | async function selectRadixOption(page: Page, triggerText: string, optionText?: string) {
  15 |   await page.locator("button").filter({ hasText: triggerText }).first().click();
  16 | 
  17 |   if (optionText) {
  18 |     const option = page.locator('[role="option"]').filter({ hasText: optionText }).first();
  19 |     await expect(option).toBeVisible();
  20 |     await option.click();
  21 |     return;
  22 |   }
  23 | 
  24 |   const firstOption = page.locator('[role="option"]').first();
  25 |   await expect(firstOption).toBeVisible();
  26 |   await firstOption.click();
  27 | }
  28 | 
  29 | async function login(page: Page) {
  30 |   test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Definir E2E_EMAIL y E2E_PASSWORD para ejecutar E2E");
  31 | 
  32 |   await page.goto("/login");
  33 |   await expect(page.getByText("Ingreso CMC Turnos")).toBeVisible();
  34 | 
  35 |   await page.locator('input[type="email"]').fill(E2E_EMAIL!);
  36 |   await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
  37 |   await page.getByRole("button", { name: "Ingresar" }).click();
  38 | 
> 39 |   await expect(page.getByRole("button", { name: "Turnos" })).toBeVisible({
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  40 |     timeout: 60_000,
  41 |   });
  42 | }
  43 | 
  44 | test("Smoke de modulos por UI", async ({ page }) => {
  45 |   await login(page);
  46 | 
  47 |   const suffix = Date.now().toString().slice(-6);
  48 |   const clientName = `Cliente UI ${suffix}`;
  49 |   const serviceName = `Servicio UI ${suffix}`;
  50 |   const employeeName = `Empleada UI ${suffix}`;
  51 | 
  52 |   await expect(page.getByRole("button", { name: "Turnos" })).toBeVisible();
  53 |   await expect(page.getByRole("button", { name: "Clientes" })).toBeVisible();
  54 |   await expect(page.getByRole("button", { name: "Servicios" })).toBeVisible();
  55 |   await expect(page.getByRole("button", { name: "Empleadas" })).toBeVisible();
  56 |   await expect(page.getByRole("button", { name: "Reportes" })).toBeVisible();
  57 | 
  58 |   await page.getByRole("button", { name: "Clientes" }).click();
  59 |   await page.locator('input[placeholder="Nombre"]').first().fill(clientName);
  60 |   await page.locator('input[placeholder="Telefono"]').first().fill("3410000000");
  61 |   await page.getByRole("button", { name: "Agregar cliente" }).click();
  62 |   await expect(page.getByText(clientName)).toBeVisible();
  63 | 
  64 |   await page.getByRole("button", { name: "Servicios" }).click();
  65 |   await page.locator('input[placeholder="Nombre"]').first().fill(serviceName);
  66 |   await page.locator('input[placeholder="Duracion"]').fill("45");
  67 |   await page.locator('input[placeholder="Precio"]').fill("8000");
  68 |   await page.getByRole("button", { name: "Agregar servicio" }).click();
  69 |   await expect(page.getByText(serviceName)).toBeVisible();
  70 | 
  71 |   await page.getByRole("button", { name: "Empleadas" }).click();
  72 |   await page.locator('input[placeholder="Nombre"]').first().fill(employeeName);
  73 |   await page.locator('input[placeholder="Telefono"]').first().fill("3411111111");
  74 |   await page.getByRole("button", { name: "Agregar empleada" }).click();
  75 |   await expect(page.getByText(employeeName)).toBeVisible();
  76 | 
  77 |   const employeeCard = page.locator("div.rounded-lg.border").filter({ hasText: employeeName }).first();
  78 |   await employeeCard.locator("label").filter({ hasText: serviceName }).first().click();
  79 | 
  80 |   await page.getByRole("button", { name: "Turnos" }).click();
  81 | 
  82 |   await selectRadixOption(page, "Seleccionar cliente", clientName);
  83 |   await selectRadixOption(page, "Seleccionar empleada", employeeName);
  84 |   await selectRadixOption(page, "Seleccionar servicio", serviceName);
  85 | 
  86 |   await page.locator('input[type="date"]').first().fill(nextBusinessDateISO());
  87 |   await selectRadixOption(page, "Elegir horario");
  88 | 
  89 |   await page.getByRole("button", { name: "Agendar turno" }).click();
  90 |   await expect(page.getByText("Turno creado correctamente")).toBeVisible();
  91 | });
  92 | 
```