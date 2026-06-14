package game

import (
	"fmt"
	"sync"
	"time"
)

// Config holds configuration for the game engine.
type Config struct {
	BaseVelocity float64
	FinishLineZ  float64
}

// Engine is the authoritative game engine that manages ducks and race state.
type Engine struct {
	mu     sync.Mutex
	ducks  map[string]*Duck
	config Config
	paused bool
	nextID int
}

// NewEngine creates a new game engine with the given configuration.
func NewEngine(config Config) *Engine {
	return &Engine{
		ducks:  make(map[string]*Duck),
		config: config,
	}
}

// Tick advances the game state by the given duration.
// This is a stub — actual movement implementation in Task 8.
func (e *Engine) Tick(dt time.Duration) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.paused {
		return
	}
	// stub: does not move ducks yet
	_ = dt
}

// Ducks returns a snapshot of all ducks.
func (e *Engine) Ducks() []*Duck {
	e.mu.Lock()
	defer e.mu.Unlock()
	ducks := make([]*Duck, 0, len(e.ducks))
	for _, d := range e.ducks {
		ducks = append(ducks, d)
	}
	return ducks
}

// Duck returns the duck with the given ID, or false if not found.
func (e *Engine) Duck(duckID string) (*Duck, bool) {
	e.mu.Lock()
	defer e.mu.Unlock()
	d, ok := e.ducks[duckID]
	return d, ok
}

// AddDuck creates a new duck with the given name, assigns it an ID and
// distributes its X position across the river width (-20 to +20).
// This is a stub — actual distribution logic in Task 8.
func (e *Engine) AddDuck(name string) *Duck {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.nextID++
	duck := &Duck{
		ID:       fmt.Sprintf("duck-%d", e.nextID),
		Name:     name,
		X:        0, // stub: always 0
		Y:        0,
		Z:        0,
		Velocity: e.config.BaseVelocity,
		Color:    randomColor(),
	}
	e.ducks[duck.ID] = duck
	return duck
}

// RemoveDuck removes a duck by ID. Returns true if the duck existed.
func (e *Engine) RemoveDuck(id string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	_, ok := e.ducks[id]
	if ok {
		delete(e.ducks, id)
	}
	return ok
}

// Start unpauses the race.
func (e *Engine) Start() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.paused = false
}

// Pause pauses the race, preventing movement on Tick.
func (e *Engine) Pause() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.paused = true
}

// Reset returns all ducks to Z=0 and unpauses the race.
// This is a stub — actual implementation in Task 8.
func (e *Engine) Reset() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.paused = false
	// stub: does not reset duck Z positions yet
}

// randomColor returns a hex color string for a new duck.
func randomColor() string {
	colors := []string{"#FF4444", "#44FF44", "#4444FF", "#FFFF44", "#FF44FF", "#44FFFF"}
	return colors[0] // stub: always returns first color
}