package game

// Winner returns the duck that crossed the finish line first, or nil if no winner yet.
func (e *Engine) Winner() *Duck {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.winnerID == "" {
		return nil
	}
	return e.ducks[e.winnerID]
}

// Finished returns true if a duck has crossed the finish line and the race is over.
func (e *Engine) Finished() bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	return e.finished
}

// checkWinner reports whether d has just won the race. Caller must hold e.mu.
func (e *Engine) checkWinner(d *Duck) bool {
	return d.Z >= e.config.FinishLineZ && e.winnerID == ""
}

// ResetRace clears the winner/finished state and returns all ducks to Z=0.
func (e *Engine) ResetRace() {
	e.Reset()
}
