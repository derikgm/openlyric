package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx        context.Context
	songsDir   string
	biblesDir  string
	background string
	bibles     []*BibleVersion
	biblesMap  map[string]*BibleVersion
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		bibles:    []*BibleVersion{},
		biblesMap: map[string]*BibleVersion{},
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

	// Open the lyrics viewer on the second monitor when one is available.
	a.openViewerOnSecondMonitor(ctx)
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

// SetBackground stores the background image (data URL) selected by the user.
func (a *App) SetBackground(background string) error {
	if !strings.HasPrefix(background, "data:image/") {
		return fmt.Errorf("invalid background image: must be a data URL with an image mime type")
	}

	a.background = background
	return nil
}

// GetScreens returns the list of monitors (screens) available.
func (a *App) GetScreens() ([]runtime.Screen, error) {
	return runtime.ScreenGetAll(a.ctx)
}
