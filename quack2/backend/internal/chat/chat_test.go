package chat

import (
	"testing"
	"time"
)

// TestMockChatDeterministic verifies that two MockChat instances with the same
// seed produce identical command sequences.
func TestMockChatDeterministic(t *testing.T) {
	ch1 := make(chan ChatCommand, 10)
	ch2 := make(chan ChatCommand, 10)

	mc1 := NewMockChat(42, ch1)
	mc2 := NewMockChat(42, ch2)

	mc1.Start()
	mc2.Start()

	var cmds1, cmds2 []ChatCommand
	collectTimeout := 100 * time.Millisecond

	// Collect 3 commands from each chat
	for i := 0; i < 3; i++ {
		select {
		case cmd := <-ch1:
			cmds1 = append(cmds1, cmd)
		case <-time.After(collectTimeout):
			t.Fatalf("expected 3 commands from chat 1, got %d", len(cmds1))
		}
		select {
		case cmd := <-ch2:
			cmds2 = append(cmds2, cmd)
		case <-time.After(collectTimeout):
			t.Fatalf("expected 3 commands from chat 2, got %d", len(cmds2))
		}
	}

	mc1.Stop()
	mc2.Stop()

	// Verify sequences are identical
	for i := range cmds1 {
		if cmds1[i] != cmds2[i] {
			t.Fatalf("command %d differs: %+v vs %+v", i, cmds1[i], cmds2[i])
		}
	}
}

// TestMockChatBoostCommand verifies that generated commands include !boost
// with a target duck name.
func TestMockChatBoostCommand(t *testing.T) {
	ch := make(chan ChatCommand, 10)
	mc := NewMockChat(42, ch)
	mc.Start()

	timeout := 200 * time.Millisecond
	select {
	case cmd := <-ch:
		if cmd.Type != "!boost" {
			t.Fatalf("expected command type !boost, got %s", cmd.Type)
		}
		if cmd.Target == "" {
			t.Fatal("expected non-empty target duck name")
		}
	case <-time.After(timeout):
		t.Fatal("expected at least one !boost command, got none")
	}

	mc.Stop()
}

// TestMockChatStop verifies that the listener can be stopped cleanly and
// no commands arrive after Stop is called.
func TestMockChatStop(t *testing.T) {
	ch := make(chan ChatCommand, 10)
	mc := NewMockChat(42, ch)
	mc.Start()

	// Expect at least one command before stopping
	timeout := 200 * time.Millisecond
	select {
	case <-ch:
		// got a command, good
	case <-time.After(timeout):
		t.Fatal("expected at least one command before stop, got none")
	}

	mc.Stop()

	// After stop, no more commands should arrive
	afterStop := 100 * time.Millisecond
	select {
	case <-ch:
		t.Fatal("received command after stop")
	case <-time.After(afterStop):
		// expected — no commands after stop
	}
}
