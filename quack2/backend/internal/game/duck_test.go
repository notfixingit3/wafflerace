package game

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDuck_MarshalJSON_ExcludesActiveBoostUntil(t *testing.T) {
	now := time.Now()
	d := Duck{
		ID:              "duck-1",
		Name:            "Quackers",
		X:               10.5,
		Y:               20.0,
		Z:               30.75,
		Velocity:        5.2,
		Color:           "yellow",
		ActiveBoostUntil: now,
	}

	data, err := json.Marshal(d)
	if err != nil {
		t.Fatalf("failed to marshal Duck: %v", err)
	}

	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("failed to unmarshal Duck JSON into map: %v", err)
	}

	// Assert expected fields are present
	expectedFields := []string{"id", "name", "x", "y", "z", "velocity", "color"}
	for _, field := range expectedFields {
		if _, ok := raw[field]; !ok {
			t.Errorf("expected field %q to be present in JSON output", field)
		}
	}

	// Assert ActiveBoostUntil is excluded
	if _, ok := raw["ActiveBoostUntil"]; ok {
		t.Error("ActiveBoostUntil should be excluded from JSON output")
	}
	if _, ok := raw["activeBoostUntil"]; ok {
		t.Error("activeBoostUntil should be excluded from JSON output")
	}

	// Assert field values
	if raw["id"] != "duck-1" {
		t.Errorf("id = %v, want duck-1", raw["id"])
	}
	if raw["name"] != "Quackers" {
		t.Errorf("name = %v, want Quackers", raw["name"])
	}
	if raw["x"] != 10.5 {
		t.Errorf("x = %v, want 10.5", raw["x"])
	}
	if raw["y"] != 20.0 {
		t.Errorf("y = %v, want 20.0", raw["y"])
	}
	if raw["z"] != 30.75 {
		t.Errorf("z = %v, want 30.75", raw["z"])
	}
	if raw["velocity"] != 5.2 {
		t.Errorf("velocity = %v, want 5.2", raw["velocity"])
	}
	if raw["color"] != "yellow" {
		t.Errorf("color = %v, want yellow", raw["color"])
	}
}

func TestDuck_UnmarshalDuckState_PreservesValues(t *testing.T) {
	input := `{
		"id": "duck-2",
		"name": "Daffy",
		"x": 1.0,
		"y": 2.5,
		"z": 3.0,
		"velocity": 10.0,
		"color": "black"
	}`

	var state DuckState
	if err := json.Unmarshal([]byte(input), &state); err != nil {
		t.Fatalf("failed to unmarshal DuckState: %v", err)
	}

	if state.ID != "duck-2" {
		t.Errorf("ID = %q, want %q", state.ID, "duck-2")
	}
	if state.Name != "Daffy" {
		t.Errorf("Name = %q, want %q", state.Name, "Daffy")
	}
	if state.X != 1.0 {
		t.Errorf("X = %v, want %v", state.X, 1.0)
	}
	if state.Y != 2.5 {
		t.Errorf("Y = %v, want %v", state.Y, 2.5)
	}
	if state.Z != 3.0 {
		t.Errorf("Z = %v, want %v", state.Z, 3.0)
	}
	if state.Velocity != 10.0 {
		t.Errorf("Velocity = %v, want %v", state.Velocity, 10.0)
	}
	if state.Color != "black" {
		t.Errorf("Color = %q, want %q", state.Color, "black")
	}
}

func TestDuck_ZeroValue_MarshalsCorrectly(t *testing.T) {
	var d Duck

	data, err := json.Marshal(d)
	if err != nil {
		t.Fatalf("failed to marshal zero-value Duck: %v", err)
	}

	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("failed to unmarshal zero-value Duck JSON: %v", err)
	}

	// Zero-value string fields should be empty
	if raw["id"] != "" {
		t.Errorf("id = %v, want empty string", raw["id"])
	}
	if raw["name"] != "" {
		t.Errorf("name = %v, want empty string", raw["name"])
	}
	if raw["color"] != "" {
		t.Errorf("color = %v, want empty string", raw["color"])
	}

	// Zero-value float64 fields should be 0
	if raw["x"] != 0.0 {
		t.Errorf("x = %v, want 0.0", raw["x"])
	}
	if raw["y"] != 0.0 {
		t.Errorf("y = %v, want 0.0", raw["y"])
	}
	if raw["z"] != 0.0 {
		t.Errorf("z = %v, want 0.0", raw["z"])
	}
	if raw["velocity"] != 0.0 {
		t.Errorf("velocity = %v, want 0.0", raw["velocity"])
	}

	// ActiveBoostUntil must not appear
	if _, ok := raw["ActiveBoostUntil"]; ok {
		t.Error("ActiveBoostUntil should be excluded from zero-value Duck JSON")
	}
}

func TestDuck_ActiveBoostUntil_ExcludedFromJSON(t *testing.T) {
	// Explicitly test that ActiveBoostUntil is excluded even when set to a non-zero value
	boostTime := time.Date(2026, 6, 14, 12, 0, 0, 0, time.UTC)
	d := Duck{
		ID:              "boost-duck",
		Name:            "Speedy",
		X:               0,
		Y:               0,
		Z:               0,
		Velocity:        100,
		Color:           "red",
		ActiveBoostUntil: boostTime,
	}

	data, err := json.Marshal(d)
	if err != nil {
		t.Fatalf("failed to marshal Duck with boost: %v", err)
	}

	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	// Only the 7 broadcast fields should exist
	if len(raw) != 7 {
		t.Errorf("expected exactly 7 fields in JSON, got %d: %v", len(raw), raw)
	}

	// ActiveBoostUntil must not appear in any casing
	for key := range raw {
		if key == "ActiveBoostUntil" || key == "activeBoostUntil" || key == "active_boost_until" {
			t.Errorf("ActiveBoostUntil found in JSON output as %q", key)
		}
	}
}

func TestDuck_ToState_ConvertsCorrectly(t *testing.T) {
	now := time.Now()
	d := Duck{
		ID:              "duck-3",
		Name:            "Converter",
		X:               5.0,
		Y:               6.0,
		Z:               7.0,
		Velocity:        3.0,
		Color:           "blue",
		ActiveBoostUntil: now,
	}

	state := d.ToState()

	if state.ID != d.ID {
		t.Errorf("ToState().ID = %q, want %q", state.ID, d.ID)
	}
	if state.Name != d.Name {
		t.Errorf("ToState().Name = %q, want %q", state.Name, d.Name)
	}
	if state.X != d.X {
		t.Errorf("ToState().X = %v, want %v", state.X, d.X)
	}
	if state.Y != d.Y {
		t.Errorf("ToState().Y = %v, want %v", state.Y, d.Y)
	}
	if state.Z != d.Z {
		t.Errorf("ToState().Z = %v, want %v", state.Z, d.Z)
	}
	if state.Velocity != d.Velocity {
		t.Errorf("ToState().Velocity = %v, want %v", state.Velocity, d.Velocity)
	}
	if state.Color != d.Color {
		t.Errorf("ToState().Color = %q, want %q", state.Color, d.Color)
	}
}
