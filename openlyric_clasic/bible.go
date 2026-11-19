package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// BibleVerse representa un verso individual de la Biblia.
type BibleVerse struct {
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Name    string `json:"name"`
	Text    string `json:"text"`
}

// BibleChapter representa un capítulo de la Biblia con sus versos.
type BibleChapter struct {
	Chapter int           `json:"chapter"`
	Name    string        `json:"name"`
	Verses  []*BibleVerse `json:"verses"`
}

// BibleBook representa un libro de la Biblia con sus capítulos.
type BibleBook struct {
	Nr       int             `json:"nr"`
	Name     string          `json:"name"`
	Chapters []*BibleChapter `json:"chapters"`
}

// BibleVersion representa una versión/translación de la Biblia (por ejemplo Reina-Valera 1909).
type BibleVersion struct {
	ID                       string       `json:"id"`
	Translation              string       `json:"translation"`
	Abbreviation             string       `json:"abbreviation"`
	Description              string       `json:"description"`
	Language                 string       `json:"language"`
	Direction                string       `json:"direction"`
	Encoding                 string       `json:"encoding"`
	DistributionVersion      string       `json:"distribution_version"`
	DistributionAbbreviation string       `json:"distribution_abbreviation"`
	Books                    []*BibleBook `json:"books"`
}

// ParseBibleFile parses a Bible version JSON file (por ejemplo Reina-Valera) y devuelve la versión.
func ParseBibleFile(path string) (*BibleVersion, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var version BibleVersion
	if err := json.Unmarshal(data, &version); err != nil {
		return nil, fmt.Errorf("invalid Bible JSON file: %w", err)
	}

	if version.Abbreviation == "" {
		version.Abbreviation = strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
	}
	if version.Translation == "" {
		version.Translation = version.Abbreviation
	}

	return &version, nil
}
