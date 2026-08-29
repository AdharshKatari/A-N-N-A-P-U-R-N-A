import requests
import json
import base64

BASE_URL = "http://localhost:8000"

print("--- TESTING BACKEND APIs ---\n")

# 1. Health Check
try:
    print("1. Testing /api/v5/health")
    r = requests.get(f"{BASE_URL}/api/v5/health", timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}\n")
except Exception as e:
    print(f"Failed: {e}\n")

# 2. Auth (Register)
try:
    print("2. Testing Auth Flow & ACID DB write (using in-memory fallback since DB is disconnected)")
    import time
    test_username = f"test_{int(time.time())}"
    
    # The register endpoint takes username, email, full_name, password, recaptcha_token
    r_reg = requests.post(f"{BASE_URL}/api/v5/auth/register", json={
        "username": test_username,
        "email": f"{test_username}@example.com",
        "password": "strongpassword123",
        "full_name": "SIH Tester",
        "recaptcha_token": "dummy_dev_token"
    }, timeout=5)
    print(f"Register Status: {r_reg.status_code}")
    print(f"Register Response: {json.dumps(r_reg.json(), indent=2)}")
    
    token = r_reg.json().get("access_token")
    print(f"Got Token: {'Yes' if token else 'No'}\n")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
except Exception as e:
    print(f"Failed: {e}\n")
    headers = {}

# 3. WhatIf Simulation
try:
    print("3. Testing /api/v5/whatif/simulate (Core Logic Engine)")
    r_whatif = requests.post(f"{BASE_URL}/api/v5/whatif/simulate", json={
        "crop_type": "Tomato",
        "quantity_kg": 500,
        "visual_score": 65,
        "ambient_temp_c": 28,
        "latitude": 19.9975,
        "longitude": 73.7898,
        "ethylene_multiplier": 1.0
    }, headers=headers, timeout=5)
    print(f"WhatIf Status: {r_whatif.status_code}")
    print(f"WhatIf Response: {json.dumps(r_whatif.json(), indent=2)}\n")
except Exception as e:
    print(f"Failed: {e}\n")

# 4. Satellite Integration
try:
    print("4. Testing /api/v5/satellite/vedas/live (External Integration + Redis Cache)")
    r_sat = requests.get(f"{BASE_URL}/api/v5/satellite/vedas/live?latitude=19.9975&longitude=73.7898", headers=headers, timeout=5)
    print(f"Satellite Status: {r_sat.status_code}")
    print(f"Satellite Response: {json.dumps(r_sat.json(), indent=2)}\n")
except Exception as e:
    print(f"Failed: {e}\n")
