package hub

import "github.com/gorilla/websocket"

// Hub manages WebSocket client connections and message broadcasting.
type Hub struct {
	// TODO: add client tracking fields in Task 11
}

// NewHub creates a new Hub.
func NewHub() *Hub {
	return &Hub{}
}

// Run starts the hub's internal goroutine for client management.
// Must be called before Register or Broadcast.
func (h *Hub) Run() {
	// TODO: implement in Task 11
}

// Register adds a WebSocket connection to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	// TODO: implement in Task 11
}

// Broadcast sends state data to all connected clients.
func (h *Hub) Broadcast(state []byte) {
	// TODO: implement in Task 11
}
