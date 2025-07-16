package models

type Session struct {
	OpenedFiles    []string `json:"openedFiles"`
	LastActiveFile string   `json:"lastActiveFile"`
	WorkingFolder  string   `json:"workingFolder"`
}
