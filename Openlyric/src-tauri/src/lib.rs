use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, PhysicalPosition, PhysicalSize, State};

// ---------------------------------------------------------------------------
// Modelos
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub lyrics: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub background: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    #[serde(rename = "verseNumbers")]
    pub verse_numbers: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleVerse {
    pub chapter: i32,
    pub verse: i32,
    #[serde(default)]
    pub name: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleChapter {
    pub chapter: i32,
    pub name: String,
    #[serde(default)]
    pub verses: Vec<BibleVerse>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleBook {
    pub nr: i32,
    pub name: String,
    #[serde(default)]
    pub chapters: Vec<BibleChapter>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct BibleVersion {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub translation: String,
    #[serde(default)]
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

#[derive(Debug, Serialize, Deserialize, Default)]
struct ConfigFile {
    #[serde(default)]
    background: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScreenInfo {
    pub is_primary: bool,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

// ---------------------------------------------------------------------------
// Estado de la aplicacion
// ---------------------------------------------------------------------------

pub struct AppState {
    songs_dir: PathBuf,
    bibles_dir: PathBuf,
    config_file: PathBuf,
    background: Mutex<String>,
    bibles: Mutex<Vec<BibleVersion>>,
}

impl AppState {
    fn new(base: PathBuf) -> Self {
        Self {
            songs_dir: base.join("songs"),
            bibles_dir: base.join("bibles"),
            config_file: base.join("openlyric-config.json"),
            background: Mutex::new(String::new()),
            bibles: Mutex::new(Vec::new()),
        }
    }

    fn ensure_dirs(&self) -> Result<(), String> {
        fs::create_dir_all(&self.songs_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(&self.bibles_dir).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn load_config(&self) -> Result<(), String> {
        let data = match fs::read_to_string(&self.config_file) {
            Ok(d) => d,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
            Err(e) => return Err(e.to_string()),
        };
        let cfg: ConfigFile = serde_json::from_str(&data).map_err(|e| e.to_string())?;
        if cfg.background.starts_with("data:image/") {
            *self.background.lock().map_err(|_| "lock poisoned")? = cfg.background;
        }
        Ok(())
    }

    fn save_config(&self) -> Result<(), String> {
        let bg = self.background.lock().map_err(|_| "lock poisoned")?.clone();
        let cfg = ConfigFile { background: bg };
        let data = serde_json::to_string(&cfg).map_err(|e| e.to_string())?;
        fs::write(&self.config_file, data).map_err(|e| e.to_string())
    }
}

// ---------------------------------------------------------------------------
// Resolucion del directorio de datos (songs/, bibles/, config)
// ---------------------------------------------------------------------------

fn has_data(dir: &Path) -> bool {
    dir.join("songs").is_dir()
        || dir.join("bibles").is_dir()
        || dir.join("openlyric-config.json").is_file()
}

/// Busca un directorio de datos válido:
/// 1. Variable de entorno OPENLYRIC_DATA_DIR.
/// 2. Directorio de trabajo actual o sus ancestros.
/// 3. Directorio del ejecutable o sus ancestros.
/// Si no encuentra ninguno, usa el directorio de trabajo actual.
fn resolve_base_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("OPENLYRIC_DATA_DIR") {
        let path = PathBuf::from(dir);
        if path.is_dir() {
            return path;
        }
    }

    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if has_data(&cwd) {
        return cwd.clone();
    }

    let mut current = Some(cwd.as_path());
    while let Some(dir) = current {
        if has_data(dir) {
            return dir.to_path_buf();
        }
        current = dir.parent();
    }

    if let Ok(exe) = std::env::current_exe() {
        let mut current = exe.parent();
        while let Some(dir) = current {
            if has_data(dir) {
                return dir.to_path_buf();
            }
            current = dir.parent();
        }
    }

    cwd
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct SongJson {
    #[serde(default)]
    title: String,
    #[serde(default)]
    artist: String,
    #[serde(default)]
    lyrics: String,
    #[serde(default)]
    background: String,
}

#[derive(Debug, Deserialize)]
struct SongXml {
    #[serde(default)]
    title: String,
    #[serde(default)]
    artist: String,
    #[serde(default)]
    lyrics: String,
    #[serde(default)]
    background: String,
}

fn parse_song_file(path: &Path) -> Result<Song, String> {
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "json" => parse_json_song(path),
        "xml" => parse_xml_song(path),
        "txt" => parse_txt_song(path),
        _ => Err(format!("unsupported song file format: {ext}")),
    }
}

fn parse_json_song(path: &Path) -> Result<Song, String> {
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let raw: SongJson =
        serde_json::from_str(&data).map_err(|e| format!("invalid JSON song file: {e}"))?;
    Ok(Song {
        id: String::new(),
        title: raw.title,
        artist: raw.artist,
        lyrics: raw.lyrics,
        background: raw.background,
        verse_numbers: vec![],
    })
}

fn parse_xml_song(path: &Path) -> Result<Song, String> {
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let raw: SongXml =
        quick_xml::de::from_str(&data).map_err(|e| format!("invalid XML song file: {e}"))?;
    Ok(Song {
        id: String::new(),
        title: raw.title,
        artist: raw.artist,
        lyrics: raw.lyrics,
        background: raw.background,
        verse_numbers: vec![],
    })
}

fn strip_prefix_i(s: &str, prefix: &str) -> Option<String> {
    let lower = s.to_lowercase();
    if lower.starts_with(prefix) {
        Some(s[prefix.len()..].trim().to_string())
    } else {
        None
    }
}

fn parse_txt_song(path: &Path) -> Result<Song, String> {
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut song = Song::default();
    let mut lyrics_lines: Vec<String> = Vec::new();

    for line in data.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let key = line.to_lowercase();
        if key.starts_with("title:") {
            song.title = line["Title:".len()..].trim().to_string();
        } else if let Some(v) = strip_prefix_i(line, "artist:") {
            song.artist = v;
        } else if let Some(v) = strip_prefix_i(line, "artista:") {
            song.artist = v;
        } else if key.starts_with("background:") {
            song.background = line["Background:".len()..].trim().to_string();
        } else {
            lyrics_lines.push(line.to_string());
        }
    }

    song.lyrics = lyrics_lines.join("\n");
    Ok(song)
}

fn parse_bible_file(path: &Path) -> Result<BibleVersion, String> {
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut version: BibleVersion =
        serde_json::from_str(&data).map_err(|e| format!("invalid Bible JSON file: {e}"))?;
    if version.abbreviation.is_empty() {
        version.abbreviation = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
    }
    if version.translation.is_empty() {
        version.translation = version.abbreviation.clone();
    }
    Ok(version)
}

// ---------------------------------------------------------------------------
// Comandos Tauri
// ---------------------------------------------------------------------------

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello {name}, It's show time!")
}

#[tauri::command]
fn load_songs(state: State<'_, AppState>) -> Result<Vec<Song>, String> {
    let entries = match fs::read_dir(&state.songs_dir) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(e.to_string()),
    };

    let mut songs = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "txt" && ext != "xml" && ext != "json" {
            continue;
        }
        let mut song = parse_song_file(&path)?;
        song.id = entry.file_name().to_string_lossy().to_string();
        songs.push(song);
    }

    songs.sort_by(|a, b| a.id.to_lowercase().cmp(&b.id.to_lowercase()));
    Ok(songs)
}

fn load_bible_versions_inner(state: &AppState) -> Result<Vec<BibleVersion>, String> {
    {
        let cache = state.bibles.lock().map_err(|_| "lock poisoned")?;
        if !cache.is_empty() {
            return Ok(cache.clone());
        }
    }

    let entries = match fs::read_dir(&state.bibles_dir) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(e.to_string()),
    };

    let mut versions = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext != "json" {
            continue;
        }
        let mut version = parse_bible_file(&path)?;
        version.id = entry.file_name().to_string_lossy().to_string();
        versions.push(version);
    }

    versions.sort_by(|a, b| a.id.to_lowercase().cmp(&b.id.to_lowercase()));
    *state.bibles.lock().map_err(|_| "lock poisoned")? = versions.clone();
    Ok(versions)
}

#[tauri::command]
fn load_bible_versions(state: State<'_, AppState>) -> Result<Vec<BibleVersion>, String> {
    load_bible_versions_inner(&state)
}

#[tauri::command]
fn load_bible_songs(
    abbreviation: String,
    state: State<'_, AppState>,
) -> Result<Vec<Song>, String> {
    let versions = load_bible_versions_inner(&state)?;
    let version = versions
        .into_iter()
        .find(|v| v.abbreviation == abbreviation)
        .ok_or_else(|| format!("bible version not found: {abbreviation}"))?;

    let mut songs = Vec::new();
    for book in &version.books {
        for chapter in &book.chapters {
            let mut lyrics = String::new();
            let mut verse_numbers: Vec<i32> = Vec::new();
            for verse in &chapter.verses {
                if verse.text.trim().is_empty() {
                    continue;
                }
                if !lyrics.is_empty() {
                    lyrics.push_str("\n\n");
                }
                lyrics.push_str(&verse.text);
                verse_numbers.push(verse.verse);
            }
            if lyrics.is_empty() {
                continue;
            }
            songs.push(Song {
                id: format!("{}-{}-{}", version.abbreviation, book.nr, chapter.chapter),
                title: chapter.name.clone(),
                artist: version.translation.clone(),
                lyrics,
                background: String::new(),
                verse_numbers,
            });
        }
    }
    Ok(songs)
}

fn slugify(title: &str) -> String {
    let mut slug = String::new();
    for c in title.chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c.to_ascii_lowercase());
        }
    }
    if slug.is_empty() {
        "cancion".to_string()
    } else {
        slug
    }
}

