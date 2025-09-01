import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Add a delay to give the server time to start
        time.sleep(20)

        # Login
        page.goto("http://localhost:5173/login")
        page.get_by_label("Login").fill("admin")
        page.get_by_label("Senha").fill("admin123")
        page.get_by_role("button", name="Entrar").click()
        expect(page).to_have_url("http://localhost:5173/")

        # Go to Compras page
        page.goto("http://localhost:5173/compras")

        # Click on the report button
        report_button = page.get_by_role("button", name="Relatório de Pagamentos")
        expect(report_button).to_be_visible()
        report_button.click()

        # Verify the modal is open
        expect(page.get_by_role("heading", name="Relatório de Pagamento de Compras")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/payment_report_modal.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
