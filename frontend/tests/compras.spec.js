import { test, expect } from '@playwright/test';

test.describe('Compras Page', () => {
  const FRONTEND_URL = 'http://localhost:5178';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${FRONTEND_URL}/`);
  });

  test('should create a new purchase and see it in the table', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/compras`);

    // 1. Open the creation modal
    await page.click('button:has-text("Adicionar Compra")');
    await expect(page.locator('h2:has-text("Adicionar Compra")')).toBeVisible();

    // 2. Fill out the main form fields
    // Select Obra
    await page.locator('#obra-select').click();
    await page.keyboard.type('Obra Teste');
    await page.waitForTimeout(500); // Wait for options to filter
    await page.keyboard.press('Enter');

    await page.fill('input[name="fornecedor"]', 'Fornecedor Teste');
    await page.locator('input[name="data_compra"]').fill('2025-08-23');

    // 3. Add an item to the purchase
    // Select Material
    await page.locator('#material-autocomplete').click();
    await page.keyboard.type('Cimento');
    await page.waitForTimeout(500); // Wait for options to filter
    await page.keyboard.press('Enter');

    await page.fill('input[name="itens[0].quantidade"]', '10');
    await page.fill('input[name="itens[0].valor_unitario"]', '50');

    // 4. Submit the form
    await page.click('button[type="submit"]:has-text("Salvar")');

    // 5. Verify the result
    // Check for success toast message
    await expect(page.locator('div[role="status"]:has-text("Compra criada com sucesso!")')).toBeVisible({ timeout: 10000 });

    // Check if the new purchase appears in the table.
    // This is a bit tricky as we don't have a unique ID. We'll look for the supplier.
    await expect(page.locator('table tbody tr td:has-text("Fornecedor Teste")').first()).toBeVisible();
  });
});
