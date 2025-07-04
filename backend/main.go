package main

import (
	"os"
	"github.com/gin-gonic/gin"
	"texteditor-backend/routes"
	"github.com/gin-contrib/cors"
)

func main() {
	// Set the user data and app data directories
	os.Setenv("USERDATA_DIR", "userdata")
	os.Setenv("APPDATA_DIR", "appdata")

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