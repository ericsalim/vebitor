# Vebitor

Vebitor is a web-based text editor. It can be deployed to any web server and accessed using any web browser. It does not support collaborative editing.

Vebitor is developed almost entirely using AI prompts.

I do not accept pull requests for two reasons:
1. This project is developed for my own needs
2. I do not audit the code

# Deployment Guide

Vebitor can be deployed as a single executable that contains everything needed to run Vebitor:
- ✅ Go backend server
- ✅ React frontend (embedded)

## Prerequisites

- **Windows**
- **PowerShell**
- **Go 1.20+** installed
- **Node.js 16+** and **npm** installed

## Building the Executable

```powershell
.\build.ps1
```

This will create `vebitor.exe` in the project root.

## Running the Application

```powershell
.\vebitor.exe
```

## Configuration

### Environment Variables
- `VEBITOR_PORT` - Server port (default: 8080)
- `VEBITOR_USERDATA_DIR` - User data directory (default: "userdata")
- `VEBITOR_APPDATA_DIR` - App data directory (default: "appdata")

### Example with Custom Port
```powershell
$env:VEBITOR_PORT = "3000"; .\vebitor.exe
```

## Security Considerations

- There is not authentication
- The executable runs with the same permissions as the user
- File operations are restricted to the configured directories
