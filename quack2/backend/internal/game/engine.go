package game

import (
	"fmt"
	"math/rand"
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
	mu       sync.Mutex
	ducks    map[string]*Duck
	config   Config
	paused   bool
	nextID   int
	winnerID string
	finished bool
}

// NewEngine creates a new game engine with the given configuration.
func NewEngine(config Config) *Engine {
	if config.FinishLineZ == 0 {
		config.FinishLineZ = 200.0
	}
	return &Engine{
		ducks:  make(map[string]*Duck),
		config: config,
	}
}

// Tick advances the game state by the given duration.
func (e *Engine) Tick(dt time.Duration) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.paused || e.finished {
		return
	}

	now := time.Now()
	seconds := dt.Seconds()
	for _, d := range e.ducks {
		d.Z += e.effectiveVelocity(d, now) * seconds

		if e.checkWinner(d) {
			e.winnerID = d.ID
			e.finished = true
		}
	}
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
func (e *Engine) AddDuck(name string) *Duck {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.nextID++
	duck := &Duck{
		ID:       fmt.Sprintf("duck-%d", e.nextID),
		Name:     name,
		X:        spreadX(e.nextID),
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

// Reset returns all ducks to Z=0, clears the winner/finished state, and unpauses the race.
func (e *Engine) Reset() {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.paused = false
	e.winnerID = ""
	e.finished = false
	for _, d := range e.ducks {
		d.Z = 0
	}
}

// spreadX distributes ducks evenly across the river width [-20, +20].
func spreadX(index int) float64 {
	positions := []float64{-20, -10, 0, 10, 20}
	return positions[index%len(positions)]
}

// randomColor returns a hex color string for a new duck.
func randomColor() string {
	colors := []string{"#FF4444", "#44FF44", "#4444FF", "#FFFF44", "#FF44FF", "#44FFFF"}
	return colors[rand.Intn(len(colors))]
}
