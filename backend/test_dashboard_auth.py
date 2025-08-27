import requests
import json

# First, let's try to login and get a JWT token
login_url = 'http://127.0.0.1:8000/api/token/'
dashboard_url = 'http://127.0.0.1:8000/api/dashboard/stats/'

# Try with a test user (you might need to create one)
login_data = {
    'login': 'admin',  # or any existing user
    'password': 'admin123'  # or the correct password
}

print("Testing Dashboard with Authentication...")
print("=" * 50)

try:
    # Try to login
    print("1. Attempting login...")
    login_response = requests.post(login_url, json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        # Get token from response
        token_data = login_response.json()
        print(f"Login successful! Token received.")
        
        # Use JWT token to access dashboard
        access_token = token_data.get('access', '')
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        print("\n2. Accessing dashboard with token...")
        dashboard_response = requests.get(dashboard_url, headers=headers)
        print(f"Dashboard Status: {dashboard_response.status_code}")
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print("\nDashboard Data:")
            print(json.dumps(dashboard_data, indent=2, ensure_ascii=False))
        else:
            print(f"Dashboard Error: {dashboard_response.text}")
    else:
        print(f"Login failed: {login_response.text}")
        print("\n3. Trying without authentication (should fail)...")
        dashboard_response = requests.get(dashboard_url)
        print(f"No Auth Status: {dashboard_response.status_code}")
        print(f"No Auth Response: {dashboard_response.text}")
        
except Exception as e:
    print(f"Error: {e}")

print("\nTest completed!")