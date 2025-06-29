package services

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"texteditor-backend/models"
)

func getDataDir() string {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "data"
	}
	return dataDir
}

func ReadDocument(filePath string) (models.Document, error) {
	absPath := filepath.Join(getDataDir(), filePath)
	content, err := ioutil.ReadFile(absPath)
	if err != nil {
		return models.Document{}, err
	}
	return models.Document{FilePath: filePath, Content: string(content)}, nil
}

func WriteDocument(filePath, content string) error {
	absPath := filepath.Join(getDataDir(), filePath)
	dir := filepath.Dir(absPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return ioutil.WriteFile(absPath, []byte(content), 0644)
}

func DeleteDocument(filePath string) error {
	absPath := filepath.Join(getDataDir(), filePath)
	return os.Remove(absPath)
}

func ListDocuments() ([]models.Document, error) {
	var docs []models.Document
	err := filepath.Walk(getDataDir(), func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			relPath, _ := filepath.Rel(getDataDir(), path)
			content, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}
			docs = append(docs, models.Document{FilePath: relPath, Content: string(content)})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return docs, nil
} 