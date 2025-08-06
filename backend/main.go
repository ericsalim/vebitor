package main

import (
	"embed"
	"io/fs"
	"os"
	"texteditor-backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

//go:embed static
var staticFiles embed.FS

func main() {
	// Set the user data and app data directories
	os.Setenv("VEBITOR_USERDATA_DIR", "userdata")
	os.Setenv("VEBITOR_APPDATA_DIR", "appdata")

	r := gin.Default()

	// Enable CORS for frontend-backend communication
	r.Use(cors.Default())

	// Serve static files (embedded frontend)
	staticFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		panic("Failed to create static filesystem: " + err.Error())
	}

	// Register routes (includes static file handling in NoRoute)
	routes.RegisterRoutes(r, staticFS)

	port := os.Getenv("VEBITOR_PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port) // listen and serve on the configured port
}
