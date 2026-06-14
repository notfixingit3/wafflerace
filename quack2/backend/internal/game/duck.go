package game

import "time"

// Duck represents a duck in the game world with full internal state.
type Duck struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	X               float64   `json:"x"`
	Y               float64   `json:"y"`
	Z               float64   `json:"z"`
	Velocity        float64   `json:"velocity"`
	Color           string    `json:"color"`
	ActiveBoostUntil time.Time `json:"-"`
}

// DuckState is the subset of Duck fields sent over the wire to clients.
// ActiveBoostUntil is intentionally excluded from the broadcast format.
type DuckState struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Z        float64 `json:"z"`
	Velocity float64 `json:"velocity"`
	Color    string  `json:"color"`
}

// ToState converts a Duck to its wire-format DuckState.
func (d *Duck) ToState() DuckState {
	return DuckState{
		ID:       d.ID,
		Name:     d.Name,
		X:        d.X,
		Y:        d.Y,
		Z:        d.Z,
		Velocity: d.Velocity,
		Color:    d.Color,
	}
}
