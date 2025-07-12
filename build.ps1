# Build script for Vebitor - Single Executable
# This script builds the frontend and embeds it into the Go backend

Write-Host "Building Vebitor Single Executable..." -ForegroundColor Green

# Save the original working directory
$originalLocation = Get-Location

try {
    # Step 1: Build Frontend
    Write-Host "Building React frontend..." -ForegroundColor Yellow
    Set-Location (Join-Path $originalLocation "frontend")
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }

    # Check if build directory was created
    $frontendBuildPath = Join-Path $originalLocation "frontend\build"
    if (-not (Test-Path $frontendBuildPath)) {
        Write-Host "Frontend build directory not found!" -ForegroundColor Red
        Write-Host "Expected: $frontendBuildPath" -ForegroundColor Red
        exit 1
    }

    # Step 2: Copy built files to backend static directory
    Write-Host "Copying frontend files to backend..." -ForegroundColor Yellow
    
    # Ensure backend/static directory exists
    $backendStaticPath = Join-Path $originalLocation "backend\static"
    if (-not (Test-Path $backendStaticPath)) {
        New-Item -ItemType Directory -Path $backendStaticPath -Force
    }
    
    # Delete all files in backend/static except stub.html
    Get-ChildItem -Path $backendStaticPath -Recurse | Where-Object { $_.Name -ne "stub.html" } | Remove-Item -Force -Recurse
    
    # Copy frontend build files to backend/static
    Copy-Item -Recurse "$frontendBuildPath\*" $backendStaticPath

    # Step 3: Build Go backend with embedded frontend
    Write-Host "Building Go backend with embedded frontend..." -ForegroundColor Yellow
    Set-Location (Join-Path $originalLocation "backend")

    # Create build directory
    $buildDir = Join-Path $originalLocation "backend\build"
    if (-not (Test-Path $buildDir)) {
        New-Item -ItemType Directory -Path $buildDir -Force
    }

    # Build for current platform
    $env:GOOS = "windows"
    $env:GOARCH = "amd64"
    go build -o (Join-Path $buildDir "vebitor.exe") -ldflags="-s -w" .

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend build failed!" -ForegroundColor Red
        exit 1
    }

    # Step 4: Cleanup - delete all files in backend/static except stub.html
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    Get-ChildItem -Path $backendStaticPath -Recurse | Where-Object { $_.Name -ne "stub.html" } | Remove-Item -Force -Recurse

    Write-Host "Build complete! Executable: backend\build\vebitor.exe" -ForegroundColor Green
    Write-Host "Run with: .\backend\build\vebitor.exe" -ForegroundColor Cyan
}
finally {
    # Always return to the original directory
    Set-Location $originalLocation
} 