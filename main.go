package main

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

const presentationArgument = "--presentation"

// isPresentationMode reports whether this process was launched as the
// projection window instead of the control window.
func isPresentationMode() bool {
	if os.Getenv("OPENLYRIC_PRESENTATION") == "1" {
		return true
	}
	for _, arg := range os.Args[1:] {
		if arg == presentationArgument {
			return true
		}
	}
	return false
}

func main() {
	presentation := isPresentationMode()
	app := NewApp(presentation)

	// The control window lives on the primary monitor. The presentation
	// process starts fullscreen and repositions itself on the second monitor.
	width, height := 1280, 820
	title := "OpenLyric"
	fullscreen := false

	if presentation {
		width, height = 1920, 1080
		title = "OpenLyric — Presentación"
		fullscreen = true
	}

	err := wails.Run(&options.App{
		Title:      title,
		Width:      width,
		Height:     height,
		Fullscreen: fullscreen,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
