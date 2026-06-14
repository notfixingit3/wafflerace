package hub

import (
	"sync"

	"github.com/gorilla/websocket"
)

// Hub manages WebSocket client connections and message broadcasting.
type Hub struct {
	clients    map[*websocket.Conn]struct{}
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast  chan []byte
	mu         sync.RWMutex
}

// NewHub creates a new Hub.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]struct{}),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		broadcast:  make(chan []byte),
	}
}

// Run starts the hub's internal goroutine for client management.
// Must be called before Register or Broadcast.
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
		}
	}
}

// Register adds a WebSocket connection to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	h.register <- conn
}

// Broadcast sends state data to all connected clients.
func (h *Hub) Broadcast(state []byte) {
	h.broadcast <- state
}
