package chat

import "time"

// ChatCommand represents a parsed chat command from the mock listener.
type ChatCommand struct {
	Type      string    // command type, e.g. "!boost"
	Target    string    // target duck name
	Timestamp time.Time // when the command was generated
}

// MockChat is a deterministic mock chat listener.
// It generates !boost commands at random intervals using a seeded RNG.
type MockChat struct {
	seed   int64
	out    chan<- ChatCommand
	stopCh chan struct{}
}

// NewMockChat creates a new MockChat with the given seed and output channel.
// The seed ensures deterministic command sequences across runs.
func NewMockChat(seed int64, out chan<- ChatCommand) *MockChat {
	return &MockChat{
		seed:   seed,
		out:    out,
		stopCh: make(chan struct{}),
	}
}

// Start begins generating chat commands. (stub — does not emit yet)
func (mc *MockChat) Start() {
	// TODO: implement in Task 12
}

// Stop signals the listener to stop generating commands.
func (mc *MockChat) Stop() {
	// TODO: implement in Task 12
}
