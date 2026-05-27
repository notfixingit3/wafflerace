package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/notfixingit3/wafflerace/internal/db"
	"github.com/notfixingit3/wafflerace/internal/templates/pages"
)

func ShowHistory(c *gin.Context) {
	results, err := db.GetRecentResults(100)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to load history")
		return
	}

	c.Header("Content-Type", "text/html")
	_ = pages.History(results).Render(c.Request.Context(), c.Writer)
}