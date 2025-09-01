from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Log in
        page.goto("http://localhost:5173/login")
        page.wait_for_load_state('domcontentloaded')

        page.get_by_label("Login").fill("admin")
        page.get_by_label("Senha").fill("admin123")
        page.get_by_role("button", name="Entrar").click()

        # Wait for the loading indicator to disappear
        expect(page.get_by_text("Carregando estatísticas...")).to_be_hidden(timeout=15000)

        # Now check for the URL
        expect(page).to_have_url("http://localhost:5173/", timeout=10000)

        # Go to Locacoes Page using a more specific selector
        page.get_by_role("navigation").get_by_role("link", name="Locações").click()
        expect(page).to_have_url("http://localhost:5173/locacoes")

        # Wait for the chart to be visible and scroll to it
        daily_cost_chart_container = page.locator("div.mb-8", has_text="Custo Diário de Locações")
        chart = daily_cost_chart_container.locator(".recharts-responsive-container")
        expect(chart).to_be_visible()
        chart.scroll_into_view_if_needed()

        # Take a screenshot of the initial state
        page.screenshot(path="jules-scratch/verification/locacoes_new_nav_initial.png")

        # Click the "Mês Anterior" button
        page.get_by_role("button", name="‹").click()

        # Wait for the chart to potentially update
        page.wait_for_timeout(2000)

        # Take a screenshot of the updated state
        page.screenshot(path="jules-scratch/verification/locacoes_new_nav_previous_month.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
