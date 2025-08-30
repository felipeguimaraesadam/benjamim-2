import re
from playwright.sync_api import Page, expect

def test_compras_page_functionality(page: Page):
    # Log network requests
    def log_request(request):
        print(f">> {request.method} {request.url}")
    page.on("request", log_request)

    def log_response(response):
        print(f"<< {response.status} {response.url}")
    page.on("response", log_response)

    # Navigate to the login page
    page.goto("http://localhost:5173/login")

    # Fill in the login form and submit
    page.fill('input[name="login"]', 'admin_test')
    page.fill('input[name="password"]', 'test123')
    page.click('button[type="submit"]')

    # Wait for navigation to the dashboard
    expect(page).to_have_url(re.compile(".*dashboard"))

    # Navigate to the Compras page
    page.click('a[href="/compras"]')
    expect(page).to_have_url(re.compile(".*compras"))

    # Wait for the planner to be visible
    expect(page.locator(".weekly-planner-container")).to_be_visible()

    # Find a purchase card
    purchase_card = page.locator(".compra-card").first
    expect(purchase_card).to_be_visible()

    # Right-click on the card
    purchase_card.click(button="right")

    # Check if the context menu is visible
    context_menu = page.locator(".context-menu")
    expect(context_menu).to_be_visible()

    # Click on "Ver Detalhes"
    context_menu.get_by_text("Ver Detalhes").click()

    # Check if the detail modal is visible
    detail_modal = page.locator(".compra-detail-modal")
    expect(detail_modal).to_be_visible()

    # Close the modal
    detail_modal.get_by_label("Fechar modal").click()
    expect(detail_modal).not_to_be_visible()

    # Test Move
    day_columns = page.locator(".day-column")
    source_day = day_columns.first
    target_day = day_columns.last
    source_card = source_day.locator(".compra-card").first
    source_card_id = source_card.get_attribute("data-id")
    source_card.drag_to(target_day)
    page.locator("text=Mover").click()
    expect(target_day.locator(f'[data-id="{source_card_id}"]')).to_be_visible()
    page.reload()
    expect(target_day.locator(f'[data-id="{source_card_id}"]')).to_be_visible()

    # Test Duplicate
    day_columns = page.locator(".day-column")
    source_day = day_columns.first
    target_day = day_columns.last
    source_card = source_day.locator(".compra-card").first
    source_card.drag_to(target_day)
    page.locator("text=Duplicar").click()
    expect(target_day.locator(".compra-card")).to_have_count(2)
    page.reload()
    expect(target_day.locator(".compra-card")).to_have_count(2)
