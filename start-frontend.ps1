# Start Frontend with React
# This script starts the React frontend development server

Write-Host "Starting frontend with React..." -ForegroundColor Green
Write-Host "React will automatically reload when frontend files change" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red

# Change to frontend directory and start React
Set-Location frontend

# Start React development server
try {
    npm start
}
finally {
    # Return to project root when React stops
    Set-Location ..
    Write-Host "`nFrontend stopped. Returned to project root." -ForegroundColor Yellow
} 