package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx            context.Context
	songsDir       string
	biblesDir      string
	backgroundsDir string
	background     string
	bibles         []*BibleVersion
	biblesMap      map[string]*BibleVersion
	configFile     string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		bibles:         []*BibleVersion{},
		biblesMap:      map[string]*BibleVersion{},
		backgroundsDir: "backgrounds",
		configFile:     "openlyric-config.json",
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.songsDir = "songs"
	a.biblesDir = "bibles"
	a.bibles = []*BibleVersion{}
	a.biblesMap = map[string]*BibleVersion{}

	// Load the persisted background (if any).
	if err := a.loadConfig(); err != nil {
		println("Error loading config:", err.Error())
	}

	// Ensure the songs, bibles and backgrounds folders exist so users can add content later on.
	if err := os.MkdirAll(a.songsDir, 0755); err != nil {
		println("Error creating songs folder:", err.Error())
	}
	if err := os.MkdirAll(a.biblesDir, 0755); err != nil {
		println("Error creating bibles folder:", err.Error())
	}
	if err := os.MkdirAll(a.backgroundsDir, 0755); err != nil {
		println("Error creating backgrounds folder:", err.Error())
	}

	// Open the lyrics viewer on the second monitor when one is available.
	a.openViewerOnSecondMonitor(ctx)
}

// loadConfig reads the persisted background from the config file.
func (a *App) loadConfig() error {
	data, err := os.ReadFile(a.configFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var config struct {
		Background string `json:"background"`
	}
	if err := json.Unmarshal(data, &config); err != nil {
		return err
	}

	if strings.HasPrefix(config.Background, "data:image/") {
		a.background = config.Background
	}

	return nil
}

// saveConfig persists the background into the config file.
func (a *App) saveConfig() error {
	data, err := json.Marshal(map[string]string{"background": a.background})
	if err != nil {
		return err
	}

	return os.WriteFile(a.configFile, data, 0644)
}

// openViewerOnSecondMonitor positions the window on the first
// non-primary screen (the second monitor) when more than one exists.
func (a *App) openViewerOnSecondMonitor(ctx context.Context) {
	screens, err := runtime.ScreenGetAll(ctx)
	if err != nil || len(screens) < 2 {
		// Single monitor: the fullscreen window is fine.
		return
	}

	primaryIndex := -1
	for i := range screens {
		if screens[i].IsPrimary {
			primaryIndex = i
			break
		}
	}

	var target *runtime.Screen
	for i := range screens {
		if screens[i].IsPrimary {
			continue
		}
		target = &screens[i]
		break
	}

	if target == nil || primaryIndex < 0 {
		return
	}

	runtime.WindowSetSize(ctx, target.Size.Width, target.Size.Height)
	runtime.WindowSetPosition(ctx, screens[primaryIndex].Size.Width, 0)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// LoadSongs reads all supported song files from the songs directory.
func (a *App) LoadSongs() ([]*Song, error) {
	entries, err := os.ReadDir(a.songsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []*Song{}, nil
		}
		return nil, err
	}

	songs := []*Song{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".txt" && ext != ".xml" && ext != ".json" {
			continue
		}

		song, err := ParseSongFile(filepath.Join(a.songsDir, entry.Name()))
		if err != nil {
			return nil, err
		}

		song.ID = entry.Name()
		songs = append(songs, song)
	}

	return songs, nil
}

// LoadBibleVersions returns all the Bible versions available in the bibles directory.
func (a *App) LoadBibleVersions() ([]*BibleVersion, error) {
	if len(a.bibles) > 0 {
		return a.bibles, nil
	}

	entries, err := os.ReadDir(a.biblesDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []*BibleVersion{}, nil
		}
		return nil, err
	}

	versions := []*BibleVersion{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if strings.ToLower(filepath.Ext(entry.Name())) != ".json" {
			continue
		}

		version, err := ParseBibleFile(filepath.Join(a.biblesDir, entry.Name()))
		if err != nil {
			return nil, err
		}
		version.ID = entry.Name()

		if a.biblesMap == nil {
			a.biblesMap = map[string]*BibleVersion{}
		}
		a.biblesMap[version.Abbreviation] = version
		versions = append(versions, version)
	}

	a.bibles = versions
	return versions, nil
}

