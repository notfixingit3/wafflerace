package main

import (
	"encoding/json"
	"log"
	"net/http"
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
	// Initialize the game engine. The server starts with zero ducks and the
	// race paused; the frontend control panel owns spawn/start.
	engine := game.NewEngine(game.Config{BaseVelocity: 5.0, FinishLineZ: 200.0})

	// Initialize the WebSocket hub and run it.
	hubInstance := hub.NewHub(engine)
	hubInstance.Run()

	// Initialize the mock chat listener.
	chatCmds := make(chan chat.ChatCommand, 10)
	mockChat := chat.NewMockChat(42, chatCmds, nil)
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

	// 10Hz ticker: tick the engine and broadcast race state.
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

			winner := engine.Winner()
			var winnerState *game.DuckState
			if winner != nil {
				s := winner.ToState()
				winnerState = &s
			}

			payload := map[string]any{
				"ducks":    states,
				"winner":   winnerState,
				"finished": engine.Finished(),
			}

			jsonBytes, err := json.Marshal(payload)
			if err != nil {
				log.Printf("failed to marshal race state: %v", err)
				continue
			}
			hubInstance.Broadcast(jsonBytes)
		}
	}()

	// HTTP handlers.
	http.HandleFunc("/health", corsMiddleware(healthHandler))
	http.HandleFunc("/ws", corsMiddleware(wsHandler(hubInstance)))

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

// wsHandler upgrades HTTP to WebSocket and forwards client control messages to
// the hub.
func wsHandler(hubInstance *hub.Hub) http.HandlerFunc {
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

			hubInstance.SendCommand(cm.Action)
		}
	}
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
