package main

// Song representa una canción con su letra y el fondo opcional a usar.
type Song struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Artist       string `json:"artist"`
	Lyrics       string `json:"lyrics"`
	Background   string `json:"background"`
	VerseNumbers []int  `json:"verseNumbers"`
}
