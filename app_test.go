package main

import (
	"os"
	"path/filepath"
	"testing"
)

func writeTempSongFile(t *testing.T, name, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("could not write temp file: %v", err)
	}
	return path
}

func TestParseTXTSong(t *testing.T) {
	path := writeTempSongFile(t, "cancion.txt", "Title: Mi Canción\nArtista: Juan Pérez\n\nVerso uno aquí.\nVerso dos aquí.\n")

	song, err := ParseSongFile(path)
	if err != nil {
		t.Fatalf("error parsing txt: %v", err)
	}

	if song.Title != "Mi Canción" {
		t.Fatalf("unexpected title: %q", song.Title)
	}
	if song.Artist != "Juan Pérez" {
		t.Fatalf("unexpected artist: %q", song.Artist)
	}
	if song.Lyrics == "" {
		t.Fatal("expected non-empty lyrics")
	}
}

func TestParseJSONSong(t *testing.T) {
	path := writeTempSongFile(t, "cancion.json", `{"title":"Mi Canción","artist":"Juan Pérez","lyrics":"Verso uno aquí.\nVerso dos aquí."}`)

	song, err := ParseSongFile(path)
	if err != nil {
		t.Fatalf("error parsing json: %v", err)
	}

	if song.Title != "Mi Canción" {
		t.Fatalf("unexpected title: %q", song.Title)
	}
	if song.Artist != "Juan Pérez" {
		t.Fatalf("unexpected artist: %q", song.Artist)
	}
	if song.Lyrics == "" {
		t.Fatal("expected non-empty lyrics")
	}
}

func TestParseBibleFile(t *testing.T) {
	version, err := ParseBibleFile("bibles/valera.json")
	if err != nil {
		t.Fatalf("error parsing bible: %v", err)
	}

	if version.Abbreviation != "valera" {
		t.Fatalf("unexpected abbreviation: %q", version.Abbreviation)
	}
	if len(version.Books) != 66 {
		t.Fatalf("unexpected number of books: %d", len(version.Books))
	}
}

func TestLoadBibleSongs(t *testing.T) {
	app := &App{biblesDir: "bibles", biblesMap: map[string]*BibleVersion{}}

	songs, err := app.LoadBibleSongs("valera")
	if err != nil {
		t.Fatalf("error loading bible songs: %v", err)
	}

	if len(songs) == 0 {
		t.Fatal("expected songs")
	}

	if songs[0].Title != "Génesis 1" {
		t.Fatalf("unexpected first song title: %q", songs[0].Title)
	}
	if len(songs[0].VerseNumbers) == 0 {
		t.Fatal("expected verse numbers")
	}
}

func TestLoadBibleSongsNotFound(t *testing.T) {
	app := &App{biblesDir: "bibles", bibles: []*BibleVersion{}, biblesMap: map[string]*BibleVersion{}}

	songs, err := app.LoadBibleSongs("inexistente")
	if err == nil {
		t.Fatal("expected error for missing version")
	}
	if len(songs) != 0 {
		t.Fatal("expected empty song list for missing version")
	}
}

func TestPresentationStateRoundTrip(t *testing.T) {
	dir := t.TempDir()
	app := NewApp(false)
	app.presentationStateFile = filepath.Join(dir, "presentation.json")
	app.presentationBgFile = filepath.Join(dir, "presentation-bg.txt")
	app.background = "data:image/png;base64,AAAA"

	if err := app.UpdatePresentation("Génesis 1", "En el principio creó Dios los cielos y la tierra."); err != nil {
		t.Fatalf("UpdatePresentation: %v", err)
	}

	state, err := app.GetPresentationState()
	if err != nil {
		t.Fatalf("GetPresentationState: %v", err)
	}
	if state.Title != "Génesis 1" {
		t.Fatalf("unexpected title: %q", state.Title)
	}
	if state.Text == "" {
		t.Fatal("expected text")
	}
	if state.BackgroundVersion != 0 {
		t.Fatal("expected no background version before writing the background")
	}

	if err := app.UpdatePresentationBackground("data:image/png;base64,BBBB"); err != nil {
		t.Fatalf("UpdatePresentationBackground: %v", err)
	}

	state, err = app.GetPresentationState()
	if err != nil {
		t.Fatalf("GetPresentationState after background: %v", err)
	}
	if state.BackgroundVersion == 0 {
		t.Fatal("expected a background version after writing the background")
	}

	background, err := app.GetPresentationBackground()
	if err != nil {
		t.Fatalf("GetPresentationBackground: %v", err)
	}
	if background != "data:image/png;base64,BBBB" {
		t.Fatalf("unexpected background: %q", background)
	}
}
