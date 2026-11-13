use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub lyrics: String,
    #[serde(default)]
    pub background: String,
    #[serde(default, rename = "verseNumbers")]
    pub verse_numbers: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleVerse {
    pub chapter: i32,
    pub verse: i32,
    pub name: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleChapter {
    pub chapter: i32,
    pub name: String,
    pub verses: Vec<BibleVerse>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleBook {
    pub nr: i32,
    pub name: String,
    pub chapters: Vec<BibleChapter>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleVersion {
    pub id: String,
    pub translation: String,
    pub abbreviation: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub language: String,
    #[serde(default)]
    pub direction: String,
    #[serde(default)]
    pub encoding: String,
    #[serde(default, rename = "distribution_version")]
    pub distribution_version: String,
    #[serde(default, rename = "distribution_abbreviation")]
    pub distribution_abbreviation: String,
    #[serde(default)]
    pub books: Vec<BibleBook>,
}

fn base_dir() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello {}, It's show time!", name)
}

#[tauri::command]
fn load_songs() -> Result<Vec<Song>, String> {
    // TODO: implement parsing from songs/
    Ok(vec![])
}

#[tauri::command]
fn load_bible_versions() -> Result<Vec<BibleVersion>, String> {
    // TODO: implement parsing from bibles/
    Ok(vec![])
}

#[tauri::command]
fn load_bible_songs(_abbreviation: String) -> Result<Vec<Song>, String> {
    // TODO: implement
    Ok(vec![])
}

#[tauri::command]
fn create_song(_title: String, _artist: String, _lyrics: String) -> Result<Song, String> {
    Err("Not implemented yet".into())
}

#[tauri::command]
fn set_background(_background: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn get_background() -> Result<String, String> {
    Ok(String::new())
}

#[tauri::command]
fn get_screens() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_songs,
            load_bible_versions,
            load_bible_songs,
            create_song,
            set_background,
            get_background,
            get_screens
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
