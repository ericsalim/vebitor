# Text Editor Backend

A Go-based REST API backend for the web text editor application.

## Configuration

The application uses environment variables for configuration:

### Environment Variables

- `DATA_DIR`: Directory where files will be stored (default: "data")
- `VEBITOR_PORT`: Server port (default: "8080")

### Setting Environment Variables

#### Windows (PowerShell)
```powershell
$env:DATA_DIR="C:\my\documents"
$env:VEBITOR_PORT="9000"
go run main.go
```

#### Windows (Command Prompt)
```cmd
set DATA_DIR=C:\my\documents
set VEBITOR_PORT=9000
go run main.go
```

#### Linux/macOS
```bash
export DATA_DIR="/home/user/documents"
export VEBITOR_PORT="9000"
go run main.go
```

#### Using a .env file
Create a `.env` file in the backend directory:
```
DATA_DIR=C:\my\documents
VEBITOR_PORT=9000
```

Then use a tool like `godotenv` to load it:
```bash
go install github.com/joho/godotenv/cmd/godotenv@latest
godotenv go run main.go
```

## Running the Application

1. Install dependencies:
   ```bash
   go mod tidy
   ```

2. Run the server:
   ```bash
   go run main.go
   ```

The server will start on `http://localhost:8080` (or the configured port).

## API Endpoints

- `GET /documents` - List all documents
- `GET /documents/*filePath` - Get a specific document
- `POST /documents` - Create a new document
- `PUT /documents/*filePath` - Update a document
- `DELETE /documents/*filePath` - Delete a document

## File Storage

Files are stored in the directory specified by `DATA_DIR`. The directory will be created automatically if it doesn't exist.

**Example:**
- If `DATA_DIR=documents`, files will be stored in `./documents/`
- If `DATA_DIR=C:\my\files`, files will be stored in `C:\my\files\` 