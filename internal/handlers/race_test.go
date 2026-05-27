package handlers

import (
	"encoding/json"
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

// === API Validation Tests (no DB required) ===

func TestCreateRaceAPI_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	body := `{"names": [], "duration": 45}`
	req := httptest.NewRequest("POST", "/api/races", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	CreateRaceAPI(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateRaceAPI_RejectsWhitespaceOnlyNames(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	body := `{"names": [" ", "\t"], "duration": 45}`
	req := httptest.NewRequest("POST", "/api/races", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	CreateRaceAPI(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSaveResultAPI_Validation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	saveBody := `{"race_id": "", "winner_name": "Alice"}`
	req := httptest.NewRequest("POST", "/api/results", strings.NewReader(saveBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	SaveResultAPI(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSaveResultAPI_RejectsWhitespaceFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	saveBody := `{"race_id": " ", "winner_name": "\t"}`
	req := httptest.NewRequest("POST", "/api/results", strings.NewReader(saveBody))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	SaveResultAPI(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// === DB-backed handler tests ===

func TestGetHistoryAPI_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cleanup := db.SetupTestDBForHandlers(t)
	defer cleanup()

	id1, _ := db.CreateRace(30, []string{"Alice", "Bob"})
	id2, _ := db.CreateRace(45, []string{"Carol"})
	_ = db.SaveResult(id1, "Alice")
	_ = db.SaveResult(id2, "Carol")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/history", nil)

	GetHistoryAPI(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	results := response["results"].([]interface{})
	assert.Len(t, results, 2)
}

func TestGetStatsAPI_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cleanup := db.SetupTestDBForHandlers(t)
	defer cleanup()

	id1, _ := db.CreateRace(30, []string{"Alice"})
	id2, _ := db.CreateRace(45, []string{"Bob", "Carol"})
	id3, _ := db.CreateRace(30, []string{"Alice"})

	_ = db.SaveResult(id1, "Alice")
	_ = db.SaveResult(id2, "Bob")
	_ = db.SaveResult(id3, "Alice")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/api/stats", nil)

	GetStatsAPI(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, float64(3), response["total_races"])
}
