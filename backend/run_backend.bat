@echo off
echo Starting NLAMS Python Backend...
cd /d "%~dp0"
set PYTHON_EXE=C:\Users\acer\AppData\Local\Programs\Python\Python312\python.exe
if exist "%PYTHON_EXE%" (
    "%PYTHON_EXE%" server.py 8000
) else (
    python server.py 8000
)
pause
