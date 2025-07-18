package services

import (
	"bufio"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
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

var ErrFolderNotFound = errors.New("folder_not_found")

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
		// Check if the parent directory exists
		if stat, err := os.Stat(basePath); err != nil || !stat.IsDir() {
			return nil, ErrFolderNotFound
		}
	}

	// List only immediate children (one level deep)
	entries, err := ioutil.ReadDir(basePath)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		filename := entry.Name()
		if entry.IsDir() {
			docs = append(docs, models.DocumentMetadata{
				FilePath: filename,
				IsFolder: true,
			})
		} else {
			docs = append(docs, models.DocumentMetadata{
				FilePath: filename,
				IsFolder: false,
			})
		}
	}

	// After populating docs, ensure it's not nil
	if docs == nil {
		docs = []models.DocumentMetadata{}
	}
	return docs, nil
}

func SearchDocuments(req models.SearchRequest) ([]models.SearchResult, error) {
	var results []models.SearchResult

	// Validate search folder is not higher than root
	searchPath := req.SearchFolder
	if searchPath != "" {
		// Check if the path tries to go above the root directory
		absSearchPath := filepath.Join(getDataDir(), searchPath)
		absDataDir, _ := filepath.Abs(getDataDir())
		absSearchPath, _ = filepath.Abs(absSearchPath)

		if !strings.HasPrefix(absSearchPath, absDataDir) {
			return nil, fmt.Errorf("search folder cannot be higher than root directory")
		}
	}

	// Determine the base path for search
	basePath := getDataDir()
	if searchPath != "" {
		basePath = filepath.Join(getDataDir(), searchPath)
	}

	// Walk through the directory recursively
	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Get relative path from data directory
		relPath, err := filepath.Rel(getDataDir(), path)
		if err != nil {
			return err
		}

		// Search in the file
		matches, err := searchInFile(path, req)
		if err != nil {
			return err
		}

		if len(matches) > 0 {
			results = append(results, models.SearchResult{
				FilePath: relPath,
				Matches:  matches,
			})
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Ensure we always return an empty slice instead of nil
	if results == nil {
		results = []models.SearchResult{}
	}

	return results, nil
}

func searchInFile(filePath string, req models.SearchRequest) ([]models.SearchMatch, error) {
	var matches []models.SearchMatch

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNumber := 1

	for scanner.Scan() {
		line := scanner.Text()
		var lineMatches []models.SearchMatch

		switch req.SearchMode {
		case "plain":
			lineMatches = searchPlainText(line, req.Query, req.CaseSensitive, lineNumber)
		case "regex":
			lineMatches = searchRegex(line, req.Query, req.CaseSensitive, lineNumber)
		}

		matches = append(matches, lineMatches...)
		lineNumber++
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return matches, nil
}

func searchPlainText(line, query string, caseSensitive bool, lineNumber int) []models.SearchMatch {
	var matches []models.SearchMatch

	searchLine := line
	searchQuery := query

	if !caseSensitive {
		searchLine = strings.ToLower(line)
		searchQuery = strings.ToLower(query)
	}

	start := 0
	for {
		pos := strings.Index(searchLine[start:], searchQuery)
		if pos == -1 {
			break
		}

		actualPos := start + pos
		matches = append(matches, models.SearchMatch{
			LineNumber: lineNumber,
			LineText:   line,
			StartPos:   actualPos,
			EndPos:     actualPos + len(query),
		})

		start = actualPos + 1
	}

	return matches
}

func searchRegex(line, pattern string, caseSensitive bool, lineNumber int) []models.SearchMatch {
	var matches []models.SearchMatch

	flags := ""
	if !caseSensitive {
		flags = "(?i)"
	}

	regex, err := regexp.Compile(flags + pattern)
	if err != nil {
		return matches // Return empty matches for invalid regex
	}

	allMatches := regex.FindAllStringIndex(line, -1)
	for _, match := range allMatches {
		matches = append(matches, models.SearchMatch{
			LineNumber: lineNumber,
			LineText:   line,
			StartPos:   match[0],
			EndPos:     match[1],
		})
	}

	return matches
}

var ErrFileExists = errors.New("file_exists")

func RenameDocument(oldPath, newPath string) error {
	oldAbs := filepath.Join(getDataDir(), oldPath)
	newAbs := filepath.Join(getDataDir(), newPath)
	// Ensure parent directory for new path exists
	if err := os.MkdirAll(filepath.Dir(newAbs), 0755); err != nil {
		return err
	}
	if _, err := os.Stat(newAbs); err == nil {
		return ErrFileExists
	}
	return os.Rename(oldAbs, newAbs)
}
