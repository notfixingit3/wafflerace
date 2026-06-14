package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wafflerace/quack2/backend/internal/chat"
	"github.com/wafflerace/quack2/backend/internal/game"
	"github.com/wafflerace/quack2/backend/internal/hub"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:3000" || origin == ""
	},
}

// controlMsg represents a client control message received over WebSocket.
type controlMsg struct {
	Action string `json:"action"`
}

func main() {
	// Initialize the game engine.
	engine := game.NewEngine(game.Config{BaseVelocity: 5.0, FinishLineZ: 200.0})
	engine.AddDuck("Duck-1")
	engine.AddDuck("Duck-2")
	engine.AddDuck("Duck-3")
	engine.Start()

	// Initialize the WebSocket hub and run it.
	hubInstance := hub.NewHub()
	hubInstance.Run()

	// Initialize the mock chat listener.
	chatCmds := make(chan chat.ChatCommand, 10)
	mockChat := chat.NewMockChat(42, chatCmds)
	mockChat.Start()

	// Forward chat commands to the engine for !boost commands.
	go func() {
		for cmd := range chatCmds {
			if cmd.Type != "!boost" {
				continue
			}
			for _, d := range engine.Ducks() {
				if d.Name == cmd.Target {
					if err := engine.Boost(d.ID); err != nil {
						log.Printf("boost error for %s: %v", cmd.Target, err)
					}
					break
				}
			}
		}
	}()

	// 10Hz ticker: tick the engine and broadcast duck state.
	go func() {
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		for range ticker.C {
			engine.Tick(100 * time.Millisecond)

			ducks := engine.Ducks()
			states := make([]game.DuckState, 0, len(ducks))
			for _, d := range ducks {
				states = append(states, d.ToState())
			}

			jsonBytes, err := json.Marshal(states)
			if err != nil {
				log.Printf("failed to marshal duck states: %v", err)
				continue
			}
			hubInstance.Broadcast(jsonBytes)
		}
	}()

	// HTTP handlers.
	http.HandleFunc("/health", corsMiddleware(healthHandler))
	http.HandleFunc("/ws", corsMiddleware(wsHandler(engine, hubInstance)))

	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// healthHandler responds with a simple JSON health check.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok"}`))
}

// wsHandler upgrades HTTP to WebSocket and processes client control messages.
func wsHandler(engine *game.Engine, hubInstance *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("websocket upgrade error: %v", err)
			return
		}

		hubInstance.Register(conn)

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}

			var cm controlMsg
			if err := json.Unmarshal(msg, &cm); err != nil {
				continue
			}

			switch cm.Action {
			case "spawn":
				engine.AddDuck(fmt.Sprintf("Duck-%d", len(engine.Ducks())+1))
			case "remove":
				if id := lastDuckID(engine); id != "" {
					engine.RemoveDuck(id)
				}
			case "start":
				engine.Start()
			case "pause":
				engine.Pause()
			case "reset":
				engine.ResetRace()
			}
		}
	}
}

// lastDuckID returns the ID of the duck with the highest numeric suffix.
func lastDuckID(engine *game.Engine) string {
	var lastID string
	var lastNum int
	for _, d := range engine.Ducks() {
		parts := strings.Split(d.ID, "-")
		if len(parts) != 2 {
			continue
		}
		n, err := strconv.Atoi(parts[1])
		if err != nil {
			continue
		}
		if n > lastNum {
			lastNum = n
			lastID = d.ID
		}
	}
	return lastID
}

// corsMiddleware adds CORS headers for the local frontend origin.
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
