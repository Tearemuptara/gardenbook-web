#!/usr/bin/env python3
import requests
import subprocess
import time
import sys
import json
import re

def check_docker_containers():
    """Check if all required Docker containers are running"""
    print("Checking Docker containers...")
    try:
        # Check both running and exited containers to provide better diagnostics
        result_all = subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}:{{.Status}}"], 
                               capture_output=True, text=True, check=True)
        
        result_running = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], 
                               capture_output=True, text=True, check=True)
        
        if not result_all.stdout.strip():
            print("❌ No Docker containers found. Make sure docker-compose up has been run.")
            return False
        
        # Process all containers (including exited ones)
        all_containers = {}
        for container_info in result_all.stdout.strip().split('\n'):
            if not container_info:
                continue
            parts = container_info.split(':', 1)
            if len(parts) == 2:
                name, status = parts
                all_containers[name] = status
        
        running_containers = result_running.stdout.strip().split('\n') if result_running.stdout.strip() else []
        
        print("\n=== Docker Container Status ===")
        for name, status in all_containers.items():
            print(f"{name}: {status}")
        
        # Check if containers exist and their status
        frontend_exists = any('frontend' in name for name in all_containers.keys())
        db_api_exists = any('db-api' in name for name in all_containers.keys())
        chat_api_exists = any('chat-api' in name for name in all_containers.keys())
        
        # Check if they're running
        frontend_running = any('frontend' in name for name in running_containers if name)
        db_api_running = any('db-api' in name for name in running_containers if name)
        chat_api_running = any('chat-api' in name for name in running_containers if name)
        
        print("\n=== Container Status ===")
        print(f"Frontend: {'✅ running' if frontend_running else '❌ not running'} {'(container exists but exited)' if frontend_exists and not frontend_running else ''}")
        print(f"DB API: {'✅ running' if db_api_running else '❌ not running'} {'(container exists but exited)' if db_api_exists and not db_api_running else ''}")
        print(f"Chat API: {'✅ running' if chat_api_running else '❌ not running'} {'(container exists but exited)' if chat_api_exists and not chat_api_running else ''}")
        
        # Get logs for exited containers
        if frontend_exists and not frontend_running:
            print("\n=== Frontend Container Logs ===")
            logs = subprocess.run(["docker", "logs", "--tail", "10", next(name for name in all_containers.keys() if 'frontend' in name)], 
                                capture_output=True, text=True)
            print(logs.stdout)
            
        if db_api_exists and not db_api_running:
            print("\n=== DB API Container Logs ===")
            logs = subprocess.run(["docker", "logs", "--tail", "10", next(name for name in all_containers.keys() if 'db-api' in name)], 
                                capture_output=True, text=True)
            print(logs.stdout)
            
        if chat_api_exists and not chat_api_running:
            print("\n=== Chat API Container Logs ===")
            logs = subprocess.run(["docker", "logs", "--tail", "10", next(name for name in all_containers.keys() if 'chat-api' in name)], 
                                capture_output=True, text=True)
            print(logs.stdout)
        
        if frontend_running and db_api_running and chat_api_running:
            print("\n✅ All required containers are running")
            return True
        else:
            print("\n❌ Some required containers are not running")
            # Provide troubleshooting information
            if not frontend_running or not db_api_running or not chat_api_running:
                print("\n=== Troubleshooting ===")
                print("1. Check the Docker logs above for error details")
                print("2. Verify the Dockerfiles in each component directory:")
                print("   - gardenbook-ui/Dockerfile")
                print("   - gardenbook-db-api/Dockerfile")
                print("   - gardenbook_chat_api/Dockerfile")
                print("3. Make sure the entry point files exist:")
                print("   - For DB API: check if index.js exists in gardenbook-db-api/")
                print("   - For Chat API: check if app.py exists in gardenbook_chat_api/")
            return False
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error checking Docker containers: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_frontend():
    """Test if the frontend is accessible"""
    print("\nTesting frontend...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print(f"✅ Frontend is running (Status: {response.status_code})")
            return True
        else:
            print(f"❌ Frontend returned unexpected status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Failed to connect to frontend: {e}")
        return False

def test_db_api():
    """Test if the database API is accessible"""
    print("\nTesting DB API...")
    try:
        # Try to access the API documentation endpoint
        response = requests.get("http://localhost:3001/api-docs", timeout=5)
        if response.status_code == 200:
            print(f"✅ DB API is running (Status: {response.status_code})")
            return True
        else:
            print(f"❌ DB API returned unexpected status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Failed to connect to DB API: {e}")
        return False

def test_chat_api():
    """Test if the chat API is accessible"""
    print("\nTesting Chat API...")
    try:
        # Try to access the API health endpoint
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Chat API is running (Status: {response.status_code})")
            return True
        else:
            print(f"❌ Chat API returned unexpected status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Failed to connect to Chat API: {e}")
        return False

def run_tests():
    """Run all tests and report results"""
    print("=== Starting Gardenbook System Tests ===\n")
    
    containers_running = check_docker_containers()
    
    if not containers_running:
        print("\n❌ Docker container test failed. Please fix the container issues before continuing.")
        return False
    
    frontend_test = test_frontend()
    db_api_test = test_db_api()
    chat_api_test = test_chat_api()
    
    all_tests_passed = frontend_test and db_api_test and chat_api_test
    
    print("\n=== Test Summary ===")
    print(f"Docker Containers: {'✅ PASS' if containers_running else '❌ FAIL'}")
    print(f"Frontend Test: {'✅ PASS' if frontend_test else '❌ FAIL'}")
    print(f"DB API Test: {'✅ PASS' if db_api_test else '❌ FAIL'}")
    print(f"Chat API Test: {'✅ PASS' if chat_api_test else '❌ FAIL'}")
    print(f"\nOverall Result: {'✅ ALL TESTS PASSED' if all_tests_passed else '❌ SOME TESTS FAILED'}")
    
    return all_tests_passed

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1) 