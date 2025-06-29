package main

import (
	"os"
	"github.com/gin-gonic/gin"
	"texteditor-backend/routes"
	"github.com/gin-contrib/cors"
)

func main() {
	// Get data directory from environment variable, default to "data"
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "data"
	}

	// Set the data directory for the service
	os.Setenv("DATA_DIR", dataDir)

	r := gin.Default()

	// Enable CORS for frontend-backend communication
	r.Use(cors.Default())

	routes.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port) // listen and serve on the configured port
} 