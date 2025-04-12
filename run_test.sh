#!/bin/bash

echo "=== Gardenbook System Test ==="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.6 or higher."
    exit 1
fi

# Install required packages if not already installed
echo "Installing required packages..."
pip3 install requests >/dev/null 2>&1 || pip install requests >/dev/null 2>&1

# Make the test script executable
chmod +x test_gardenbook.py

# Run the test script
./test_gardenbook.py

# Check exit code
if [ $? -eq 0 ]; then
    echo
    echo "All tests passed successfully!"
else
    echo
    echo "Some tests failed. Please check the logs above."
fi 