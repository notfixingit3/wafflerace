package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/notfixingit3/wafflerace/internal/handlers"
	"github.com/notfixingit3/wafflerace/internal/templates/pages"
)

func main() {
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

	// Race
	router.POST("/race", handlers.StartRace)
	router.GET("/race", handlers.ShowRace)

	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	log.Printf("Wafflerace starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
