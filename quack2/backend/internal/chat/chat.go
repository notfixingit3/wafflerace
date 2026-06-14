package chat

import (
	"math/rand"
	"sync"
	"time"
)

// ChatCommand represents a parsed chat command from the mock listener.
type ChatCommand struct {
	Type      string    // command type, e.g. "!boost"
	Target    string    // target duck name
	Timestamp time.Time // when the command was generated
}

// MockChat is a deterministic mock chat listener.
// It generates !boost commands at random intervals using a seeded RNG.
type MockChat struct {
	seed     int64
	out      chan<- ChatCommand
	stopCh   chan struct{}
	stopOnce sync.Once
	wg       sync.WaitGroup
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

var duckNames = []string{"Duck-1", "Duck-2", "Duck-3", "Duck-4", "Duck-5"}

// Start begins generating chat commands.
func (mc *MockChat) Start() {
	mc.wg.Add(1)
	go func() {
		defer mc.wg.Done()

		r := rand.New(rand.NewSource(mc.seed))
		baseTime := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
		var elapsed time.Duration

		for {
			interval := time.Duration(r.Intn(5)+1) * time.Millisecond
			elapsed += interval

			select {
			case <-mc.stopCh:
				return
			case <-time.After(interval):
			}

			cmd := ChatCommand{
				Type:      "!boost",
				Target:    duckNames[r.Intn(len(duckNames))],
				Timestamp: baseTime.Add(elapsed),
			}

			select {
			case <-mc.stopCh:
				return
			case mc.out <- cmd:
			}
		}
	}()
}

// Stop signals the listener to stop generating commands.
func (mc *MockChat) Stop() {
	mc.stopOnce.Do(func() {
		close(mc.stopCh)
	})
	mc.wg.Wait()
}
