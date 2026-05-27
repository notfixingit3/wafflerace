package handlers

import (
	"net/http"
	"sort"
	"strconv"

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

// GetHistoryAPI returns recent race results with optional limit
func GetHistoryAPI(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	results, err := db.GetRecentResults(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}

// GetStatsAPI returns basic analytics
func GetStatsAPI(c *gin.Context) {
	results, err := db.GetRecentResults(1000) // get a lot for stats
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}

	totalRaces := len(results)
	if totalRaces == 0 {
		c.JSON(http.StatusOK, gin.H{
			"total_races": 0,
			"avg_duration": 0,
			"top_winners": []interface{}{},
		})
		return
	}

	var totalDuration int
	winnerCount := make(map[string]int)

	for _, r := range results {
		totalDuration += r.Duration
		winnerCount[r.WinnerName]++
	}

	avgDuration := float64(totalDuration) / float64(totalRaces)

	// Top 5 winners
	type winnerStat struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	var topWinners []winnerStat
	for name, count := range winnerCount {
		topWinners = append(topWinners, winnerStat{Name: name, Count: count})
	}
	// Sort by count desc
	sort.Slice(topWinners, func(i, j int) bool {
		return topWinners[i].Count > topWinners[j].Count
	})
	if len(topWinners) > 5 {
		topWinners = topWinners[:5]
	}

	c.JSON(http.StatusOK, gin.H{
		"total_races":  totalRaces,
		"avg_duration": avgDuration,
		"top_winners":  topWinners,
	})
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