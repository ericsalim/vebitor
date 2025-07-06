package models

type Document struct {
	FilePath string `json:"filePath"`
	Content  string `json:"content"`
	IsFolder bool   `json:"isFolder"`
}

type DocumentMetadata struct {
	FilePath string `json:"filePath"`
	IsFolder bool   `json:"isFolder"`
}
