package hub

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/wafflerace/quack2/backend/internal/game"
)

// Hub manages WebSocket client connections, message broadcasting, and control
// messages forwarded to the game engine.
type Hub struct {
	clients    map[*websocket.Conn]struct{}
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast  chan []byte
	commands   chan string
	mu         sync.RWMutex
	engine     *game.Engine
}

// NewHub creates a new Hub that forwards control messages to the engine.
func NewHub(engine *game.Engine) *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]struct{}),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		broadcast:  make(chan []byte),
		commands:   make(chan string),
		engine:     engine,
	}
}

// Run starts the hub's internal goroutine for client management and command
// processing. Must be called before Register, Broadcast, or SendCommand.
func (h *Hub) Run() {
	go h.runLoop()
}

func (h *Hub) runLoop() {
	for {
		select {
		case conn := <-h.register:
			h.mu.Lock()
			h.clients[conn] = struct{}{}
			h.mu.Unlock()

		case conn := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := make([]*websocket.Conn, 0, len(h.clients))
			for conn := range h.clients {
				clients = append(clients, conn)
			}
			h.mu.RUnlock()

			for _, conn := range clients {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					h.mu.Lock()
					delete(h.clients, conn)
					h.mu.Unlock()
					conn.Close()
				}
			}

		case action := <-h.commands:
			h.handleCommand(action)
		}
	}
}

// handleCommand applies a control action to the game engine.
func (h *Hub) handleCommand(action string) {
	switch action {
	case "spawn":
		h.engine.AddDuck(fmt.Sprintf("Duck-%d", len(h.engine.Ducks())+1))
	case "remove":
		if id := h.lastDuckID(); id != "" {
			h.engine.RemoveDuck(id)
		}
	case "start":
		h.engine.Start()
	case "pause":
		h.engine.Pause()
	case "reset":
		h.engine.ResetRace()
	default:
		log.Printf("unknown control action: %q", action)
	}
}

// lastDuckID returns the ID of the duck with the highest numeric suffix.
func (h *Hub) lastDuckID() string {
	var lastID string
	var lastNum int
	for _, d := range h.engine.Ducks() {
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

// Register adds a WebSocket connection to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	h.register <- conn
}

// Broadcast sends state data to all connected clients.
func (h *Hub) Broadcast(state []byte) {
	h.broadcast <- state
}

// SendCommand enqueues a control action to be processed by the hub.
func (h *Hub) SendCommand(action string) {
	h.commands <- action
}
