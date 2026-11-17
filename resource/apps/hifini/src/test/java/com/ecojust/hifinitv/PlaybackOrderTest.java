package com.ecojust.hifinitv;

import java.util.HashSet;
import java.util.Set;
import org.junit.Test;
import static org.junit.Assert.*;

public class PlaybackOrderTest {
    @Test public void shuffleVisitsEveryOtherTrackBeforeRepeatingAndPreviousUsesHistory() {
        PlaybackOrder order = new PlaybackOrder(); order.shuffle(true); order.record(0, 8);
        Set<Integer> played = new HashSet<>(); played.add(0); int current = 0, prior = 0;
        for (int i = 0; i < 7; i++) {
            int next = order.next(current, 8); assertNotEquals(current, next); assertTrue(played.add(next));
            prior = current; current = next; order.record(current, 8);
        }
        assertEquals(8, played.size()); assertEquals(prior, order.previous(current, 8));
        order.record(prior, 8); assertNotEquals(prior, order.next(prior, 8));
    }
    @Test public void emptySingleTrackAndQueueReplacementRemainValid() {
        PlaybackOrder order = new PlaybackOrder(); order.shuffle(true);
        assertEquals(-1, order.next(-1, 0)); assertEquals(0, order.next(0, 1));
        order.record(4, 5); order.clear(); order.record(0, 2);
        assertEquals(1, order.next(0, 2)); assertEquals(0, order.previous(0, 2));
        order.shuffle(false); assertEquals(0, order.next(1, 2)); assertEquals(1, order.previous(0, 2));
    }
}
