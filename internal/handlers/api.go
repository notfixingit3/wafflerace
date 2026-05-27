package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/notfixingit3/wafflerace/internal/db"
)

// CreateRaceRequest represents the payload to create a new race
type CreateRaceRequest struct {
	Names    []string `json:"names" binding:"required,min=1,max=50"`
	Duration int      `json:"duration" binding:"required,min=10,max=300"`
}

// CreateRaceResponse returns the created race ID
type CreateRaceResponse struct {
	ID string `json:"id"`
}

// CreateRaceAPI creates a new race session and stores participants
func CreateRaceAPI(c *gin.Context) {
	var req CreateRaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := db.CreateRace(req.Duration, req.Names)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create race"})
		return
	}

	c.JSON(http.StatusCreated, CreateRaceResponse{ID: id})
}

// GetHistoryAPI returns recent race results
func GetHistoryAPI(c *gin.Context) {
	results, err := db.GetRecentResults(20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}

// SaveResultRequest is used when a race finishes
type SaveResultRequest struct {
	RaceID     string `json:"race_id" binding:"required"`
	WinnerName string `json:"winner_name" binding:"required"`
}

// SaveResultAPI records the winner of a completed race
func SaveResultAPI(c *gin.Context) {
	var req SaveResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.SaveResult(req.RaceID, req.WinnerName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save result"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "saved"})
}