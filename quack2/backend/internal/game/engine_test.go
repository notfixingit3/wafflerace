package game

import (
	"testing"
	"time"
)

const (
	baseVelocity = 5.0
	tickDelta    = 100 * time.Millisecond
)

func TestEngineTick_ZIncreasesByVelocityTimesDt(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := engine.AddDuck("Racer")

	// Before Tick: Z should be 0
	if duck.Z != 0 {
		t.Fatalf("before Tick: duck Z = %v, want 0", duck.Z)
	}

	engine.Tick(tickDelta)

	// After Tick(100ms) at base velocity 5.0: Z should increase by 5.0 * 0.1 = 0.5
	d, _ := engine.Duck(duck.ID)
	want := baseVelocity * tickDelta.Seconds()
	if d.Z != want {
		t.Errorf(
			"after Tick(%v): duck Z = %v, want %v (movement = baseVelocity %v * dt %v)",
			tickDelta, d.Z, want, baseVelocity, tickDelta.Seconds(),
		)
	}
}

func TestEngineTick_XYRemainConstant(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := engine.AddDuck("Const")
	wantX, wantY := duck.X, duck.Y

	engine.Tick(tickDelta)

	d, _ := engine.Duck(duck.ID)
	if d.X != wantX {
		t.Errorf("after Tick: duck X = %v, want %v (X should remain constant)", d.X, wantX)
	}
	if d.Y != wantY {
		t.Errorf("after Tick: duck Y = %v, want %v (Y should remain constant)", d.Y, wantY)
	}
}

func TestEngineTick_PausePreventsMovement(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := engine.AddDuck("Paused")

	// First Tick should move the duck (this assertion fails because Tick is a stub)
	engine.Tick(tickDelta)
	if duck.Z == 0 {
		t.Errorf(
			"unpaused Tick did not move duck from Z=0 — engine stub does not implement movement yet",
		)
	}

	// Reset and pause
	engine.Reset()
	engine.Pause()

	// Tick while paused — Z should NOT change
	before := duck.Z
	engine.Tick(tickDelta)

	d, _ := engine.Duck(duck.ID)
	if d.Z != before {
		t.Errorf(
			"after paused Tick: duck Z = %v, want %v (paused Tick should not move duck)",
			d.Z, before,
		)
	}
}

func TestEngineTick_ResetReturnsDucksToStartLine(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: baseVelocity})
	duck := engine.AddDuck("Resetter")

	// Simulate duck having moved — set Z to a non-start value
	duck.Z = 50

	// Reset should return duck to Z=0 (this assertion fails because Reset is a stub)
	engine.Reset()

	d, _ := engine.Duck(duck.ID)
	if d.Z != 0 {
		t.Errorf(
			"after Reset: duck Z = %v, want 0 (Reset should return duck to start line)",
			d.Z,
		)
	}
}

func TestEngineTick_AddDuckDistributesXAcrossRiver(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: baseVelocity})

	// Add multiple ducks and check X distribution covers the river width
	const nDucks = 5
	ducks := make([]*Duck, nDucks)
	for i := 0; i < nDucks; i++ {
		ducks[i] = engine.AddDuck("")
	}

	// Collect X positions
	xPositions := make([]float64, nDucks)
	minX, maxX := 1000.0, -1000.0
	for i, d := range ducks {
		d2, _ := engine.Duck(d.ID)
		xPositions[i] = d2.X
		if d2.X < minX {
			minX = d2.X
		}
		if d2.X > maxX {
			maxX = d2.X
		}
	}

	// The river spans -20 to +20, so ducks should be distributed across that range
	riverMin, riverMax := -20.0, 20.0
	if minX < riverMin || maxX > riverMax {
		t.Errorf(
			"X positions [%v .. %v] are outside river bounds [%v, %v]",
			minX, maxX, riverMin, riverMax,
		)
	}

	// With 5 ducks, they should not all be at the same X position (meaningful spread)
	if minX == maxX {
		t.Errorf(
			"all %d ducks have the same X = %v, expected distribution across [%v, %v]",
			nDucks, minX, riverMin, riverMax,
		)
	}
}