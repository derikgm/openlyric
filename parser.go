package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type songJSON struct {
	Title      string `json:"title"`
	Artist     string `json:"artist"`
	Lyrics     string `json:"lyrics"`
	Background string `json:"background"`
}

type songXML struct {
	Title      string `xml:"title"`
	Artist     string `xml:"artist"`
	Lyrics     string `xml:"lyrics"`
	Background string `xml:"background"`
}

// ParseSongFile parses a song file by its extension and returns a Song.
func ParseSongFile(path string) (*Song, error) {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".json":
		return parseJSONSong(path)
	case ".xml":
		return parseXMLSong(path)
	case ".txt":
		return parseTXTSong(path)
	default:
		return nil, fmt.Errorf("unsupported song file format: %s", filepath.Ext(path))
	}
}

func parseJSONSong(path string) (*Song, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var raw songJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("invalid JSON song file: %w", err)
	}

	return &Song{
		Title:      raw.Title,
		Artist:     raw.Artist,
		Lyrics:     raw.Lyrics,
		Background: raw.Background,
	}, nil
}

func parseXMLSong(path string) (*Song, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var raw songXML
	if err := xml.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("invalid XML song file: %w", err)
	}

	return &Song{
		Title:      raw.Title,
		Artist:     raw.Artist,
		Lyrics:     raw.Lyrics,
		Background: raw.Background,
	}, nil
}

func parseTXTSong(path string) (*Song, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	song := &Song{}
	lyrics := []string{}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		key := strings.ToLower(line)
		switch {
		case strings.HasPrefix(key, "title:"):
			song.Title = strings.TrimSpace(strings.TrimPrefix(line, "Title:"))
		case strings.HasPrefix(key, "artist:"):
			song.Artist = stripPrefixI(line, "artist:")
		case strings.HasPrefix(key, "artista:"):
			song.Artist = stripPrefixI(line, "artista:")
		case strings.HasPrefix(key, "background:"):
			song.Background = strings.TrimSpace(strings.TrimPrefix(line, "Background:"))
		default:
			lyrics = append(lyrics, line)
		}
	}

	song.Lyrics = strings.Join(lyrics, "\n")
	return song, nil
}

// stripPrefixI removes the prefix from s case-insensitively.
func stripPrefixI(s, prefix string) string {
	if strings.HasPrefix(strings.ToLower(s), prefix) {
		return strings.TrimSpace(s[len(prefix):])
	}
	return strings.TrimSpace(s)
}
