#!/usr/bin/env python3
"""
Additional Backend API Tests for specific review requirements
"""

import requests
import json

BASE_URL = "https://comfort-coach.preview.emergentagent.com/api"
TEST_DEVICE_ID = "test-device-abc"

def test_ai_response_tone():
    """Test that AI responses are warm and empathetic, not clinical"""
    print("Testing AI Response Tone...")
    
    test_messages = [
        "Me duele mucho todo el cuerpo",
        "No puedo dormir por el dolor",
        "Me siento muy triste hoy"
    ]
    
    for message in test_messages:
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={
                    "device_id": TEST_DEVICE_ID,
                    "message": message,
                    "language": "es"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("response", "")
                
                # Check for clinical language (should NOT be present)
                clinical_words = ["diagnóstico", "medicamento", "tratamiento", "síntoma", "patología", "terapia"]
                clinical_found = [word for word in clinical_words if word in ai_response.lower()]
                
                # Check for warm language (should be present)
                warm_words = ["comprendo", "entiendo", "acompañ", "siento", "abrazo", "cariño", "querida"]
                warm_found = [word for word in warm_words if word in ai_response.lower()]
                
                print(f"Message: '{message}'")
                print(f"Response: '{ai_response}'")
                print(f"Clinical words found: {clinical_found}")
                print(f"Warm words found: {warm_found}")
                print(f"Response length: {len(ai_response)} characters")
                print("---")
                
        except Exception as e:
            print(f"Error testing message '{message}': {e}")

def test_mongodb_persistence():
    """Test that data is properly stored in MongoDB"""
    print("\nTesting MongoDB Data Persistence...")
    
    # Create a unique diary entry
    unique_text = f"Test entry for persistence check - {int(time.time())}"
    
    # Create entry
    create_response = requests.post(
        f"{BASE_URL}/diary",
        json={
            "device_id": TEST_DEVICE_ID,
            "texto": unique_text,
            "emotional_state": {
                "calma": 3,
                "fatiga": 4,
                "niebla_mental": 2,
                "dolor_difuso": 3,
                "gratitud": 4,
                "tension": 2
            }
        }
    )
    
    if create_response.status_code == 200:
        entry_id = create_response.json().get("id")
        print(f"✅ Created entry with ID: {entry_id}")
        
        # Retrieve entries to verify persistence
        get_response = requests.get(f"{BASE_URL}/diary/{TEST_DEVICE_ID}")
        if get_response.status_code == 200:
            entries = get_response.json()
            found_entry = None
            for entry in entries:
                if entry.get("texto") == unique_text:
                    found_entry = entry
                    break
            
            if found_entry:
                print(f"✅ Entry persisted correctly in MongoDB")
                print(f"   Text: {found_entry.get('texto')}")
                print(f"   Emotional state: {found_entry.get('emotional_state')}")
            else:
                print(f"❌ Entry not found in retrieval")
        else:
            print(f"❌ Failed to retrieve entries: {get_response.status_code}")
    else:
        print(f"❌ Failed to create entry: {create_response.status_code}")

def test_subscription_trial_tracking():
    """Test subscription trial period tracking"""
    print("\nTesting Subscription Trial Tracking...")
    
    # Get initial status
    response1 = requests.get(f"{BASE_URL}/subscription/{TEST_DEVICE_ID}")
    if response1.status_code == 200:
        data1 = response1.json()
        initial_remaining = data1.get("trial_remaining_seconds", 0)
        print(f"Initial trial remaining: {initial_remaining} seconds")
        
        # Perform an action that should consume trial time (chat)
        chat_response = requests.post(
            f"{BASE_URL}/chat",
            json={
                "device_id": TEST_DEVICE_ID,
                "message": "Test message for trial tracking",
                "language": "es"
            }
        )
        
        if chat_response.status_code == 200:
            print("✅ Chat action completed")
            
            # Check status again
            response2 = requests.get(f"{BASE_URL}/subscription/{TEST_DEVICE_ID}")
            if response2.status_code == 200:
                data2 = response2.json()
                final_remaining = data2.get("trial_remaining_seconds", 0)
                print(f"Final trial remaining: {final_remaining} seconds")
                
                if final_remaining < initial_remaining:
                    print("✅ Trial time correctly decremented")
                else:
                    print("❌ Trial time not decremented")
            else:
                print(f"❌ Failed to get final status: {response2.status_code}")
        else:
            print(f"❌ Chat failed: {chat_response.status_code}")
    else:
        print(f"❌ Failed to get initial status: {response1.status_code}")

if __name__ == "__main__":
    import time
    
    print("=" * 60)
    print("ADDITIONAL BACKEND TESTS - SPECIFIC REQUIREMENTS")
    print("=" * 60)
    
    test_ai_response_tone()
    test_mongodb_persistence()
    test_subscription_trial_tracking()
    
    print("\n" + "=" * 60)
    print("ADDITIONAL TESTS COMPLETED")
    print("=" * 60)