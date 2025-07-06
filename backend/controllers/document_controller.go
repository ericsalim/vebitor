package controllers

import (
	"net/http"
	"texteditor-backend/models"
	"texteditor-backend/services"

	"github.com/gin-gonic/gin"
)

func GetDocument(c *gin.Context) {
	filePath := c.Param("filePath")
	if len(filePath) > 0 && filePath[0] == '/' {
		filePath = filePath[1:]
	}
	doc, err := services.ReadDocument(filePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, doc)
}

func CreateDocument(c *gin.Context) {
	var doc models.Document
	if err := c.ShouldBindJSON(&doc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if doc.FilePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "filePath is required"})
		return
	}
	err := services.WriteDocument(doc.FilePath, doc.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, doc)
}

func UpdateDocument(c *gin.Context) {
	filePath := c.Param("filePath")
	if len(filePath) > 0 && filePath[0] == '/' {
		filePath = filePath[1:]
	}
	var doc models.Document
	if err := c.ShouldBindJSON(&doc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := services.WriteDocument(filePath, doc.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	doc.FilePath = filePath
	c.JSON(http.StatusOK, doc)
}

func DeleteDocument(c *gin.Context) {
	filePath := c.Param("filePath")
	if len(filePath) > 0 && filePath[0] == '/' {
		filePath = filePath[1:]
	}
	err := services.DeleteDocument(filePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func ListDocuments(c *gin.Context) {
	parent := c.Query("parent")
	docs, err := services.ListDocuments(parent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}
