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

type SearchRequest struct {
	Query         string `json:"query" binding:"required"`
	SearchMode    string `json:"searchMode" binding:"required"` // "plain" or "regex"
	CaseSensitive bool   `json:"caseSensitive"`
	SearchFolder  string `json:"searchFolder"` // relative path from root
}

type SearchMatch struct {
	LineNumber int    `json:"lineNumber"`
	LineText   string `json:"lineText"`
	StartPos   int    `json:"startPos"`
	EndPos     int    `json:"endPos"`
}

type SearchResult struct {
	FilePath string        `json:"filePath"`
	Matches  []SearchMatch `json:"matches"`
}
