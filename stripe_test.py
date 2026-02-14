#!/usr/bin/env python3
"""
Stripe Endpoints Testing for Ágora Mujeres
Testing the new Stripe API key functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://agora-mujeres-mvp.preview.emergentagent.com/api"

def test_stripe_customer_creation():
    """Test POST /api/subscription/create-customer"""
    print("🧪 Testing Stripe Customer Creation...")
    
    url = f"{BACKEND_URL}/subscription/create-customer"
    payload = {
        "device_id": "test-stripe-001",
        "email": "test@example.com", 
        "name": "Test User"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "customer_id" in data:
                print(f"✅ SUCCESS: Customer created with ID: {data['customer_id']}")
                return data['customer_id']
            else:
                print("❌ FAIL: Response missing customer_id")
                return None
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

def test_stripe_payment_intent(device_id):
    """Test POST /api/subscription/create-payment-intent"""
    print(f"\n🧪 Testing Stripe Payment Intent for device: {device_id}...")
    
    url = f"{BACKEND_URL}/subscription/create-payment-intent"
    params = {"device_id": device_id}
    
    try:
        response = requests.post(url, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "client_secret" in data and "payment_intent_id" in data:
                print(f"✅ SUCCESS: Payment intent created")
                print(f"   - Payment Intent ID: {data['payment_intent_id']}")
                print(f"   - Client Secret: {data['client_secret'][:20]}...")
                return True
            else:
                print("❌ FAIL: Response missing required fields")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    """Main test execution"""
    print("=" * 60)
    print("🔥 STRIPE ENDPOINTS TESTING - NEW API KEY VERIFICATION")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print()
    
    # Test 1: Create Stripe Customer
    customer_id = test_stripe_customer_creation()
    
    # Test 2: Create Payment Intent (only if customer creation worked)
    payment_intent_success = False
    if customer_id:
        payment_intent_success = test_stripe_payment_intent("test-stripe-001")
    else:
        print("\n⏭️  SKIPPING Payment Intent test - Customer creation failed")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    if customer_id:
        print("✅ Stripe Customer Creation: WORKING")
    else:
        print("❌ Stripe Customer Creation: FAILED")
    
    if customer_id and payment_intent_success:
        print("✅ Stripe Payment Intent: WORKING")
    elif customer_id:
        print("❌ Stripe Payment Intent: FAILED")
    else:
        print("⏭️  Stripe Payment Intent: SKIPPED")
    
    print()
    if customer_id and payment_intent_success:
        print("🎉 OVERALL RESULT: NEW STRIPE API KEY IS WORKING!")
        return 0
    elif customer_id:
        print("⚠️  OVERALL RESULT: Customer creation works, payment intent has issues")
        return 1
    else:
        print("💥 OVERALL RESULT: STRIPE API KEY STILL NOT WORKING")
        return 2

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)