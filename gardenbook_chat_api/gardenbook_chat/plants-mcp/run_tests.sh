#!/bin/bash

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Ensure the virtual environment is activated
if [[ -z "${VIRTUAL_ENV}" ]]; then
  echo "Virtual environment not activated. Activating..."
  source .venv/bin/activate
fi

# Check if uv is installed, if not install it
if ! command -v uv &> /dev/null; then
  echo "uv not found. Installing..."
  python -m pip install uv
fi

# Install test dependencies using uv
python -m uv pip install -e ".[test]"

# Run the tests
python -m pytest tests -v

# Run with coverage if requested
if [[ "$1" == "--coverage" ]]; then
  # Ensure pytest-cov is installed
  python -m uv pip install pytest-cov
  # Run tests with coverage
  python -m pytest tests --cov=. --cov-report=term --cov-report=html
  echo "Coverage report generated in htmlcov/ directory"
fi 