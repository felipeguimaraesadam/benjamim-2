import requests
import pytest
import time
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path=dotenv_path)

API_BASE_URL = "http://localhost:8000/api"

def get_auth_token():
    """Fetches an auth token for the test user."""
    login_data = {
        "login": "admin",
        "password": "adminpassword"
    }
    response = requests.post(f"{API_BASE_URL}/token/", json=login_data)
    if response.status_code != 200:
        # Before failing, let's try to create the user, just in case they don't exist yet.
        # This makes the test suite more robust on a clean DB.
        try:
            from backend.core.models import Usuario
            if not Usuario.objects.filter(login='admin').exists():
                Usuario.objects.create_superuser('admin', 'adminpassword', nome_completo='Admin Test User')
        except Exception as e:
            pytest.fail(f"Failed to get auth token and also failed to create superuser. Pre-check error: {e}. Original response: {response.text}")

        # Retry getting the token
        response = requests.post(f"{API_BASE_URL}/token/", json=login_data)
        if response.status_code != 200:
            pytest.fail(f"Failed to get auth token even after attempting to create user. Status: {response.status_code}, Body: {response.text}")

    return response.json().get("access")


def test_approve_orcamento_flow():
    """
    Tests the full flow of approving a quote (orçamento) and converting it to a purchase (compra).
    """
    # Wait for servers to be ready
    time.sleep(5)

    # Get auth token
    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 1. Fetch all compras
    response = requests.get(f"{API_BASE_URL}/compras/", headers=headers)
    assert response.status_code == 200, f"Failed to fetch compras. Status: {response.status_code}, Body: {response.text}"
    compras = response.json()

    if isinstance(compras, dict) and 'results' in compras:
        compras_list = compras['results']
    elif isinstance(compras, list):
        compras_list = compras
    else:
        pytest.fail(f"Unexpected response format for /compras/: {compras}")

    # 2. Find an 'ORCAMENTO'
    orcamento = next((item for item in compras_list if item.get('tipo') == 'ORCAMENTO'), None)

    if orcamento is None:
        pytest.skip("No 'ORCAMENTO' found to test the approval flow. This is not a failure, but the test cannot proceed.")

    orcamento_id = orcamento.get('id')
    assert orcamento_id is not None, "Found orcamento has no ID."

    # 3. Verify 'status_orcamento' is not in the payload
    assert 'status_orcamento' not in orcamento, f"'status_orcamento' field found in orcamento with ID {orcamento_id}"

    # 4. Approve the 'ORCAMENTO'
    approve_response = requests.post(f"{API_BASE_URL}/compras/{orcamento_id}/approve/", headers=headers)
    assert approve_response.status_code == 200, f"Failed to approve orcamento. Status: {approve_response.status_code}, Body: {approve_response.text}"
    assert approve_response.json().get('status') == 'orçamento aprovado'

    # 5. Fetch the item again and verify the change
    get_compra_response = requests.get(f"{API_BASE_URL}/compras/{orcamento_id}/", headers=headers)
    assert get_compra_response.status_code == 200
    updated_compra = get_compra_response.json()

    # 6. Verify the 'tipo' is now 'COMPRA' and 'status_orcamento' is still not present
    assert updated_compra.get('tipo') == 'COMPRA', f"Compra {orcamento_id} did not change type to 'COMPRA' after approval."
    assert 'status_orcamento' not in updated_compra, f"'status_orcamento' field found in compra with ID {orcamento_id} after approval."

if __name__ == "__main__":
    pytest.main()
