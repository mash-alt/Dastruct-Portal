# Run API Integration Tests
Write-Host "---------------------------------------------" -ForegroundColor Cyan
Write-Host " Running API Integration Tests" -ForegroundColor Cyan
Write-Host "---------------------------------------------" -ForegroundColor Cyan
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

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run the tests
Write-Host "Running API integration tests with Mocha..." -ForegroundColor Yellow
npx mocha test/test.js

# Check if tests passed
if ($LASTEXITCODE -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed." -ForegroundColor Red
}

Write-Host ""
Write-Host "Test execution complete." -ForegroundColor Cyan
