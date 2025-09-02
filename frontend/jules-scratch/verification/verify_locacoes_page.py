import re
from playwright.sync_api import Page, expect
import traceback

def test_locacoes_page_changes(page: Page):
    """
    This test verifies the changes made to the LocacoesPage.
    """
    try:
        print("Starting test...")
        # 1. Login
        print("Navigating to login page...")
        page.goto("http://localhost:5173/login")
        print("Filling login form...")
        page.get_by_label("Login").fill("admin")
        page.get_by_label("Senha").fill("adminpassword")
        page.get_by_role("button", name="Entrar").click()
        print("Waiting for dashboard...")
        expect(page).to_have_url(re.compile(".*"), timeout=10000)
        print("Login successful.")

        # 2. Navigate to Locações page
        print("Navigating to /locacoes...")
        page.goto("http://localhost:5173/locacoes")
        expect(page.get_by_role("heading", name="Planejamento Semanal de Locações")).to_be_visible()
        print("On Locacoes page.")

        # 3. Verify layout changes
        print("Verifying layout...")
        expect(page.get_by_role("button", name="Relatório de Pagamento")).to_be_visible()
        expect(page.get_by_role("heading", name="Listagem Detalhada de Locações")).not_to_be_visible()
        print("Layout verified. Taking screenshot 01...")
        page.screenshot(path="frontend/jules-scratch/verification/01_layout_changed.png")
        print("Screenshot 01 taken.")

        # 4. Open modal
        print("Opening modal...")
        first_day_column = page.locator('.flex.mt-4 .flex-1').first
        add_button = first_day_column.get_by_role("button", name="Adicionar")
        add_button.click()
        print("Modal opened.")

        # 5. Verify modal and autocomplete
        print("Verifying modal content...")
        expect(page.get_by_role("heading", name="Adicionar Nova Locação")).to_be_visible()
        page.get_by_label("Funcionário").check()

        funcionario_input = page.get_by_placeholder("Digite para buscar um funcionário...")
        expect(funcionario_input).to_be_visible()
        print("Interacting with autocomplete...")

        funcionario_input.fill("Funcionario")
        suggestion = page.get_by_text("Funcionario Teste", exact=False).first
        expect(suggestion).to_be_visible(timeout=10000)
        suggestion.click()

        expect(funcionario_input).to_have_value(re.compile("Funcionario Teste", re.IGNORECASE))
        print("Autocomplete interaction successful. Taking screenshot 02...")
        page.screenshot(path="frontend/jules-scratch/verification/02_autocomplete_works.png")
        print("Screenshot 02 taken.")
        print("Test finished successfully!")

    except Exception as e:
        print("An error occurred during Playwright test execution:")
        print(traceback.format_exc())
        # Re-raise the exception to ensure the test runner knows it failed.
        raise
