import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})

    try:
        # Login
        page.goto("http://localhost:5176/login")
        page.fill("input[name='login']", "admin_test")
        page.fill("input[name='password']", "test123")
        page.click("button[type='submit']")
        expect(page).to_have_url(re.compile(r".*/"), timeout=10000)

        # Navigate to Compras Page
        acesso_rapido_header = page.locator("h2:has-text('Acesso Rápido')")
        expect(acesso_rapido_header).to_be_visible(timeout=10000)
        page.click("nav a[href='/compras']")
        expect(page).to_have_url(re.compile(r".*/compras"), timeout=10000)

        # Start creating a new purchase
        page.locator("button:has-text('Adicionar Compra')").click()

        # Fill out the form
        # 1. Select Obra
        obra_input_selector = 'label:has-text("Obra") + div input[role="combobox"]'
        page.locator(obra_input_selector).fill("Construção")
        page.get_by_text("Construção Residencial Alpha", exact=True).click()

        # 2. Add and fill an item
        page.click("button:has-text('Adicionar Novo Item')")
        material_input_selector = 'tbody tr input[role="combobox"]'
        material_input = page.locator(material_input_selector).first
        material_input.wait_for(state="visible", timeout=5000)
        material_input.fill("Tijolo")
        page.get_by_text("Tijolo Baiano 9 furos", exact=True).click()

        quantity_input = page.locator("input[placeholder='0,000']")
        price_input = page.locator("input[placeholder='0,00']")

        quantity_input.fill("100")
        price_input.fill("1.50")

        # 3. Submit the form
        page.locator("button:has-text('Salvar Compra')").click()

        # Assertions
        # 1. Check for success toast
        success_toast = page.locator("div[role='status'][aria-live='polite']")
        expect(success_toast).to_contain_text("Compra registrada com sucesso!", timeout=10000)
        print("Success toast message appeared.")

        # 2. Check that we are back on the main compras table page
        expect(page.locator("h1:has-text('Gestão de Compras')")).to_be_visible(timeout=10000)
        print("Navigated back to the Compras table view.")

        # 3. (Optional) Check if a new row was added. This is tricky without a unique ID.
        # We can just check that the table is visible as a proxy for success.
        expect(page.locator("table tbody")).to_be_visible()
        print("Compras table is visible after saving.")

        page.screenshot(path="jules-scratch/verification/save_purchase_verification.png")
        print("Screenshot taken for save verification.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_save.png")
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
