package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/notfixingit3/wafflerace/internal/db"
)

func TestStartRace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		formNames      string
		formDuration   string
		expectedStatus int
	}{
		{
			name:           "empty names",
			formNames:      "",
			formDuration:   "20",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "only whitespace names",
			formNames:      "   \n\t\n",
			formDuration:   "15",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			form := url.Values{}
			form.Set("names", tt.formNames)
			form.Set("duration", tt.formDuration)

			req := httptest.NewRequest("POST", "/race", strings.NewReader(form.Encode()))
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			c.Request = req

			_ = c.Request.ParseForm()

			StartRace(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestStartRaceRedirectEscapesNames(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.POST("/race", StartRace)

	w := httptest.NewRecorder()

	form := url.Values{}
	form.Set("names", "O'Brien\nJean-Luc\nMüller")
	form.Set("duration", "45")

	req := httptest.NewRequest("POST", "/race", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusFound, w.Code)

	location := w.Header().Get("Location")
	parsed, err := url.Parse(location)
	require.NoError(t, err)
	assert.Equal(t, "/race", parsed.Path)
	assert.Equal(t, "O'Brien,Jean-Luc,Müller", parsed.Query().Get("names"))
	assert.Equal(t, "45", parsed.Query().Get("duration"))
}

func TestShowRace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/race?names=Alice,Bob&duration=40", nil)

	ShowRace(c)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/html", w.Header().Get("Content-Type"))
	assert.Contains(t, w.Body.String(), "Alice")
	assert.Contains(t, w.Body.String(), "Bob")
}

// === API Handler Table-Driven Tests ===

func TestCreateRaceAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        string
		setupDB        bool
		corruptDB      bool
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "success path",
			payload:        `{"names": ["Alice", "Bob"], "duration": 30}`,
			setupDB:        true,
			expectedStatus: http.StatusCreated,
			expectedBody:   `"id"`,
		},
		{
			name:           "empty names array",
			payload:        `{"names": [], "duration": 30}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "whitespace only names",
			payload:        `{"names": ["   ", "\t"], "duration": 30}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "names too long (max 50)",
			payload:        func() string {
				names := make([]string, 51)
				for i := range names {
					names[i] = "Waffle"
				}
				namesJSON, _ := json.Marshal(names)
				return fmt.Sprintf(`{"names": %s, "duration": 30}`, string(namesJSON))
			}(),
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "duration too low",
			payload:        `{"names": ["Alice"], "duration": 5}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "duration too high",
			payload:        `{"names": ["Alice"], "duration": 500}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid JSON",
			payload:        `{"names": ["Alice", "duration": 30}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "database error path",
			payload:        `{"names": ["Alice"], "duration": 30}`,
			setupDB:        true,
			corruptDB:      true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setupDB {
				cleanup := db.SetupTestDBForHandlers(t)
				defer cleanup()
			}
			if tt.corruptDB {
				db.DB.Close() // Force database error
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("POST", "/api/races", strings.NewReader(tt.payload))
			c.Request.Header.Set("Content-Type", "application/json")

			CreateRaceAPI(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.expectedBody != "" {
				assert.Contains(t, w.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestSaveResultAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		payload        string
		setupDB        bool
		insertRace     bool
		raceID         string
		corruptDB      bool
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "success path",
			payload:        `{"race_id": "race-123", "winner_name": "Alice"}`,
			setupDB:        true,
			insertRace:     true,
			raceID:         "race-123",
			expectedStatus: http.StatusOK,
			expectedBody:   `"status":"saved"`,
		},
		{
			name:           "missing race_id",
			payload:        `{"winner_name": "Alice"}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "whitespace only winner_name",
			payload:        `{"race_id": "race-123", "winner_name": "   "}`,
			setupDB:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "foreign key constraint violation (race doesn't exist)",
			payload:        `{"race_id": "non-existent-race", "winner_name": "Alice"}`,
			setupDB:        true,
			expectedStatus: http.StatusInternalServerError, // SQLite foreign key violation
		},
		{
			name:           "database error path",
			payload:        `{"race_id": "race-123", "winner_name": "Alice"}`,
			setupDB:        true,
			insertRace:     true,
			raceID:         "race-123",
			corruptDB:      true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setupDB {
				cleanup := db.SetupTestDBForHandlers(t)
				defer cleanup()

				if tt.insertRace {
					// We need to create a race first to satisfy foreign key constraint
					_, err := db.DB.Exec(
						"INSERT INTO races (id, created_at, duration, status) VALUES (?, datetime('now'), 30, 'created')",
						tt.raceID,
					)
					require.NoError(t, err)
				}
			}
			if tt.corruptDB {
				db.DB.Close()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("POST", "/api/results", strings.NewReader(tt.payload))
			c.Request.Header.Set("Content-Type", "application/json")

			SaveResultAPI(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.expectedBody != "" {
				assert.Contains(t, w.Body.String(), tt.expectedBody)
			}
		})
	}
}

func TestGetHistoryAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name             string
		queryURL         string
		setupDB          bool
		insertRacesCount int
		corruptDB        bool
		expectedStatus   int
		expectedCount    int
	}{
		{
			name:             "success path default limit",
			queryURL:         "/api/history",
			setupDB:          true,
			insertRacesCount: 5,
			expectedStatus:   http.StatusOK,
			expectedCount:    5,
		},
		{
			name:             "success path custom limit",
			queryURL:         "/api/history?limit=2",
			setupDB:          true,
			insertRacesCount: 5,
			expectedStatus:   http.StatusOK,
			expectedCount:    2,
		},
		{
			name:             "invalid limit defaults to 50",
			queryURL:         "/api/history?limit=-5",
			setupDB:          true,
			insertRacesCount: 3,
			expectedStatus:   http.StatusOK,
			expectedCount:    3,
		},
		{
			name:             "limit out of bounds defaults to 50",
			queryURL:         "/api/history?limit=500", // > 200
			setupDB:          true,
			insertRacesCount: 2,
			expectedStatus:   http.StatusOK,
			expectedCount:    2,
		},
		{
			name:             "limit bad type defaults to 50",
			queryURL:         "/api/history?limit=abc",
			setupDB:          true,
			insertRacesCount: 1,
			expectedStatus:   http.StatusOK,
			expectedCount:    1,
		},
		{
			name:             "database error path",
			queryURL:         "/api/history",
			setupDB:          true,
			corruptDB:        true,
			expectedStatus:   http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setupDB {
				cleanup := db.SetupTestDBForHandlers(t)
				defer cleanup()

				if tt.insertRacesCount > 0 {
					for i := 0; i < tt.insertRacesCount; i++ {
						raceID := fmt.Sprintf("race-%d", i)
						_, err := db.DB.Exec(
							"INSERT INTO races (id, created_at, duration, status) VALUES (?, datetime('now'), 30, 'created')",
							raceID,
						)
						require.NoError(t, err)

						_, err = db.DB.Exec(
							"INSERT INTO race_results (race_id, winner_name, finished_at) VALUES (?, 'Alice', datetime('now'))",
							raceID,
						)
						require.NoError(t, err)
					}
				}
			}
			if tt.corruptDB {
				db.DB.Close()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("GET", tt.queryURL, nil)

			GetHistoryAPI(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.expectedStatus == http.StatusOK {
				var resp map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &resp)
				require.NoError(t, err)
				results := resp["results"].([]interface{})
				assert.Len(t, results, tt.expectedCount)
			}
		})
	}
}

func TestGetStatsAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name            string
		setupDB         bool
		insertRaces     []struct{ raceID, winner string; duration int }
		corruptDB       bool
		expectedStatus  int
		expectedTotal   int
		expectedAvgDur  float64
		expectedWinners []string
	}{
		{
			name:           "empty stats",
			setupDB:        true,
			expectedStatus: http.StatusOK,
			expectedTotal:  0,
			expectedAvgDur: 0,
		},
		{
			name:    "populated stats",
			setupDB: true,
			insertRaces: []struct{ raceID, winner string; duration int }{
				{"r1", "Alice", 30},
				{"r2", "Bob", 40},
				{"r3", "Alice", 50},
			},
			expectedStatus:  http.StatusOK,
			expectedTotal:   3,
			expectedAvgDur:  40,
			expectedWinners: []string{"Alice", "Bob"},
		},
		{
			name:           "database error path",
			setupDB:        true,
			corruptDB:      true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setupDB {
				cleanup := db.SetupTestDBForHandlers(t)
				defer cleanup()

				for _, r := range tt.insertRaces {
					_, err := db.DB.Exec(
						"INSERT INTO races (id, created_at, duration, status) VALUES (?, datetime('now'), ?, 'created')",
						r.raceID, r.duration,
					)
					require.NoError(t, err)

					_, err = db.DB.Exec(
						"INSERT INTO race_results (race_id, winner_name, finished_at) VALUES (?, ?, datetime('now'))",
						r.raceID, r.winner,
					)
					require.NoError(t, err)
				}
			}
			if tt.corruptDB {
				db.DB.Close()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("GET", "/api/stats", nil)

			GetStatsAPI(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.expectedStatus == http.StatusOK {
				var resp map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &resp)
				require.NoError(t, err)

				assert.Equal(t, float64(tt.expectedTotal), resp["total_races"])
				assert.Equal(t, tt.expectedAvgDur, resp["avg_duration"])

				if len(tt.expectedWinners) > 0 {
					winners := resp["top_winners"].([]interface{})
					assert.Equal(t, len(tt.expectedWinners), len(winners))
					firstWinner := winners[0].(map[string]interface{})
					assert.Equal(t, tt.expectedWinners[0], firstWinner["name"])
				}
			}
		})
	}
}
