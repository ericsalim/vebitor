package services

import (
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"texteditor-backend/models"
)

func getSessionFilePath() string {
	dataDir := os.Getenv("APPDATA_DIR")
	if dataDir == "" {
		dataDir = "appdata"
	}
	return filepath.Join(dataDir, "session.json")
}

func ensureAppDataDir() error {
	dataDir := os.Getenv("APPDATA_DIR")
	if dataDir == "" {
		dataDir = "appdata"
	}
	return os.MkdirAll(dataDir, fs.ModePerm)
}

func GetSession() (*models.Session, error) {
	path := getSessionFilePath()
	if err := ensureAppDataDir(); err != nil {
		return nil, err
	}
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			// Create empty session file if it does not exist
			session := &models.Session{OpenedFiles: []string{}, WorkingFolder: ""}
			if err := SaveSession(session); err != nil {
				return nil, err
			}
			return session, nil
		}
		return nil, err
	}
	defer file.Close()
	var session models.Session
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&session); err != nil {
		return nil, err
	}
	// Filter OpenedFiles to only those that exist
	userDataDir := os.Getenv("USERDATA_DIR")
	if userDataDir == "" {
		userDataDir = "userdata"
	}
	filtered := make([]string, 0, len(session.OpenedFiles))
	for _, f := range session.OpenedFiles {
		absPath := filepath.Join(userDataDir, f)
		if stat, err := os.Stat(absPath); err == nil && !stat.IsDir() {
			filtered = append(filtered, f)
		}
	}
	session.OpenedFiles = filtered

	// DO NOT check if working folder exists. Just return the session as-is.
	return &session, nil
}

func SaveSession(session *models.Session) error {
	path := getSessionFilePath()
	if err := ensureAppDataDir(); err != nil {
		return err
	}
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(session)
}
