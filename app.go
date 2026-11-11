package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"unicode"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                   context.Context
	songsDir              string
	biblesDir             string
	backgroundsDir        string
	background            string
	bibles                []*BibleVersion
	biblesMap             map[string]*BibleVersion
	configFile            string
	presentation          bool
	presentationCmd       *exec.Cmd
	presentationMu        sync.Mutex
	presentationStateFile string
	presentationBgFile    string
}

// NewApp creates a new App application struct.
// When presentation is true the app runs as the read-only projection window.
func NewApp(presentation bool) *App {
	return &App{
		bibles:                []*BibleVersion{},
		biblesMap:             map[string]*BibleVersion{},
		backgroundsDir:        "backgrounds",
		configFile:            "openlyric-config.json",
		presentation:          presentation,
		presentationStateFile: "openlyric-presentation.json",
		presentationBgFile:    "openlyric-presentation-bg.txt",
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods.
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

	// Presentation window: only place it on the second monitor. It does not
	// load songs/bibles nor spawn another presentation window.
	if a.presentation {
		a.openViewerOnSecondMonitor(ctx)
		return
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

	// Clear stale projection state from a previous run. The frontend writes the
	// current state (and background) as soon as it finishes loading.
	_ = os.Remove(a.presentationStateFile)
	_ = os.Remove(a.presentationBgFile)

	// Open the presentation window on the second monitor when available.
	a.ensurePresentationWindow()
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

// openViewerOnSecondMonitor positions the presentation window on the first
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

// PresentationState is the content currently shown in the projection window.
// The background is kept in a separate file because it can be several MB and
// should not be rewritten on every lyric/verse change.
type PresentationState struct {
	Title             string `json:"title"`
	Text              string `json:"text"`
	BackgroundVersion int64  `json:"backgroundVersion"`
}

// presentationFlag is passed to the child process that renders the projection.
const presentationFlag = "--presentation"

// ensurePresentationWindow starts a second process that renders the projection
// window when a second monitor is available. Wails v2 has no multi-window API,
// so the projection runs in its own process and reads the shared state file.
func (a *App) ensurePresentationWindow() {
	if a.presentation {
		return
	}

	a.presentationMu.Lock()
	defer a.presentationMu.Unlock()

	if a.presentationCmd != nil {
		return
	}

	screens, err := runtime.ScreenGetAll(a.ctx)
	if err != nil || len(screens) < 2 {
		return
	}

	executable, err := os.Executable()
	if err != nil {
		println("Error locating executable:", err.Error())
		return
	}

	cmd := exec.Command(executable, presentationFlag)
	cmd.Env = append(os.Environ(), "OPENLYRIC_PRESENTATION=1")
	if err := cmd.Start(); err != nil {
		println("Error starting presentation window:", err.Error())
		return
	}

	a.presentationCmd = cmd
	go func(c *exec.Cmd) {
		_ = c.Wait()
		a.presentationMu.Lock()
		if a.presentationCmd == c {
			a.presentationCmd = nil
		}
		a.presentationMu.Unlock()
	}(cmd)
}

// EnsurePresentation checks for a second monitor and starts the presentation
// process if it is not running yet. It is used by the "Retry detection" button.
func (a *App) EnsurePresentation() (bool, error) {
	if a.presentation {
		return true, nil
	}

	screens, err := runtime.ScreenGetAll(a.ctx)
	if err != nil {
		return false, err
	}
	if len(screens) < 2 {
		return false, nil
	}

	a.ensurePresentationWindow()
	return true, nil
}

// shutdown stops the presentation process when the control window closes.
func (a *App) shutdown(ctx context.Context) {
	a.presentationMu.Lock()
	cmd := a.presentationCmd
	a.presentationCmd = nil
	a.presentationMu.Unlock()

	if cmd != nil && cmd.Process != nil {
		_ = cmd.Process.Kill()
	}
}

// GetPresentationMode tells the frontend whether this process is the projection window.
func (a *App) GetPresentationMode() bool {
	return a.presentation
}

// UpdatePresentation stores the current text to project. It is intentionally
// small so it can be written on every lyric/verse change.
func (a *App) UpdatePresentation(title string, text string) error {
	state := PresentationState{
		Title: title,
		Text:  text,
	}

	data, err := json.Marshal(state)
	if err != nil {
		return err
	}

	tmpFile := a.presentationStateFile + ".tmp"
	if err := os.WriteFile(tmpFile, data, 0644); err != nil {
		return err
	}

	return os.Rename(tmpFile, a.presentationStateFile)
}

// UpdatePresentationBackground stores the projection background. It is only
// called when the background changes.
func (a *App) UpdatePresentationBackground(background string) error {
	tmpFile := a.presentationBgFile + ".tmp"
	if err := os.WriteFile(tmpFile, []byte(background), 0644); err != nil {
		return err
	}

	return os.Rename(tmpFile, a.presentationBgFile)
}

// GetPresentationState returns the latest content written by the control window.
// BackgroundVersion changes whenever the background file is rewritten.
func (a *App) GetPresentationState() (PresentationState, error) {
	state := PresentationState{}

	data, err := os.ReadFile(a.presentationStateFile)
	if err != nil {
		if !os.IsNotExist(err) {
			return state, err
		}
	} else if err := json.Unmarshal(data, &state); err != nil {
		return state, err
	}

	if info, err := os.Stat(a.presentationBgFile); err == nil {
		state.BackgroundVersion = info.ModTime().UnixNano()
	}

	return state, nil
}

// GetPresentationBackground returns the data URL currently used as background.
func (a *App) GetPresentationBackground() (string, error) {
	data, err := os.ReadFile(a.presentationBgFile)
	if err != nil {
		if os.IsNotExist(err) {
			return a.background, nil
		}
		return "", err
	}

	if len(data) == 0 {
		return "", nil
	}

	return string(data), nil
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
// converts it to a data URL and persists it. It returns the data URL so the frontend can
// display the image without depending on filesystem paths.
func (a *App) SetBackgroundFromFile(filename string) (string, error) {
	filename = filepath.Base(strings.TrimSpace(filename))
	if filename == "" || filename == "." || filename == string(filepath.Separator) {
		return "", fmt.Errorf("invalid background filename")
	}

	path := filepath.Join(a.backgroundsDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
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
	if err := a.saveConfig(); err != nil {
		return "", err
	}

	return dataUrl, nil
}

// donationURL is the page opened from the donations section in Options.
const donationURL = "https://github.com/sponsors/derikgm"

// OpenDonationPage opens the project's donation page in the default browser.
func (a *App) OpenDonationPage() {
	runtime.BrowserOpenURL(a.ctx, donationURL)
}

// GetScreens returns the list of monitors (screens) available.
func (a *App) GetScreens() ([]runtime.Screen, error) {
	return runtime.ScreenGetAll(a.ctx)
}

// HasSecondMonitor returns true when more than one monitor is detected.
// OpenLyric requires a second monitor to project lyrics; without it,
// the app should warn the user instead of going fullscreen on the only screen.
func (a *App) HasSecondMonitor() (bool, error) {
	screens, err := runtime.ScreenGetAll(a.ctx)
	if err != nil {
		return false, err
	}
	return len(screens) >= 2, nil
}
