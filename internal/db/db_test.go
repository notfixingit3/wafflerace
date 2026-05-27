package db

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB creates a fresh, isolated SQLite database for the test.
// It uses a temporary file (fast and reliable) and replaces the global DB
// for the duration of the test. Call the returned cleanup function in defer.
func setupTestDB(t *testing.T) (cleanup func()) {
	t.Helper()

	// Create a unique temporary database file for this test
	tmpFile := filepath.Join(t.TempDir(), "test-wafflerace.db")

	testDB, err := sql.Open("sqlite", tmpFile)
	require.NoError(t, err, "failed to open test database")

	// Enable foreign keys
	_, err = testDB.Exec("PRAGMA foreign_keys = ON;")
	require.NoError(t, err)

	// Run migrations on the test DB
	_, err = testDB.Exec(migrateSchema())
	require.NoError(t, err)

	// Save the original DB (if any) and swap in our test DB
	originalDB := DB
	DB = testDB

	cleanup = func() {
		if testDB != nil {
			testDB.Close()
		}
		DB = originalDB
	}

	return cleanup
}

// migrateSchema returns the schema used for tests (kept in sync with production migrate()).
func migrateSchema() string {
	return `
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
		names TEXT NOT NULL,
		created_at DATETIME NOT NULL
	);
	`
}

func TestSaveAndGetSavedLists(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	id, err := SaveNameList("Staff", []string{"Alice", "Bob", "Carol"})
	require.NoError(t, err)
	assert.NotEmpty(t, id)

	lists, err := GetSavedLists()
	require.NoError(t, err)
	assert.Len(t, lists, 1)
	assert.Equal(t, "Staff", lists[0].Name)
	assert.Equal(t, []string{"Alice", "Bob", "Carol"}, lists[0].Names)
}

func TestCreateRaceAndSaveResult(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	names := []string{"Alice", "Bob", "Carol"}
	id, err := CreateRace(45, names)
	require.NoError(t, err)
	assert.NotEmpty(t, id)

	err = SaveResult(id, "Bob")
	require.NoError(t, err)

	results, err := GetRecentResults(10)
	require.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "Bob", results[0].WinnerName)
	assert.Equal(t, 45, results[0].Duration)
}

func TestGetRecentResultsOrdering(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	id1, _ := CreateRace(30, []string{"A"})
	id2, _ := CreateRace(60, []string{"B"})

	SaveResult(id1, "A")
	SaveResult(id2, "B")

	results, err := GetRecentResults(10)
	require.NoError(t, err)
	assert.Len(t, results, 2)
	// Most recent first
	assert.Equal(t, "B", results[0].WinnerName)
}

func TestGetStatsAPI_Data(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	id1, _ := CreateRace(30, []string{"Alice"})
	id2, _ := CreateRace(45, []string{"Bob", "Carol"})
	id3, _ := CreateRace(30, []string{"Alice"})

	SaveResult(id1, "Alice")
	SaveResult(id2, "Bob")
	SaveResult(id3, "Alice")

	results, _ := GetRecentResults(100)
	assert.Len(t, results, 3)
}