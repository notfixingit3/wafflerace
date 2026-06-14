package game

import (
	"errors"
	"time"
)

// Boost activates a boost for the given duck.
// TODO: implement actual boost timing logic (Task 9)
func (e *Engine) Boost(duckID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	d, ok := e.ducks[duckID]
	if !ok {
		return errors.New("duck not found")
	}

	// Stub: does nothing yet
	_ = d
	return nil
}

// EffectiveVelocity returns the duck's current effective velocity,
// accounting for active boosts.
// TODO: implement boost multiplier logic (Task 9)
func (e *Engine) EffectiveVelocity(duckID string) (float64, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	d, ok := e.ducks[duckID]
	if !ok {
		return 0, errors.New("duck not found")
	}

	// Stub: returns base velocity only (no boost multiplier)
	return d.Velocity, nil
}

// Boosted returns true if the duck has an active boost.
func (d *Duck) Boosted(now time.Time) bool {
	return now.Before(d.ActiveBoostUntil)
}
