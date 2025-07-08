package routes

import (
	"texteditor-backend/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	documents := r.Group("/documents")
	{
		documents.GET("/*filePath", controllers.GetDocument)
		documents.POST("", controllers.CreateDocument)
		documents.PUT("/*filePath", controllers.UpdateDocument)
		documents.DELETE("/*filePath", controllers.DeleteDocument)
		documents.GET("", controllers.ListDocuments)
		documents.POST("/search", controllers.SearchDocuments)
	}

	r.GET("/session", controllers.GetSession)
	r.POST("/session", controllers.SaveSession)
}
