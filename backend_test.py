#!/usr/bin/env python3
"""
Backend API Testing for Ágora Mujeres
Tests all backend endpoints for the therapeutic companion app
"""

import requests
import json
from datetime import datetime, timedelta
import uuid
import time

# Configuration
BASE_URL = "https://comfort-coach.preview.emergentagent.com/api"
TEST_DEVICE_ID = "test-device-abc"

class AgoraBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.device_id = TEST_DEVICE_ID
        self.session = requests.Session()
        self.test_results = {}
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results[test_name] = {
            "success": success,
            "details": details,
            "response_data": response_data
        }
    
    def test_health_check(self):
        """Test GET /api/ - Health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                expected_message = "Ágora Mujeres API"
                expected_version = "1.0.0"
                
                if (data.get("message") == expected_message and 
                    data.get("version") == expected_version):
                    self.log_test("Health Check", True, 
                                f"Correct response: {data}")
                else:
                    self.log_test("Health Check", False, 
                                f"Unexpected response format", data)
            else:
                self.log_test("Health Check", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
    
    def test_diary_entry_creation(self):
        """Test POST /api/diary - Create diary entry"""
        try:
            diary_data = {
                "device_id": self.device_id,
                "texto": "Hoy me siento mejor, menos dolor en las articulaciones",
                "emotional_state": {
                    "calma": 4,
                    "fatiga": 2,
                    "niebla_mental": 1,
                    "dolor_difuso": 2,
                    "gratitud": 5,
                    "tension": 1
                },
                "physical_state": {
                    "nivel_dolor": 3,
                    "energia": 6,
                    "sensibilidad": 4
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/diary",
                json=diary_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("device_id") == self.device_id and 
                    data.get("id") and 
                    data.get("emotional_state")):
                    self.log_test("Diary Entry Creation", True, 
                                f"Entry created with ID: {data.get('id')}")
                else:
                    self.log_test("Diary Entry Creation", False, 
                                "Missing required fields in response", data)
            else:
                self.log_test("Diary Entry Creation", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Diary Entry Creation", False, f"Exception: {str(e)}")
    
    def test_diary_entries_retrieval(self):
        """Test GET /api/diary/{device_id} - Get diary entries"""
        try:
            response = self.session.get(f"{self.base_url}/diary/{self.device_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Diary Entries Retrieval", True, 
                                f"Retrieved {len(data)} entries")
                else:
                    self.log_test("Diary Entries Retrieval", False, 
                                "Response is not a list", data)
            else:
                self.log_test("Diary Entries Retrieval", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Diary Entries Retrieval", False, f"Exception: {str(e)}")
    
    def test_pattern_analysis(self):
        """Test GET /api/diary/{device_id}/patterns - Get pattern analysis"""
        try:
            response = self.session.get(
                f"{self.base_url}/diary/{self.device_id}/patterns?days=7"
            )
            
            if response.status_code == 200:
                data = response.json()
                if "period_days" in data or "message" in data:
                    self.log_test("Pattern Analysis", True, 
                                f"Pattern data received: {data.get('total_entries', 'No entries')}")
                else:
                    self.log_test("Pattern Analysis", False, 
                                "Unexpected response format", data)
            else:
                self.log_test("Pattern Analysis", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Pattern Analysis", False, f"Exception: {str(e)}")
    
    def test_ai_chat(self):
        """Test POST /api/chat - Chat with Aurora AI"""
        try:
            chat_data = {
                "device_id": self.device_id,
                "message": "Me siento muy cansada hoy, el dolor es intenso",
                "language": "es"
            }
            
            response = self.session.post(
                f"{self.base_url}/chat",
                json=chat_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get("response", "")
                
                if ai_response and len(ai_response) > 10:
                    # Check for warm, empathetic tone indicators
                    warm_indicators = ["comprendo", "entiendo", "acompañ", "cálid", "suav", "gentil"]
                    clinical_indicators = ["diagnóstic", "medicament", "tratamient", "síntom"]
                    
                    has_warmth = any(indicator in ai_response.lower() for indicator in warm_indicators)
                    is_clinical = any(indicator in ai_response.lower() for indicator in clinical_indicators)
                    
                    if not is_clinical:
                        self.log_test("AI Chat with Aurora", True, 
                                    f"Warm, non-clinical response received: '{ai_response[:100]}...'")
                    else:
                        self.log_test("AI Chat with Aurora", False, 
                                    f"Response seems clinical: '{ai_response}'")
                else:
                    self.log_test("AI Chat with Aurora", False, 
                                "Empty or too short response", data)
            else:
                self.log_test("AI Chat with Aurora", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("AI Chat with Aurora", False, f"Exception: {str(e)}")
    
    def test_chat_history(self):
        """Test GET /api/chat/{device_id}/history - Get chat history"""
        try:
            response = self.session.get(f"{self.base_url}/chat/{self.device_id}/history")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Chat History", True, 
                                f"Retrieved {len(data)} chat messages")
                else:
                    self.log_test("Chat History", False, 
                                "Response is not a list", data)
            else:
                self.log_test("Chat History", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Chat History", False, f"Exception: {str(e)}")
    
    def test_subscription_status(self):
        """Test GET /api/subscription/{device_id} - Get subscription status"""
        try:
            response = self.session.get(f"{self.base_url}/subscription/{self.device_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "trial_remaining_seconds" in data:
                    remaining = data.get("trial_remaining_seconds", 0)
                    self.log_test("Subscription Status", True, 
                                f"Status: {data.get('status')}, Remaining: {remaining}s")
                else:
                    self.log_test("Subscription Status", False, 
                                "Missing required fields", data)
            else:
                self.log_test("Subscription Status", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Subscription Status", False, f"Exception: {str(e)}")
    
    def test_weather(self):
        """Test GET /api/weather - Get weather data"""
        try:
            # Madrid coordinates
            response = self.session.get(
                f"{self.base_url}/weather?lat=40.4168&lon=-3.7038"
            )
            
            if response.status_code == 200:
                data = response.json()
                if "temperature" in data and "condition" in data:
                    self.log_test("Weather Integration", True, 
                                f"Weather: {data.get('temperature')}°C, {data.get('condition')}")
                else:
                    self.log_test("Weather Integration", False, 
                                "Missing weather fields", data)
            else:
                self.log_test("Weather Integration", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Weather Integration", False, f"Exception: {str(e)}")
    
    def test_cycle_entry_creation(self):
        """Test POST /api/cycle - Create cycle entry"""
        try:
            cycle_data = {
                "device_id": self.device_id,
                "start_date": "2026-01-20T00:00:00",
                "notes": "Inicio de ciclo menstrual"
            }
            
            response = self.session.post(
                f"{self.base_url}/cycle",
                json=cycle_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("device_id") == self.device_id and data.get("id"):
                    self.log_test("Cycle Entry Creation", True, 
                                f"Cycle entry created with ID: {data.get('id')}")
                else:
                    self.log_test("Cycle Entry Creation", False, 
                                "Missing required fields", data)
            else:
                self.log_test("Cycle Entry Creation", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Cycle Entry Creation", False, f"Exception: {str(e)}")
    
    def test_cycle_entries_retrieval(self):
        """Test GET /api/cycle/{device_id} - Get cycle entries"""
        try:
            response = self.session.get(f"{self.base_url}/cycle/{self.device_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Cycle Entries Retrieval", True, 
                                f"Retrieved {len(data)} cycle entries")
                else:
                    self.log_test("Cycle Entries Retrieval", False, 
                                "Response is not a list", data)
            else:
                self.log_test("Cycle Entries Retrieval", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Cycle Entries Retrieval", False, f"Exception: {str(e)}")
    
    def test_stripe_customer_creation(self):
        """Test POST /api/subscription/create-customer - Create Stripe customer"""
        try:
            customer_data = {
                "device_id": self.device_id,
                "email": "maria.gonzalez@example.com",
                "name": "María González"
            }
            
            response = self.session.post(
                f"{self.base_url}/subscription/create-customer",
                json=customer_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("customer_id"):
                    self.log_test("Stripe Customer Creation", True, 
                                f"Customer created: {data.get('customer_id')}")
                else:
                    self.log_test("Stripe Customer Creation", False, 
                                "No customer_id in response", data)
            else:
                self.log_test("Stripe Customer Creation", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Stripe Customer Creation", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("ÁGORA MUJERES BACKEND API TESTING")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Test Device ID: {self.device_id}")
        print("=" * 60)
        print()
        
        # Run tests in logical order
        self.test_health_check()
        self.test_diary_entry_creation()
        self.test_diary_entries_retrieval()
        self.test_pattern_analysis()
        self.test_ai_chat()
        self.test_chat_history()
        self.test_subscription_status()
        self.test_weather()
        self.test_cycle_entry_creation()
        self.test_cycle_entries_retrieval()
        self.test_stripe_customer_creation()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results.values() if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\nFAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    print(f"❌ {test_name}: {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = AgoraBackendTester()
    results = tester.run_all_tests()