import re
from playwright.sync_api import sync_playwright, Page, expect
from datetime import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to login page
        page.goto("http://localhost:5173/login")

        # Log in
        page.get_by_label("Login").fill("admin_test")
        page.get_by_label("Senha").fill("test123")
        page.get_by_role("button", name="Entrar").click()

        # Wait for navigation to the main page
        expect(page.get_by_role("heading", name="Sistema de Gerenciamento de Obras")).to_be_visible(timeout=10000)

        # Navigate to Compras page
        page.get_by_role("navigation").get_by_role("link", name="Compras").click()

        # Wait for the Compras page to load
        expect(page.get_by_role("heading", name="Planejamento Semanal de Compras")).to_be_visible(timeout=10000)

        # Navigate back a few weeks to find the populated data
        for _ in range(6):
            page.get_by_role("button", name="Anterior").click()
            # Wait for a moment for the content to potentially load
            page.wait_for_timeout(500)
            if page.locator("text=Fornecedor A").is_visible():
                break

        # Wait for the data to load
        expect(page.get_by_text("Fornecedor A")).to_be_visible(timeout=15000)

        # Click on a day to open the form
        day_to_click = datetime.today() - timedelta(days=10) # A day in the past
        day_of_week_abbr = day_to_click.strftime('%a')

        add_button = page.locator(f"div.p-2\\.5:has-text('{day_of_week_abbr}')").locator("xpath=../..").get_by_role("button", name="Adicionar Compra")
        add_button.click()

        # The form should now be visible
        expect(page.get_by_role("heading", name="Adicionar Nova Compra")).to_be_visible(timeout=10000)

        # Fill out the form
        page.get_by_label("Fornecedor").fill("Novo Fornecedor de Teste")
        page.get_by_label("Nota Fiscal").fill("NF-VERIFY-123")

        # Select an Obra from the autocomplete
        page.get_by_label("Obra").click()
        page.get_by_text("Construção Residencial Alpha").click()

        # Add an item to the purchase
        page.get_by_role("button", name="Adicionar Item").click()

        # Fill the item details
        page.locator('input[name="itens.0.material_autocomplete"]').fill("Cimento")
        page.get_by_text("Cimento Portland CP II", exact=True).click()
        page.locator('input[name="itens.0.quantidade"]').fill("10")
        page.locator('input[name="itens.0.valor_unitario"]').fill("35.50")

        # Submit the form
        page.get_by_role("button", name="Salvar").click()

        # Wait for the form to disappear and the new item to appear in the planner
        expect(page.get_by_role("heading", name="Adicionar Nova Compra")).not_to_be_visible(timeout=10000)
        expect(page.get_by_text("Novo Fornecedor de Teste")).to_be_visible(timeout=10000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/compras_creation.png")

        print("Screenshot taken successfully after creating a new purchase.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