// LoadBibleSongs returns the songs (chapters) of a given Bible version, for example the songs of Reina-Valera 1909.
func (a *App) LoadBibleSongs(abbreviation string) ([]*Song, error) {
	versions, err := a.LoadBibleVersions()
	if err != nil {
		return nil, err
	}

	var version *BibleVersion
	for _, v := range versions {
		if v.Abbreviation == abbreviation {
			version = v
			break
		}
	}

	if version == nil {
		return []*Song{}, fmt.Errorf("bible version not found: %s", abbreviation)
	}

	songs := []*Song{}
	for _, book := range version.Books {
		for _, chapter := range book.Chapters {
			lyrics := ""
			verseNumbers := []int{}

			for _, verse := range chapter.Verses {
				if strings.TrimSpace(verse.Text) == "" {
					continue
				}

				if lyrics != "" {
					lyrics += "\n\n"
				}
				lyrics += verse.Text
				verseNumbers = append(verseNumbers, verse.Verse)
			}

			if lyrics == "" {
				continue
			}

			songs = append(songs, &Song{
				ID:           fmt.Sprintf("%s-%d-%d", version.Abbreviation, book.Nr, chapter.Chapter),
				Title:        chapter.Name,
				Artist:       version.Translation,
				Lyrics:       lyrics,
				VerseNumbers: verseNumbers,
			})
		}
	}

	return songs, nil
}

// CreateSong creates a new song from a title, an artist and its lyrics,
// saving it into the songs directory as a .txt file.
func (a *App) CreateSong(title string, artist string, lyrics string) (*Song, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, fmt.Errorf("song title is required")
	}

	slug := strings.Map(func(r rune) rune {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'):
			return r
		case (r >= 'A' && r <= 'Z'):
			return unicode.ToLower(r)
		default:
			return -1
		}
	}, title)
	if slug == "" {
		slug = "cancion"
	}

	filename := slug + ".txt"
	for i := 2; ; i++ {
		if _, err := os.Stat(filepath.Join(a.songsDir, filename)); os.IsNotExist(err) {
			break
		}
		filename = fmt.Sprintf("%s-%d.txt", slug, i)
	}

	content := fmt.Sprintf("Title: %s\nArtist: %s\n%s\n", title, artist, strings.TrimRight(strings.TrimSpace(lyrics), "\n"))
	if err := os.WriteFile(filepath.Join(a.songsDir, filename), []byte(content), 0644); err != nil {
		return nil, err
	}

	song, err := ParseSongFile(filepath.Join(a.songsDir, filename))
	if err != nil {
		return nil, err
	}
	song.ID = filename

	return song, nil
}

// SetBackground stores the background image (data URL) selected by the user and persists it.
func (a *App) SetBackground(background string) error {
	if !strings.HasPrefix(background, "data:image/") {
		return fmt.Errorf("invalid background image: must be a data URL with an image mime type")
	}

	a.background = background
	return a.saveConfig()
}

// GetBackground returns the background image (data URL) persisted by the user.
func (a *App) GetBackground() string {
	return a.background
}

// LoadBackgrounds returns the list of image files available in the backgrounds directory.
func (a *App) LoadBackgrounds() ([]string, error) {
	entries, err := os.ReadDir(a.backgroundsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}

	images := []string{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" && ext != ".gif" {
			continue
		}

		images = append(images, entry.Name())
	}

	return images, nil
}

// SetBackgroundFromFile sets the background from an image file located in the backgrounds folder,
// converts it to a data URL and persists it.
func (a *App) SetBackgroundFromFile(filename string) error {
	path := filepath.Join(a.backgroundsDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	ext := strings.ToLower(filepath.Ext(filename))
	var mime string
	switch ext {
	case ".jpg", ".jpeg":
		mime = "image/jpeg"
	case ".png":
		mime = "image/png"
	case ".webp":
		mime = "image/webp"
	case ".gif":
		mime = "image/gif"
	default:
		mime = "application/octet-stream"
	}

	dataUrl := "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(data)
	a.background = dataUrl
	return a.saveConfig()
}

// GetScreens returns the list of monitors (screens) available.
func (a *App) GetScreens() ([]runtime.Screen, error) {
	return runtime.ScreenGetAll(a.ctx)
}
