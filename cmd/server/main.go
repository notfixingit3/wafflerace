package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/notfixingit3/wafflerace/internal/db"
	"github.com/notfixingit3/wafflerace/internal/handlers"
	"github.com/notfixingit3/wafflerace/internal/templates/pages"
)

func main() {
	// Initialize SQLite database
	if err := db.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Static assets
	router.Static("/static", "./web/static")
	router.Static("/assets", "./assets")

	// Home → Setup page
	router.GET("/", func(c *gin.Context) {
		c.Header("Content-Type", "text/html")
		_ = pages.Setup().Render(c.Request.Context(), c.Writer)
	})

	// Race (legacy flow)
	router.POST("/race", handlers.StartRace)
	router.GET("/race", handlers.ShowRace)

	// History & Analytics
	router.GET("/history", handlers.ShowHistory)

	// API v1 (new backend-driven flow for better scalability)
	api := router.Group("/api")
	{
		api.POST("/races", handlers.CreateRaceAPI)
		api.GET("/history", handlers.GetHistoryAPI)
		api.GET("/stats", handlers.GetStatsAPI)
		api.POST("/results", handlers.SaveResultAPI)
	}

	port := resolvePort()

	log.Printf("Wafflerace starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func resolvePort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "9090"
	}

	parsed, err := strconv.Atoi(port)
	if err != nil || parsed < 1 || parsed > 65535 {
		log.Fatal("Invalid PORT: must be an integer from 1 to 65535")
	}

	return strconv.Itoa(parsed)
}
