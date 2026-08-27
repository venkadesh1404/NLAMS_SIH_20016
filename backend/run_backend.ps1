param(
    [int]$Port = 8000
)

$PythonExe = "C:\Users\acer\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Starting NLAMS Python Backend Server on Port $Port..." -ForegroundColor Cyan
& $PythonExe "$ScriptDir\server.py" $Port
