# Start Backend with Air
# This script starts the Go backend with Air for automatic reloading

Write-Host "Starting backend with Air..." -ForegroundColor Green
Write-Host "Air will automatically restart the server when backend files change" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red

# Change to backend directory and start Air
Set-Location backend

# Start Air from the backend directory
try {
    air
}
finally {
    # Return to project root when Air stops
    Set-Location ..
    Write-Host "`nBackend stopped. Returned to project root." -ForegroundColor Yellow
} 