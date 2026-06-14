package game

import (
	"testing"
	"time"
)

const finishLineZ = 200.0

func TestWinner_FirstDuckCrossingFinishLineWins(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	duck := &Duck{
		ID:       "winner-duck",
		Name:     "Speedy",
		X:        0,
		Y:        0,
		Z:        199.0,
		Velocity: 10.0,
		Color:    "red",
	}
	engine.mu.Lock()
	engine.ducks["winner-duck"] = duck
	engine.mu.Unlock()

	// Tick should move the duck past Z=200
	engine.Tick(100 * time.Millisecond)

	// Re-fetch duck to check its position
	d, _ := engine.Duck("winner-duck")
	if d.Z < finishLineZ {
		t.Errorf("duck Z = %v, want >= %v (duck did not cross finish line)", d.Z, finishLineZ)
	}

	winner := engine.Winner()
	if winner == nil {
		t.Fatal("Winner() = nil, want non-nil (first duck to cross should win)")
	}
	if winner.ID != "winner-duck" {
		t.Errorf("Winner().ID = %q, want %q", winner.ID, "winner-duck")
	}

	if !engine.Finished() {
		t.Error("Finished() = false, want true (race should be finished after a duck crosses)")
	}
}

func TestWinner_FirstDuckToCrossWins_SecondDoesNotOverride(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	fastDuck := &Duck{
		ID:       "fast-duck",
		Name:     "Speedy",
		X:        0,
		Y:        0,
		Z:        199.0,
		Velocity: 10.0,
		Color:    "red",
	}
	slowDuck := &Duck{
		ID:       "slow-duck",
		Name:     "Slowpoke",
		X:        0,
		Y:        0,
		Z:        50.0,
		Velocity: 1.0,
		Color:    "blue",
	}
	engine.mu.Lock()
	engine.ducks["fast-duck"] = fastDuck
	engine.ducks["slow-duck"] = slowDuck
	engine.mu.Unlock()

	// First tick — fast duck should cross, slow duck should not
	engine.Tick(100 * time.Millisecond)

	fastD, _ := engine.Duck("fast-duck")
	if fastD.Z < finishLineZ {
		t.Errorf("fast-duck Z = %v, want >= %v (fast duck did not cross)", fastD.Z, finishLineZ)
	}

	winner := engine.Winner()
	if winner == nil {
		t.Fatal("Winner() = nil, want non-nil (fast duck should have won)")
	}
	if winner.ID != "fast-duck" {
		t.Errorf("Winner().ID = %q, want %q", winner.ID, "fast-duck")
	}

	// Second tick — slow duck might cross, but winner should not change
	engine.Tick(100 * time.Millisecond)

	winnerAfter := engine.Winner()
	if winnerAfter == nil {
		t.Fatal("Winner() = nil after second tick, want non-nil (winner should persist)")
	}
	if winnerAfter.ID != "fast-duck" {
		t.Errorf("Winner().ID = %q after second tick, want %q (winner should not change)", winnerAfter.ID, "fast-duck")
	}
}

func TestWinner_ResetRaceClearsWinnerAndResetsDucks(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	duck := &Duck{
		ID:       "reset-duck",
		Name:     "Resetty",
		X:        0,
		Y:        0,
		Z:        199.0,
		Velocity: 10.0,
		Color:    "green",
	}
	engine.mu.Lock()
	engine.ducks["reset-duck"] = duck
	engine.mu.Unlock()

	// Tick to cross the line
	engine.Tick(100 * time.Millisecond)

	// Verify duck crossed and winner is set
	d, _ := engine.Duck("reset-duck")
	if d.Z < finishLineZ {
		t.Errorf("before reset: duck Z = %v, want >= %v", d.Z, finishLineZ)
	}
	if engine.Winner() == nil {
		t.Fatal("before reset: Winner() = nil, want non-nil")
	}

	// Reset the race
	engine.ResetRace()

	// Winner should be cleared
	if engine.Winner() != nil {
		t.Error("after reset: Winner() = non-nil, want nil (winner should be cleared)")
	}

	// Finished should be false
	if engine.Finished() {
		t.Error("after reset: Finished() = true, want false (race should not be finished after reset)")
	}

	// All ducks should be back at Z=0
	d, _ = engine.Duck("reset-duck")
	if d.Z != 0 {
		t.Errorf("after reset: duck Z = %v, want 0 (ducks should return to start)", d.Z)
	}
}

func TestWinner_TickDoesNotMoveDucksWhenFinished(t *testing.T) {
	engine := NewEngine(Config{BaseVelocity: 10.0})
	duck := &Duck{
		ID:       "finished-duck",
		Name:     "Donezo",
		X:        0,
		Y:        0,
		Z:        199.0,
		Velocity: 10.0,
		Color:    "purple",
	}
	engine.mu.Lock()
	engine.ducks["finished-duck"] = duck
	engine.mu.Unlock()

	// Tick to cross the line and finish
	engine.Tick(100 * time.Millisecond)

	if !engine.Finished() {
		t.Fatal("race should be finished after first crossing")
	}

	// Record position after first tick
	d, _ := engine.Duck("finished-duck")
	zAfterFirstTick := d.Z

	// Tick again — ducks should NOT move while finished
	engine.Tick(100 * time.Millisecond)

	d, _ = engine.Duck("finished-duck")
	if d.Z != zAfterFirstTick {
		t.Errorf(
			"duck Z changed from %v to %v after Tick() while finished (ducks should not move when race is finished)",
			zAfterFirstTick, d.Z,
		)
	}
}