package controllers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "texteditor-backend/models"
    "texteditor-backend/services"
)

func GetSession(c *gin.Context) {
    session, err := services.GetSession()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, session)
}

func SaveSession(c *gin.Context) {
    var session models.Session
    if err := c.ShouldBindJSON(&session); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := services.SaveSession(&session); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, session)
} 