package hub

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// testWebSocketServer starts an httptest.Server that upgrades to WebSocket.
func testWebSocketServer(t *testing.T) (*httptest.Server, string) {
	t.Helper()

	var upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		// Echo server: read messages and write them back
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				break
			}
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				break
			}
		}
	}))

	// Convert http URL to ws URL
	wsURL := "ws" + srv.URL[len("http"):] + "/ws"
	return srv, wsURL
}

// TestHub_ClientConnectsAndReceivesBroadcast verifies that a connected client
// receives a message sent via Hub.Broadcast.
func TestHub_ClientConnectsAndReceivesBroadcast(t *testing.T) {
	srv, wsURL := testWebSocketServer(t)
	defer srv.Close()

	hub := NewHub()
	hub.Run()

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to dial WebSocket server: %v", err)
	}
	defer conn.Close()

	hub.Register(conn)

	message := []byte(`{"type":"state","ducks":[]}`)
	hub.Broadcast(message)

	// Expect the client to receive the broadcast message
	conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
	_, got, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("expected to receive broadcast message, got error: %v", err)
	}

	if string(got) != string(message) {
		t.Errorf("received message = %q, want %q", string(got), string(message))
	}
}

// TestHub_MultipleClientsReceiveSameBroadcast verifies that all connected
// clients receive the same broadcast message.
func TestHub_MultipleClientsReceiveSameBroadcast(t *testing.T) {
	srv, wsURL := testWebSocketServer(t)
	defer srv.Close()

	hub := NewHub()
	hub.Run()

	const numClients = 3
	conns := make([]*websocket.Conn, numClients)
	for i := 0; i < numClients; i++ {
		conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		if err != nil {
			t.Fatalf("failed to dial client %d: %v", i, err)
		}
		defer conn.Close()
		conns[i] = conn
		hub.Register(conn)
	}

	message := []byte(`{"type":"state","ducks":[{"id":"1","z":10}]}`)
	hub.Broadcast(message)

	for i, conn := range conns {
		conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))
		_, got, err := conn.ReadMessage()
		if err != nil {
			t.Fatalf("client %d: expected to receive broadcast, got error: %v", i, err)
		}
		if string(got) != string(message) {
			t.Errorf("client %d: received message = %q, want %q", i, string(got), string(message))
		}
	}
}

// TestHub_DisconnectedClientHandledCleanly verifies that the hub does not
// panic when a client disconnects before or during a broadcast.
func TestHub_DisconnectedClientHandledCleanly(t *testing.T) {
	srv, wsURL := testWebSocketServer(t)
	defer srv.Close()

	hub := NewHub()
	hub.Run()

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to dial WebSocket server: %v", err)
	}

	hub.Register(conn)

	// Close the client connection before broadcasting
	conn.Close()
	// Give the hub a moment to process the disconnect
	time.Sleep(50 * time.Millisecond)

	// This broadcast should not panic even though the client disconnected
	message := []byte(`{"type":"state","ducks":[]}`)
	hub.Broadcast(message)

	// If we reach here without a panic, the test passes
}
