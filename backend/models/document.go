package models

type Document struct {
	FilePath string `json:"filePath"`
	Content  string `json:"content"`
} 