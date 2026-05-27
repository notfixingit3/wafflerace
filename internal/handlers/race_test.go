package handlers

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
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

			// Force Gin to parse the form
			_ = c.Request.ParseForm()

			StartRace(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
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