package game

import (
	"testing"
	"time"
)

const (
	boostDuration   = 3 * time.Second
	boostMultiplier = 1.5
)

func TestBoost_SetsActiveBoostUntilToNowPlus3Seconds(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	duck := &Duck{
		ID:       "boost-duck",
		Name:     "Speedy",
		Velocity: 10.0,
		Color:    "red",
	}
	engine.mu.Lock()
	engine.ducks["boost-duck"] = duck
	engine.mu.Unlock()

	before := time.Now()
	err := engine.Boost("boost-duck")
	if err != nil {
		t.Fatalf("Boost() returned error: %v", err)
	}
	after := time.Now()

	// Re-fetch duck to check ActiveBoostUntil
	d, ok := engine.Duck("boost-duck")
	if !ok {
		t.Fatal("duck not found after boost")
	}

	expectedMin := before.Add(boostDuration)
	expectedMax := after.Add(boostDuration)

	if d.ActiveBoostUntil.Before(expectedMin) || d.ActiveBoostUntil.After(expectedMax) {
		t.Errorf(
			"ActiveBoostUntil = %v, want between %v and %v (now + 3s)",
			d.ActiveBoostUntil, expectedMin, expectedMax,
		)
	}
}

func TestBoost_EffectiveVelocityIsMultipliedDuringBoost(t *testing.T) {
	baseVelocity := 10.0
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := &Duck{
		ID:       "boost-duck",
		Name:     "Speedy",
		Velocity: baseVelocity,
		Color:    "red",
	}
	engine.mu.Lock()
	engine.ducks["boost-duck"] = duck
	engine.mu.Unlock()

	// Activate boost
	err := engine.Boost("boost-duck")
	if err != nil {
		t.Fatalf("Boost() returned error: %v", err)
	}

	// Effective velocity should be base * 1.5 during boost
	effective, err := engine.EffectiveVelocity("boost-duck")
	if err != nil {
		t.Fatalf("EffectiveVelocity() returned error: %v", err)
	}

	expected := baseVelocity * boostMultiplier
	if effective != expected {
		t.Errorf(
			"EffectiveVelocity = %v, want %v (base %v * %v)",
			effective, expected, baseVelocity, boostMultiplier,
		)
	}
}

func TestBoost_MultipleBoostsRefreshTimer(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	duck := &Duck{
		ID:       "boost-duck",
		Name:     "Speedy",
		Velocity: 10.0,
		Color:    "red",
	}
	engine.mu.Lock()
	engine.ducks["boost-duck"] = duck
	engine.mu.Unlock()

	// First boost
	_ = engine.Boost("boost-duck")
	d, _ := engine.Duck("boost-duck")
	firstBoostUntil := d.ActiveBoostUntil

	// Wait a tiny bit so the timestamps differ
	time.Sleep(10 * time.Millisecond)

	// Second boost — should refresh to now + 3s, not extend from first
	beforeSecond := time.Now()
	_ = engine.Boost("boost-duck")
	afterSecond := time.Now()

	d, _ = engine.Duck("boost-duck")
	secondBoostUntil := d.ActiveBoostUntil

	// The second boost should set ActiveBoostUntil to ~now + 3s
	expectedMin := beforeSecond.Add(boostDuration)
	expectedMax := afterSecond.Add(boostDuration)

	if secondBoostUntil.Before(expectedMin) || secondBoostUntil.After(expectedMax) {
		t.Errorf(
			"After second boost, ActiveBoostUntil = %v, want between %v and %v (now + 3s, not cumulative)",
			secondBoostUntil, expectedMin, expectedMax,
		)
	}

	// The second boost should NOT be firstBoostUntil + 3s (not cumulative extension)
	// If it were cumulative, it would be significantly later than expectedMax
	if secondBoostUntil.After(expectedMax) {
		t.Errorf(
			"ActiveBoostUntil after second boost = %v, appears to be cumulative extension (expected max %v)",
			secondBoostUntil, expectedMax,
		)
	}

	// Sanity: second boost should be later than first boost
	if !secondBoostUntil.After(firstBoostUntil) {
		t.Errorf(
			"Second boost did not refresh ActiveBoostUntil: first=%v, second=%v",
			firstBoostUntil, secondBoostUntil,
		)
	}
}

func TestBoost_AfterExpiryVelocityReturnsToBase(t *testing.T) {
	baseVelocity := 10.0
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := &Duck{
		ID:       "boost-duck",
		Name:     "Speedy",
		Velocity: baseVelocity,
		Color:    "red",
	}
	engine.mu.Lock()
	engine.ducks["boost-duck"] = duck
	engine.mu.Unlock()

	// Activate boost
	_ = engine.Boost("boost-duck")

	// Manually expire the boost by setting ActiveBoostUntil to the past
	d, _ := engine.Duck("boost-duck")
	d.ActiveBoostUntil = time.Now().Add(-1 * time.Second)

	// Effective velocity should be back to base
	effective, err := engine.EffectiveVelocity("boost-duck")
	if err != nil {
		t.Fatalf("EffectiveVelocity() returned error: %v", err)
	}

	if effective != baseVelocity {
		t.Errorf(
			"After boost expiry, EffectiveVelocity = %v, want %v (base velocity)",
			effective, baseVelocity,
		)
	}
}

func TestBoost_UnknownDuckReturnsError(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})

	err := engine.Boost("nonexistent-duck")
	if err == nil {
		t.Error("Boost() on unknown duck should return error, got nil")
	}
}
