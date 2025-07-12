package routes

import (
	"io/fs"
	"net/http"
	"texteditor-backend/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, staticFS fs.FS) {
	// 1. Register all /documents endpoints
	documents := r.Group("/documents")
	{
		// Specific routes first (more specific before wildcards)
		documents.GET("", controllers.ListDocuments)
		documents.POST("", controllers.CreateDocument)
		documents.POST("/search", controllers.SearchDocuments)

		// Wildcard routes last (less specific after specific routes)
		documents.GET("/*filePath", controllers.GetDocument)
		documents.PUT("/*filePath", controllers.UpdateDocument)
		documents.DELETE("/*filePath", controllers.DeleteDocument)
	}

	// 2. Register all /session endpoints
	r.GET("/session", controllers.GetSession)
	r.POST("/session", controllers.SaveSession)

	// 3. Register /app/*filePath endpoint as static files (frontend)
	r.StaticFS("/app", http.FS(staticFS))

	// 4. Register catch all as 404 not found
	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"error": "Not found"})
	})
}
