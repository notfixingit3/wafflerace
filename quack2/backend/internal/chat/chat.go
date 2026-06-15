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

// Config configures the timing behavior of a MockChat.
type Config struct {
	IntervalMin time.Duration
	IntervalMax time.Duration
}

// DefaultConfig returns the standard mock chat interval configuration.
func DefaultConfig() Config {
	return Config{
		IntervalMin: 2 * time.Second,
		IntervalMax: 5 * time.Second,
	}
}

// MockChat is a deterministic mock chat listener.
// It generates !boost commands at random intervals using a seeded RNG.
type MockChat struct {
	seed     int64
	config   Config
	out      chan<- ChatCommand
	stopCh   chan struct{}
	stopOnce sync.Once
	wg       sync.WaitGroup
}

// NewMockChat creates a new MockChat with the given seed, output channel, and configuration.
// A nil config defaults to 2–5 second intervals.
func NewMockChat(seed int64, out chan<- ChatCommand, config *Config) *MockChat {
	cfg := DefaultConfig()
	if config != nil {
		cfg = *config
	}
	return &MockChat{
		seed:   seed,
		config: cfg,
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

		intervalRange := int(mc.config.IntervalMax - mc.config.IntervalMin)
		intervalRange = max(intervalRange, 0)

		for {
			interval := mc.config.IntervalMin + time.Duration(r.Intn(intervalRange+1))
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