#[tauri::command]
fn create_song(
    title: String,
    artist: String,
    lyrics: String,
    state: State<'_, AppState>,
) -> Result<Song, String> {
    let title = title.trim().to_string();
    if title.is_empty() {
        return Err("song title is required".to_string());
    }

    fs::create_dir_all(&state.songs_dir).map_err(|e| e.to_string())?;

    let slug = slugify(&title);
    let mut filename = format!("{slug}.txt");
    let mut i = 2;
    while state.songs_dir.join(&filename).exists() {
        filename = format!("{slug}-{i}.txt");
        i += 1;
    }

    let content = format!(
        "Title: {}\nArtist: {}\n{}\n",
        title,
        artist.trim(),
        lyrics.trim_end_matches(['\n', '\r'])
    );
    let path = state.songs_dir.join(&filename);
    fs::write(&path, content).map_err(|e| e.to_string())?;

    let mut song = parse_song_file(&path)?;
    song.id = filename;
    Ok(song)
}

#[tauri::command]
fn set_background(background: String, state: State<'_, AppState>) -> Result<(), String> {
    if !background.starts_with("data:image/") {
        return Err(
            "invalid background image: must be a data URL with an image mime type".to_string(),
        );
    }
    *state.background.lock().map_err(|_| "lock poisoned")? = background;
    state.save_config()
}

