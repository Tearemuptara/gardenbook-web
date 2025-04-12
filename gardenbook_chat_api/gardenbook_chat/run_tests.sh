#!/bin/bash

# Set up Python path to include the current directory (not parent)
export PYTHONPATH=$(pwd):$PYTHONPATH

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run pytest with verbosity
python -m pytest tests -v

# Exit with the pytest exit code
exit $? 