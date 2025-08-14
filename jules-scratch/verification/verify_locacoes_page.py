import re
from playwright.sync_api import Page, expect

def test_locacoes_page_changes(page: Page):
    """
    This test verifies the changes made to the LocacoesPage.
    1. It checks that the layout has been updated.
    2. It checks that the new autocomplete components are working in the modal.
    """
    # 1. Arrange: Go to the login page and log in.
    page.goto("http://localhost:5173/login")
    page.get_by_label("Login").fill("admin")
    page.get_by_label("Senha").fill("adminpassword")
    page.get_by_role("button", name="Entrar").click()

    # Wait for navigation to the dashboard and then go to the locacoes page.
    expect(page).to_have_url(re.compile(".*"), timeout=10000)
    page.goto("http://localhost:5173/locacoes")

    # 2. Assert: Check the layout of the LocacoesPage.
    # The "Relatório de Pagamento" button should be visible.
    report_button = page.get_by_role("button", name="Relatório de Pagamento")
    expect(report_button).to_be_visible()

    # The "Listagem Detalhada de Locações" title should NOT be visible.
    detailed_list_title = page.get_by_role("heading", name="Listagem Detalhada de Locações")
    expect(detailed_list_title).not_to_be_visible()

    # The "Nova Locação (Lista)" button should NOT be visible.
    new_locacao_list_button = page.get_by_role("button", name="Nova Locação (Lista)")
    expect(new_locacao_list_button).not_to_be_visible()

    # Take a screenshot of the overall page layout.
    page.screenshot(path="jules-scratch/verification/locacoes_page_layout.png")

    # 3. Act: Open the "Adicionar Locação" modal from the weekly planner.
    # We'll find a day column and click the add button in it.
    # Let's target the first day column available.
    day_columns = page.locator(".flex-1.min-w-\\[180px\\]")
    first_day_column = day_columns.first
    add_button = first_day_column.get_by_role("button", name="Adicionar")
    add_button.click()

    # 4. Assert: Check the modal and the autocomplete components.
    # The modal for adding a new location should be visible.
    modal_title = page.get_by_role("heading", name="Adicionar Nova Locação")
    expect(modal_title).to_be_visible()

    # Select "Funcionário" type
    page.get_by_label("Funcionário").check()

    # Interact with the FuncionarioAutocomplete
    funcionario_input = page.get_by_placeholder("Digite para buscar um funcionário...")
    expect(funcionario_input).to_be_visible()

    # We'll type a common name and wait for suggestions.
    # Assuming there's an employee with "Silva" in their name.
    # Let's add a test employee first to be sure.
    # No, let's just assume there is one. We can see from the DB dump.
    # Let's try to find 'Funcionario'
    funcionario_input.fill("Funcionario")

    # Wait for the suggestions to appear.
    # We'll look for a suggestion that contains "Funcionario".
    suggestion = page.get_by_role("option", name=re.compile("Funcionario", re.IGNORECASE)).first
    expect(suggestion).to_be_visible(timeout=10000)
    suggestion.click()

    # After clicking, the input should be filled with the selected name.
    expect(funcionario_input).to_have_value(re.compile("Funcionario", re.IGNORECASE))

    # Take a screenshot of the modal with the autocomplete working.
    page.screenshot(path="jules-scratch/verification/locacoes_modal_autocomplete.png")
