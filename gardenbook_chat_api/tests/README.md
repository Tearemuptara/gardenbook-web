# Gardenbook Chat API Tests

This directory contains tests for the Gardenbook Chat API.

## Running Tests

To run the tests, first install the development dependencies:

```bash
cd gardenbook_chat_api
uv pip install -r requirements.txt -r requirements-dev.txt
```

Then run the tests with pytest:

```bash
python -m pytest
```

## Test Coverage

To generate a coverage report:

```bash
python -m pytest --cov=gardenbook_chat_api --cov-report=html
```

Then open `htmlcov/index.html` in your browser.

## Test Structure

- `test_api.py`: Tests for the FastAPI endpoints
- `test_models.py`: Tests for the Pydantic models
- `test_run.py`: Tests for the run script
- `conftest.py`: Common fixtures and test setup 