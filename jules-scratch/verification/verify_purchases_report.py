import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to login page
        page.goto("http://localhost:5173/login")

        # Fill and submit login form
        page.get_by_label("Login").fill("admin")
        page.get_by_label("Senha").fill("admin")
        page.get_by_role("button", name="Entrar").click()

        # Wait for navigation to the dashboard and find the reports link
        expect(page).to_have_url(re.compile(".*dashboard"))

        # Navigate to Relatorios page
        page.get_by_role("link", name="Relatórios").click()
        expect(page).to_have_url(re.compile(".*relatorios"))

        # Click the button to open the purchases payment report modal
        page.get_by_role("button", name="Pagamento de Compras").click()

        # Wait for the modal to appear
        modal_title = page.locator("h2:has-text('Relatório de Pagamento de Compras')")
        expect(modal_title).to_be_visible()

        # Select a date range
        # Let's go back a few weeks to have a higher chance of finding data
        page.get_by_label("Selecionar Semana:").select_option("-3")

        # Click the button to go to the pre-check step
        page.get_by_role("button", name="Verificar Pendências").click()

        # Click the button to generate the report
        generate_button = page.get_by_role("button", name="Gerar Relatório")
        expect(generate_button).to_be_visible()
        generate_button.click()

        # Wait for the final report preview to be visible
        final_report_title = page.locator("h3:has-text('Passo 3: Relatório Final')")
        expect(final_report_title).to_be_visible()

        # Take a screenshot of the modal content
        modal_content = page.locator(".bg-white.dark\\:bg-gray-800")
        modal_content.screenshot(path="jules-scratch/verification/purchases_report.png")

        print("Screenshot saved to jules-scratch/verification/purchases_report.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
