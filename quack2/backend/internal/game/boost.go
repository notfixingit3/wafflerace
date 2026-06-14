package game

import (
	"errors"
	"time"
)

// Boost activates a boost for the given duck, refreshing any existing boost.
func (e *Engine) Boost(duckID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	d, ok := e.ducks[duckID]
	if !ok {
		return errors.New("duck not found")
	}

	d.ActiveBoostUntil = time.Now().Add(3 * time.Second)
	return nil
}

// EffectiveVelocity returns the duck's current effective velocity,
// accounting for active boosts.
func (e *Engine) EffectiveVelocity(duckID string) (float64, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	d, ok := e.ducks[duckID]
	if !ok {
		return 0, errors.New("duck not found")
	}

	return e.effectiveVelocity(d, time.Now()), nil
}

// effectiveVelocity returns the velocity for duck d at time now.
// Caller must hold e.mu.
func (e *Engine) effectiveVelocity(d *Duck, now time.Time) float64 {
	if now.Before(d.ActiveBoostUntil) {
		return d.Velocity * 1.5
	}
	return d.Velocity
}

// Boosted returns true if the duck has an active boost.
func (d *Duck) Boosted(now time.Time) bool {
	return now.Before(d.ActiveBoostUntil)
}
