#!/usr/bin/env python3
"""
Final API Testing for Ágora Mujeres App
Tests the main API endpoints as specifically requested by the user
"""

import requests
import json
import sys
from datetime import datetime

# Configuration as requested by user
DEVICE_ID = "test-final-check"
BASE_URL = "http://localhost:8000/api"  # Usar backend local para pruebas

def test_health_check():
    """Test GET /api/ - Health check"""
    print("Testing Health Check Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            print("   Health check PASSED")
            return True
        else:
            print("   Health check FAILED")
            return False
    except Exception as e:
        print(f"   Health check ERROR: {e}")
        return False

def test_subscription_status():
    """Test GET /api/subscription/{device_id} - Subscription status"""
    print(f"\nTesting Subscription Status for device: {DEVICE_ID}...")
    try:
        response = requests.get(f"{BASE_URL}/subscription/{DEVICE_ID}")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "status" in data:
                print("   Subscription status PASSED")
                return True
            else:
                print("   Subscription status FAILED - missing status field")
                return False
        else:
            print("   Subscription status FAILED")
            return False
    except Exception as e:
        print(f"   Subscription status ERROR: {e}")
        return False

def test_chat_ai():
    """Test POST /api/chat - Chat with AI"""
    print(f"\nTesting AI Chat for device: {DEVICE_ID}...")
    try:
        payload = {
            "device_id": DEVICE_ID,
            "message": "Hola Ágora, ¿cómo estás? Me siento un poco cansada hoy.",
            "language": "es"
        }
        
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            if "response" in data:
                print(f"   AI Response: {data['response'][:100]}...")
                print("   AI Chat PASSED")
                return True
            else:
                print("   AI Chat FAILED - missing response field")
                return False
        else:
            print(f"   Response: {response.text}")
            print("   AI Chat FAILED")
            return False
    except Exception as e:
        print(f"   AI Chat ERROR: {e}")
        return False

def test_resources():
    """Test GET /api/resources - Get resources"""
    print("\nTesting Resources Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/resources")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Number of resources: {len(data)}")
            if len(data) > 0:
                print(f"   Sample resource: {data[0].get('title', 'No title')}")
                print("   Resources PASSED")
            return True
        else:
            print(f"   Response: {response.text}")
            print("   Resources FAILED")
            return False
    except Exception as e:
        print(f"   ❌ Resources ERROR: {e}")
        return False

def test_resource_categories():
    """Test GET /api/resources/categories - Get resource categories"""
    print("\nTesting Resource Categories Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/resources/categories")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Number of categories: {len(data)}")
            if len(data) > 0:
                print(f"   Sample category: {data[0].get('name', 'No name')}")
                print("   Resource Categories PASSED")
            return True
        else:
            print(f"   Response: {response.text}")
            print("   Resource Categories FAILED")
            return False
    except Exception as e:
        print(f"   ❌ Resource Categories ERROR: {e}")
        return False

def test_admin_verify():
    """Test POST /api/admin/verify - Admin code verification"""
    print(f"\nTesting Admin Code Verification for device: {DEVICE_ID}...")
    try:
        # Test with correct admin code
        payload = {
            "device_id": DEVICE_ID,
            "code": "AGORA2025ADMIN"
        }
        
        response = requests.post(f"{BASE_URL}/admin/verify", json=payload)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            if "success" in data:
                print("   Admin Verification PASSED")
                return True
            else:
                print("   Admin Verification FAILED - missing success field")
                return False
        else:
            print(f"   Response: {response.text}")
            print("   Admin Verification FAILED")
            return False
    except Exception as e:
        print(f"   ❌ Admin Verification ERROR: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("AGORA MUJERES API TESTING - FINAL CHECK")
    print("=" * 60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Run all tests
    tests = [
        ("Health Check", test_health_check),
        ("Subscription Status", test_subscription_status),
        ("AI Chat", test_chat_ai),
        ("Resources", test_resources),
        ("Resource Categories", test_resource_categories),
        ("Admin Verification", test_admin_verify)
    ]
    
    results = []
    for test_name, test_func in tests:
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())