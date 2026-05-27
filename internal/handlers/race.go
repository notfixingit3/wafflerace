package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/notfixingit3/wafflerace/internal/templates/pages"
)

type RaceConfig struct {
	Names    []string
	Duration int // seconds
}

func StartRace(c *gin.Context) {
	namesRaw := c.PostForm("names")
	durationStr := c.PostForm("duration")

	if namesRaw == "" {
		c.String(http.StatusBadRequest, "Please enter at least one name")
		return
	}

	// Parse names
	lines := strings.Split(namesRaw, "\n")
	var names []string
	for _, line := range lines {
		name := strings.TrimSpace(line)
		if name != "" {
			names = append(names, name)
		}
	}

	if len(names) == 0 {
		c.String(http.StatusBadRequest, "Please enter at least one name")
		return
	}

	if len(names) > 50 {
		names = names[:50]
	}

	duration := 25
	if d, err := strconv.Atoi(durationStr); err == nil && d >= 10 {
		duration = d
	}

	// Redirect to race view with data in query (simple for now)
	c.Redirect(http.StatusFound, "/race?names="+strings.Join(names, ",")+"&duration="+strconv.Itoa(duration))
}

func ShowRace(c *gin.Context) {
	namesParam := c.Query("names")
	durationStr := c.Query("duration")

	names := strings.Split(namesParam, ",")
	var cleanNames []string
	for _, n := range names {
		if trimmed := strings.TrimSpace(n); trimmed != "" {
			cleanNames = append(cleanNames, trimmed)
		}
	}

	duration := 25
	if d, err := strconv.Atoi(durationStr); err == nil {
		duration = d
	}

	c.Header("Content-Type", "text/html")
	_ = pages.Race(cleanNames, duration).Render(c.Request.Context(), c.Writer)
}