#[tauri::command]
fn get_background(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state
        .background
        .lock()
        .map_err(|_| "lock poisoned")?
        .clone())
}

#[tauri::command]
fn get_screens(app: tauri::AppHandle) -> Result<Vec<ScreenInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().map_err(|e| e.to_string())?;
    let primary_name = primary.as_ref().and_then(|m| m.name().map(|s| s.to_string()));

    let mut out = Vec::new();
    for monitor in monitors {
        let size = monitor.size();
        let pos = monitor.position();
        let name = monitor.name().map(|s| s.to_string());
        let is_primary = match (&primary_name, &name) {
            (Some(p), Some(n)) => p == n,
            _ => primary
                .as_ref()
                .map(|p| p.position() == monitor.position() && p.size() == monitor.size())
                .unwrap_or(false),
        };
        out.push(ScreenInfo {
            is_primary,
            width: size.width,
            height: size.height,
            x: pos.x,
            y: pos.y,
        });
    }
    Ok(out)
}

fn position_on_secondary_monitor(app: &tauri::AppHandle) {
    let Ok(monitors) = app.available_monitors() else {
        return;
    };
    if monitors.len() < 2 {
        return;
    }
    let Ok(primary) = app.primary_monitor() else {
        return;
    };
    let Some(primary) = primary else {
        return;
    };
    let primary_pos = primary.position();
    let primary_size = primary.size();

    let mut target = None;
    for monitor in &monitors {
        if monitor.position() == primary_pos && monitor.size() == primary_size {
            continue;
        }
        target = Some(monitor.clone());
        break;
    }
    let Some(target) = target else {
        return;
    };

    if let Some(window) = app.get_webview_window("main") {
        let pos = target.position();
        let size = target.size();
        let _ = window.set_fullscreen(false);
        let _ = window.set_position(PhysicalPosition::new(pos.x, pos.y));
        let _ = window.set_size(PhysicalSize::new(size.width, size.height));
        let _ = window.set_fullscreen(true);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let base = resolve_base_dir();
    let state = AppState::new(base);
    let _ = state.ensure_dirs();
    let _ = state.load_config();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
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
        .setup(|app| {
            position_on_secondary_monitor(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn temp_file(name: &str, content: &str) -> PathBuf {
        let dir = std::env::temp_dir().join("openlyric-tests");
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        let mut file = fs::File::create(&path).unwrap();
        file.write_all(content.as_bytes()).unwrap();
        path
    }

    #[test]
    fn parses_txt_song() {
        let path = temp_file(
            "cancion.txt",
            "Title: Mi Canción\nArtista: Juan Pérez\n\nVerso uno aquí.\nVerso dos aquí.\n",
        );
        let song = parse_song_file(&path).unwrap();
        assert_eq!(song.title, "Mi Canción");
        assert_eq!(song.artist, "Juan Pérez");
        assert!(song.lyrics.contains("Verso uno aquí."));
    }

    #[test]
    fn parses_json_song() {
        let path = temp_file(
            "cancion.json",
            r#"{"title":"Mi Canción","artist":"Juan Pérez","lyrics":"Verso uno.\nVerso dos."}"#,
        );
        let song = parse_song_file(&path).unwrap();
        assert_eq!(song.title, "Mi Canción");
        assert_eq!(song.artist, "Juan Pérez");
        assert_eq!(song.lyrics, "Verso uno.\nVerso dos.");
    }

    #[test]
    fn parses_xml_song() {
        let path = temp_file(
            "cancion.xml",
            "<song><title>Mi Canción</title><artist>Juan</artist><lyrics>Hola</lyrics></song>",
        );
        let song = parse_song_file(&path).unwrap();
        assert_eq!(song.title, "Mi Canción");
        assert_eq!(song.artist, "Juan");
        assert_eq!(song.lyrics, "Hola");
    }

    #[test]
    fn parses_bible_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../bibles/valera.json");
        let version = parse_bible_file(&path).unwrap();
        assert_eq!(version.abbreviation, "valera");
        assert_eq!(version.books.len(), 66);
    }

    #[test]
    fn builds_slug() {
        assert_eq!(slugify("Mi Canción!"), "micancin");
        assert_eq!(slugify("¡¡¡"), "cancion");
    }
}
