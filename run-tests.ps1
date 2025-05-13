# Run Tests and Launch Server
$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Dastruct Portal Backend - Test Suite Runner" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
try {
    Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
    $mongoStatus = & mongod --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "MongoDB may not be installed or in PATH!" -ForegroundColor Red
        Write-Host "Please ensure MongoDB is installed and running."
        exit 1
    }
    Write-Host "MongoDB is available." -ForegroundColor Green
} catch {
    Write-Host "Error checking MongoDB! Please ensure it's installed and running." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating default .env file..." -ForegroundColor Yellow
    @"
PORT=5050
CONN_STRING=mongodb://localhost:27017/dastructportal
JWT_SECRET=roch_plando_the_great
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "Created default .env file." -ForegroundColor Green
} else {
    Write-Host ".env file already exists." -ForegroundColor Green
}

# Function to run a test
function Run-Test {
    param(
        [string]$TestName,
        [string]$Description,
        [string]$FilePath
    )
    
    Write-Host ""
    Write-Host "╔═════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "║ Running: $TestName" -ForegroundColor Blue
    Write-Host "║ $Description" -ForegroundColor Blue
    Write-Host "╚═════════════════════════════════════════════" -ForegroundColor Blue
    
    node $FilePath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Test failed!" -ForegroundColor Red
        return $false
    } else {
        Write-Host "Test completed successfully!" -ForegroundColor Green
        return $true
    }
}

# Setup test database first
Write-Host ""
Write-Host "Setting up test database..." -ForegroundColor Yellow
node test/setup-test-database.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to set up test database!" -ForegroundColor Red
    exit 1
}

# Display test menu
$continue = $true
while ($continue) {
    Write-Host ""
    Write-Host "Select a test to run:" -ForegroundColor Cyan
    Write-Host "1. Basic Recommendation Example" -ForegroundColor White
    Write-Host "2. Student Progression Simulation" -ForegroundColor White
    Write-Host "3. API-Based Student Simulation" -ForegroundColor White
    Write-Host "4. Recommendation Unit Tests" -ForegroundColor White
    Write-Host "5. Start Server" -ForegroundColor White
    Write-Host "0. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" {
            Run-Test -TestName "Basic Recommendation Example" `
                    -Description "Tests basic subject recommendations with real subjects" `
                    -FilePath "test/bsit-recommendation-example.js"
        }
        "2" {
            Run-Test -TestName "Student Progression Simulation" `
                    -Description "Simulates a student progressing through multiple semesters" `
                    -FilePath "test/student-progression-simulation.js"
        }
        "3" {
            Run-Test -TestName "API-Based Student Simulation" `
                    -Description "Tests the API endpoints for student progression" `
                    -FilePath "test/api-based-student-simulation.js"
        }
        "4" {
            Run-Test -TestName "Recommendation Unit Tests" `
                    -Description "Runs unit tests for the recommendation algorithm" `
                    -FilePath "test/recommendation-test.js"
        }
        "5" {
            Write-Host ""
            Write-Host "Starting server..." -ForegroundColor Yellow
            node server.js
            # Server will keep running until Ctrl+C
        }
        "0" {
            $continue = $false
            Write-Host "Exiting..." -ForegroundColor Yellow
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Test suite runner completed." -ForegroundColor Cyan
