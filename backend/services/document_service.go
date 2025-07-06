package services

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"texteditor-backend/models"
)

func getDataDir() string {
	dataDir := os.Getenv("USERDATA_DIR")
	if dataDir == "" {
		dataDir = "userdata"
	}
	return dataDir
}

func ReadDocument(filePath string) (models.Document, error) {
	absPath := filepath.Join(getDataDir(), filePath)
	content, err := ioutil.ReadFile(absPath)
	if err != nil {
		return models.Document{}, err
	}
	return models.Document{FilePath: filePath, Content: string(content), IsFolder: false}, nil
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

func ListDocuments(parent string) ([]models.DocumentMetadata, error) {
	// Ensure the userdata directory exists
	if err := os.MkdirAll(getDataDir(), 0755); err != nil {
		return nil, err
	}

	var docs []models.DocumentMetadata
	basePath := getDataDir()

	// If parent is specified, use it as the base path
	if parent != "" {
		basePath = filepath.Join(getDataDir(), parent)
		// Ensure the parent directory exists
		if err := os.MkdirAll(basePath, 0755); err != nil {
			return nil, err
		}
	}

	// List only immediate children (one level deep)
	entries, err := ioutil.ReadDir(basePath)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		relPath := entry.Name()
		if parent != "" {
			relPath = filepath.Join(parent, entry.Name())
		}

		if entry.IsDir() {
			// It's a folder
			docs = append(docs, models.DocumentMetadata{
				FilePath: relPath,
				IsFolder: true,
			})
		} else {
			// It's a file - don't load content, just metadata
			docs = append(docs, models.DocumentMetadata{
				FilePath: relPath,
				IsFolder: false,
			})
		}
	}

	return docs, nil
}
