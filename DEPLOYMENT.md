# Vebitor Deployment Guide

## Single Executable Deployment

Vebitor can be deployed as a single executable that includes both the Go backend and React frontend.

## Prerequisites

- **Go 1.20+** installed
- **Node.js 16+** and **npm** installed
- **PowerShell** (for Windows builds)

## Building the Single Executable

### Quick Build (Windows)
```powershell
.\build.ps1
```

This will create `vebitor.exe` in the project root.

### Cross-Platform Build
```powershell
.\build-cross.ps1
```

This will create executables for multiple platforms in the `dist/` directory:
- `vebitor-windows-amd64.exe` - Windows 64-bit
- `vebitor-windows-386.exe` - Windows 32-bit
- `vebitor-linux-amd64` - Linux 64-bit
- `vebitor-linux-386` - Linux 32-bit
- `vebitor-darwin-amd64` - macOS Intel
- `vebitor-darwin-arm64` - macOS Apple Silicon

## Running the Application

### Windows
```powershell
.\vebitor.exe
```

### Linux/macOS
```bash
./vebitor-linux-amd64
# or
./vebitor-darwin-amd64
```

The application will start on `http://localhost:8080` by default.

## Configuration

### Environment Variables
- `PORT` - Server port (default: 8080)
- `USERDATA_DIR` - User data directory (default: "userdata")
- `APPDATA_DIR` - App data directory (default: "appdata")

### Example with Custom Port
```powershell
$env:PORT = "3000"; .\vebitor.exe
```

## Distribution

The single executable contains everything needed to run Vebitor:
- ✅ Go backend server
- ✅ React frontend (embedded)
- ✅ All dependencies
- ✅ File system access

### File Size
- Windows executable: ~15-20 MB
- Linux/macOS executable: ~12-18 MB

## Alternative Deployment Methods

### 1. Docker Container
```dockerfile
FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o vebitor .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/vebitor .
EXPOSE 8080
CMD ["./vebitor"]
```

### 2. Traditional Deployment
- Build frontend: `cd frontend && npm run build`
- Deploy backend and frontend separately
- Configure reverse proxy (nginx/Apache)

## Troubleshooting

### Build Issues
1. **"no matching files found"** - Run `npm run build` in frontend directory first
2. **Go build fails** - Ensure Go 1.20+ is installed
3. **Frontend build fails** - Check Node.js version and dependencies

### Runtime Issues
1. **Port already in use** - Change PORT environment variable
2. **Permission denied** - Ensure executable has proper permissions
3. **File access issues** - Check userdata/appdata directory permissions

## Security Considerations

- The executable runs with the same permissions as the user
- File operations are restricted to the configured directories
- No external network access required (except for optional features)
- Consider running in a sandboxed environment for production use 