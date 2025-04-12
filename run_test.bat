@echo off
echo === Gardenbook System Test ===
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Please install Python 3.6 or higher.
    exit /b 1
)

REM Install required packages if not already installed
echo Installing required packages...
pip install requests >nul 2>&1

REM Run the test script
python test_gardenbook.py

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo All tests passed successfully!
) else (
    echo.
    echo Some tests failed. Please check the logs above.
)

pause 