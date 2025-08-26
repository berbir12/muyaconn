#!/usr/bin/env python3
"""
SkillHub Backend API Testing Suite
Tests all backend endpoints for the SkillHub service marketplace
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"

class SkillHubAPITester:
    def __init__(self):
        self.results = []
        self.auth_token = "demo-test-token-123"  # Demo token for testing
        
    def log_result(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_api_root(self):
        """Test GET /api/ - Basic API root endpoint"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "SkillHub API" in data["message"]:
                    self.log_result("API Root", True, f"Status: {response.status_code}, Message: {data.get('message')}", data)
                else:
                    self.log_result("API Root", False, f"Unexpected response format: {data}", data)
            else:
                self.log_result("API Root", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("API Root", False, f"Request failed: {str(e)}")
    
    def test_health_check(self):
        """Test GET /api/health - Health check with Supabase connection status"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "services" in data:
                    supabase_status = data.get("services", {}).get("supabase", "unknown")
                    self.log_result("Health Check", True, 
                                  f"Status: {data.get('status')}, Supabase: {supabase_status}", data)
                else:
                    self.log_result("Health Check", False, f"Unexpected response format: {data}", data)
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Health Check", False, f"Request failed: {str(e)}")
    
    def test_service_categories(self):
        """Test GET /api/service-categories - Get list of service categories"""
        try:
            response = requests.get(f"{API_BASE}/service-categories", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) == 10:
                    # Check if categories have required fields
                    valid_categories = all(
                        isinstance(cat, dict) and 
                        "id" in cat and "name" in cat and "icon" in cat and "description" in cat
                        for cat in data
                    )
                    if valid_categories:
                        category_names = [cat["name"] for cat in data]
                        self.log_result("Service Categories", True, 
                                      f"Found {len(data)} categories: {', '.join(category_names[:5])}...", data)
                    else:
                        self.log_result("Service Categories", False, "Categories missing required fields", data)
                else:
                    self.log_result("Service Categories", False, 
                                  f"Expected 10 categories, got {len(data) if isinstance(data, list) else 'non-list'}", data)
            else:
                self.log_result("Service Categories", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Service Categories", False, f"Request failed: {str(e)}")
    
    def test_get_profile(self):
        """Test GET /api/profiles/{user_id} - Get user profile"""
        test_user_id = "test-user-123"
        try:
            response = requests.get(f"{API_BASE}/profiles/{test_user_id}", timeout=10)
            
            # This endpoint is expected to fail since no profiles exist yet
            if response.status_code == 404:
                self.log_result("Get Profile", True, 
                              f"Expected 404 for non-existent profile: {response.status_code}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result("Get Profile", True, f"Profile found: {data}", data)
            else:
                self.log_result("Get Profile", False, 
                              f"Unexpected status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Get Profile", False, f"Request failed: {str(e)}")
    
    def test_get_bookings_unauthenticated(self):
        """Test GET /api/bookings without authentication"""
        try:
            response = requests.get(f"{API_BASE}/bookings", timeout=10)
            
            # Should return 401 or 403 for unauthenticated request
            if response.status_code in [401, 403]:
                self.log_result("Get Bookings (No Auth)", True, 
                              f"Correctly rejected unauthenticated request: {response.status_code}")
            else:
                self.log_result("Get Bookings (No Auth)", False, 
                              f"Should reject unauthenticated request, got: {response.status_code}")
                
        except Exception as e:
            self.log_result("Get Bookings (No Auth)", False, f"Request failed: {str(e)}")
    
    def test_get_bookings_authenticated(self):
        """Test GET /api/bookings with authentication"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        try:
            response = requests.get(f"{API_BASE}/bookings", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Bookings (Auth)", True, 
                                  f"Successfully retrieved {len(data)} bookings", data)
                else:
                    self.log_result("Get Bookings (Auth)", False, f"Expected list, got: {type(data)}", data)
            else:
                self.log_result("Get Bookings (Auth)", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Get Bookings (Auth)", False, f"Request failed: {str(e)}")
    
    def test_create_booking_unauthenticated(self):
        """Test POST /api/bookings without authentication"""
        booking_data = {
            "service_type": "Plumbing",
            "description": "Fix leaky faucet",
            "location": {"address": "123 Test St, Test City"}
        }
        
        try:
            response = requests.post(f"{API_BASE}/bookings", json=booking_data, timeout=10)
            
            # Should return 401 or 403 for unauthenticated request
            if response.status_code in [401, 403]:
                self.log_result("Create Booking (No Auth)", True, 
                              f"Correctly rejected unauthenticated request: {response.status_code}")
            else:
                self.log_result("Create Booking (No Auth)", False, 
                              f"Should reject unauthenticated request, got: {response.status_code}")
                
        except Exception as e:
            self.log_result("Create Booking (No Auth)", False, f"Request failed: {str(e)}")
    
    def test_create_booking_authenticated(self):
        """Test POST /api/bookings with authentication"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        booking_data = {
            "service_type": "Plumbing",
            "description": "Fix leaky faucet in kitchen",
            "location": {"address": "456 Main St, Test City", "coordinates": {"lat": 40.7128, "lng": -74.0060}}
        }
        
        try:
            response = requests.post(f"{API_BASE}/bookings", json=booking_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "customer_id", "service_type", "status", "created_at"]
                if all(field in data for field in required_fields):
                    self.log_result("Create Booking (Auth)", True, 
                                  f"Successfully created booking with ID: {data.get('id')}", data)
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_result("Create Booking (Auth)", False, 
                                  f"Missing required fields: {missing_fields}", data)
            else:
                self.log_result("Create Booking (Auth)", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Create Booking (Auth)", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting SkillHub API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Test all endpoints
        self.test_api_root()
        self.test_health_check()
        self.test_service_categories()
        self.test_get_profile()
        self.test_get_bookings_unauthenticated()
        self.test_get_bookings_authenticated()
        self.test_create_booking_unauthenticated()
        self.test_create_booking_authenticated()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        return self.results

if __name__ == "__main__":
    tester = SkillHubAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    failed_count = sum(1 for r in results if not r["success"])
    sys.exit(failed_count)