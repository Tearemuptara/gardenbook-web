#!/bin/bash

# Text formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo
    echo -e "${BOLD}${BLUE}=== $1 ===${NC}"
    echo
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Keep track of failures
FAILURES=0

# Run gardenbook-db-api tests
run_db_api_tests() {
    print_header "Running DB API Tests"
    cd gardenbook-db-api
    
    # Run Jest with flags to properly handle async operations
    # --runInBand runs tests sequentially in the same process
    npx jest --forceExit --detectOpenHandles --runInBand --silent
    if [ $? -eq 0 ]; then
        print_success "DB API tests passed"
    else
        print_error "DB API tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    cd ..
}

# Run gardenbook-ui tests
run_ui_tests() {
    print_header "Running UI Tests"
    cd gardenbook-ui
    
    # Run Jest with flags to properly handle async operations
    # --runInBand runs tests sequentially in the same process
    npx jest --forceExit --detectOpenHandles --runInBand --silent
    if [ $? -eq 0 ]; then
        print_success "UI tests passed"
    else
        print_error "UI tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    cd ..
}

# Run gardenbook_chat_api tests
run_chat_api_tests() {
    print_header "Running Chat API Tests"
    
    # Activate virtual environment
    source gardenbook_chat_api/.venv/bin/activate
    
    # Run the main API tests
    cd gardenbook_chat_api
    
    if python -m pytest -q; then
        print_success "Chat API tests passed"
    else
        print_error "Chat API tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    # Run gardenbook_chat tests
    print_header "Running Gardenbook Chat Tests"
    
    if python -m pytest gardenbook_chat/tests/test_gardenbook_chat.py -q 2>/dev/null; then
        print_success "Gardenbook Chat tests passed"
    else
        print_error "Gardenbook Chat tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    if python -m pytest gardenbook_chat/tests/test_agent_behavior.py -q 2>/dev/null; then
        print_success "Agent Behavior tests passed"
    else
        print_error "Agent Behavior tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    # Run plants-mcp tests
    print_header "Running Plants-MCP Tests"
    cd gardenbook_chat/plants-mcp
    
    # Make sure the script is executable
    chmod +x run_tests.sh
    
    # Modify the run_tests.sh script to use pytest -q for quiet mode
    if python -m pytest tests -q; then
        print_success "Plants-MCP tests passed"
    else
        print_error "Plants-MCP tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    # Go back to project root
    cd ../../..
    
    # Deactivate virtual environment
    deactivate
}

# Test Docker build
test_docker_build() {
    print_header "Testing Docker Build"
    
    # Set the COMPOSE_BAKE environment variable to avoid warnings
    export COMPOSE_BAKE=true
    
    echo "Building frontend container..."
    # Redirect stdout to /dev/null to reduce verbosity while keeping stderr for errors
    if docker-compose build frontend > /dev/null; then
        print_success "Frontend build succeeded"
    else
        print_error "Frontend build failed. See error above."
        FAILURES=$((FAILURES+1))
        return 1
    fi
    
    echo "Building gardenbook-db-api container..."
    if docker-compose build gardenbook-db-api > /dev/null; then
        print_success "DB API build succeeded"
    else
        print_error "DB API build failed. See error above."
        FAILURES=$((FAILURES+1))
        return 1
    fi
    
    echo "Building gardenbook-chat-api container..."
    if docker-compose build gardenbook-chat-api > /dev/null; then
        print_success "Chat API build succeeded"
    else
        print_error "Chat API build failed. See error above."
        FAILURES=$((FAILURES+1))
        return 1
    fi
    
    # Unset the variable to avoid affecting other commands
    unset COMPOSE_BAKE
    
    return 0
}

# Run system integration tests
run_system_tests() {
    print_header "Running System Integration Tests"
    
    # First, test if all Docker builds succeed
    if ! test_docker_build; then
        print_error "Docker build failed. Skipping system tests."
        return 1
    fi
    
    # Set the COMPOSE_BAKE environment variable to avoid warnings
    # for the docker-compose up command called by test_gardenbook.py
    export COMPOSE_BAKE=true
    
    # Make the test script executable
    chmod +x test_gardenbook.py
    
    # Run the Python test script directly and show full output
    ./test_gardenbook.py
    if [ $? -eq 0 ]; then
        print_success "System tests passed"
    else
        print_error "System tests failed"
        FAILURES=$((FAILURES+1))
    fi
    
    # Unset the variable to avoid affecting other commands
    unset COMPOSE_BAKE
}

# Main function to run all tests
run_all_tests() {
    print_header "GARDENBOOK TEST SUITE"
    
    run_db_api_tests
    run_ui_tests
    run_chat_api_tests
    run_system_tests
    
    print_header "TEST SUMMARY"
    
    if [ $FAILURES -eq 0 ]; then
        print_success "All tests passed successfully!"
        return 0
    else
        print_error "$FAILURES test suites failed. Please check the logs above."
        return 1
    fi
}

# Run all tests
run_all_tests
exit $? 