package db

import (
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Init() error {
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0750); err != nil {
		return err
	}

	dbPath := filepath.Join(dataDir, "wafflerace.db")

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// Enable foreign keys and WAL mode for better concurrency
	if _, err := DB.Exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"); err != nil {
		return err
	}

	return migrate()
}

func migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS races (
		id TEXT PRIMARY KEY,
		created_at DATETIME NOT NULL,
		duration INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'created'
	);

	CREATE TABLE IF NOT EXISTS race_participants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		race_id TEXT NOT NULL,
		name TEXT NOT NULL,
		FOREIGN KEY(race_id) REFERENCES races(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS race_results (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		race_id TEXT NOT NULL UNIQUE,
		winner_name TEXT NOT NULL,
		finished_at DATETIME NOT NULL,
		FOREIGN KEY(race_id) REFERENCES races(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_race_results_finished_at ON race_results(finished_at DESC);

	CREATE TABLE IF NOT EXISTS saved_name_lists (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		names TEXT NOT NULL, -- JSON array
		created_at DATETIME NOT NULL
	);
	`

	_, err := DB.Exec(schema)
	return err
}

// === Saved Name Lists ===

type SavedList struct {
	ID        string
	Name      string
	Names     []string
	CreatedAt time.Time
}

func SaveNameList(name string, names []string) (string, error) {
	id := "list-" + time.Now().Format("20060102150405")
	now := time.Now().UTC()

	namesJSON, _ := json.Marshal(names)

	_, err := DB.Exec(
		"INSERT INTO saved_name_lists (id, name, names, created_at) VALUES (?, ?, ?, ?)",
		id, name, string(namesJSON), now,
	)
	return id, err
}

func GetSavedLists() ([]SavedList, error) {
	rows, err := DB.Query("SELECT id, name, names, created_at FROM saved_name_lists ORDER BY created_at DESC LIMIT 50")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lists []SavedList
	for rows.Next() {
		var l SavedList
		var namesJSON string
		if err := rows.Scan(&l.ID, &l.Name, &namesJSON, &l.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal([]byte(namesJSON), &l.Names)
		lists = append(lists, l)
	}
	return lists, nil
}

// Race represents a race session
type Race struct {
	ID        string
	CreatedAt time.Time
	Duration  int
	Status    string
}

// CreateRace creates a new race and its participants
func CreateRace(duration int, names []string) (string, error) {
	id := generateID()
	now := time.Now().UTC()

	tx, err := DB.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		"INSERT INTO races (id, created_at, duration, status) VALUES (?, ?, ?, 'created')",
		id, now, duration,
	)
	if err != nil {
		return "", err
	}

	stmt, err := tx.Prepare("INSERT INTO race_participants (race_id, name) VALUES (?, ?)")
	if err != nil {
		return "", err
	}
	defer stmt.Close()

	for _, name := range names {
		if _, err := stmt.Exec(id, name); err != nil {
			return "", err
		}
	}

	return id, tx.Commit()
}

// SaveResult records the final result of a race
func SaveResult(raceID, winnerName string) error {
	now := time.Now().UTC()

	_, err := DB.Exec(
		`INSERT INTO race_results (race_id, winner_name, finished_at) 
		 VALUES (?, ?, ?)
		 ON CONFLICT(race_id) DO UPDATE SET winner_name = ?, finished_at = ?`,
		raceID, winnerName, now, winnerName, now,
	)
	if err != nil {
		return err
	}

	_, err = DB.Exec("UPDATE races SET status = 'finished' WHERE id = ?", raceID)
	return err
}

// GetRecentResults returns the most recent race results
func GetRecentResults(limit int) ([]RaceResult, error) {
	rows, err := DB.Query(`
		SELECT r.id, r.created_at, r.duration, res.winner_name, res.finished_at
		FROM race_results res
		JOIN races r ON r.id = res.race_id
		ORDER BY res.finished_at DESC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []RaceResult
	for rows.Next() {
		var res RaceResult
		if err := rows.Scan(&res.ID, &res.CreatedAt, &res.Duration, &res.WinnerName, &res.FinishedAt); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}

type RaceResult struct {
	ID         string
	CreatedAt  time.Time
	Duration   int
	WinnerName string
	FinishedAt time.Time
}

func generateID() string {
	// Simple ID for now - good enough for v0.1.x
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(1 * time.Nanosecond) // poor man's randomness
	}
	return string(b)
}

// Close closes the database connection
func Close() {
	if DB != nil {
		if err := DB.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}
}