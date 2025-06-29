package routes

import (
	"github.com/gin-gonic/gin"
	"texteditor-backend/controllers"
)

func RegisterRoutes(r *gin.Engine) {
	documents := r.Group("/documents")
	{
		documents.GET("/*filePath", controllers.GetDocument)
		documents.POST("", controllers.CreateDocument)
		documents.PUT("/*filePath", controllers.UpdateDocument)
		documents.DELETE("/*filePath", controllers.DeleteDocument)
		documents.GET("", controllers.ListDocuments)
	}
} 