package controllers

import (
	"net/http"
	"strings"
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
		if err == services.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Folder not found", "code": "folder_not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}

func SearchDocuments(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate search mode
	if req.SearchMode != "plain" && req.SearchMode != "regex" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "searchMode must be 'plain' or 'regex'"})
		return
	}

	// Validate query is not empty
	if strings.TrimSpace(req.Query) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query cannot be empty"})
		return
	}

	results, err := services.SearchDocuments(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func RenameDocument(c *gin.Context) {
	type RenameRequest struct {
		OldPath string `json:"oldPath"`
		NewPath string `json:"newPath"`
	}
	var req RenameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.OldPath == "" || req.NewPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "oldPath and newPath are required"})
		return
	}
	err := services.RenameDocument(req.OldPath, req.NewPath)
	if err != nil {
		if err == services.ErrFileExists {
			c.JSON(http.StatusConflict, gin.H{"error": "File already exists", "code": "file_exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusOK)
}
