package db

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"

	"github.com/stretchr/testify/require"
)

// SetupTestDBForHandlers provides an isolated test database for use by
// handler tests in other packages. It replaces the global DB for the
// duration of the test and returns a cleanup function.
//
// This is the recommended way to write DB-dependent handler tests.
func SetupTestDBForHandlers(t *testing.T) func() {
	t.Helper()

	tmpFile := filepath.Join(t.TempDir(), "test-wafflerace.db")

	testDB, err := sql.Open("sqlite", tmpFile)
	require.NoError(t, err)

	_, err = testDB.Exec("PRAGMA foreign_keys = ON;")
	require.NoError(t, err)

	_, err = testDB.Exec(`
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
	`)
	require.NoError(t, err)

	originalDB := DB
	DB = testDB

	return func() {
		if testDB != nil {
			require.NoError(t, testDB.Close())
		}
		DB = originalDB
	}
}
