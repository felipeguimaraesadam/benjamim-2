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

        # Wait for navigation to complete
        expect(page).to_have_url("http://localhost:5173/", timeout=10000)

        # Go to Locacoes Page
        page.get_by_role("link", name="Locações").click()
        expect(page).to_have_url("http://localhost:5173/locacoes")

        # Wait for the chart to be visible
        chart = page.locator(".recharts-responsive-container")
        expect(chart).to_be_visible()

        # Take a screenshot of the initial state
        page.screenshot(path="jules-scratch/verification/locacoes_initial.png")

        # Click the "Mês Anterior" button
        page.get_by_role("button", name="Mês Anterior").click()

        # Wait for the chart to potentially update
        page.wait_for_timeout(2000) # Increased wait time for re-render

        # Take a screenshot of the updated state
        page.screenshot(path="jules-scratch/verification/locacoes_previous_month.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
