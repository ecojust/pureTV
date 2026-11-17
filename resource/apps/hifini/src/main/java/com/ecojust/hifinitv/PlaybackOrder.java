package com.ecojust.hifinitv;

import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.List;

/** Shuffle without immediate repeats; previous follows actual listening history. */
final class PlaybackOrder {
    private final List<Integer> bag = new ArrayList<>();
    private final ArrayDeque<Integer> history = new ArrayDeque<>();
    private boolean shuffle;
    private int last = -1, size;
    boolean shuffled() { return shuffle; }
    void shuffle(boolean enabled) { if (shuffle != enabled) { shuffle = enabled; bag.clear(); history.clear(); } }
    void record(int index, int count) {
        if (size != count) { size = count; bag.clear(); }
        if (last >= 0 && last != index) { history.push(last); if (history.size() > 100) history.removeLast(); }
        last = index; bag.remove(Integer.valueOf(index));
    }
    int next(int current, int count) {
        if (count == 0) return -1;
        if (!shuffle) return (current + 1) % count;
        if (size != count) { size = count; bag.clear(); }
        if (bag.isEmpty()) {
            for (int i = 0; i < count; i++) if (i != current) bag.add(i);
            Collections.shuffle(bag);
        }
        return bag.isEmpty() ? 0 : bag.remove(bag.size() - 1);
    }
    int previous(int current, int count) {
        if (count == 0) return -1;
        if (shuffle && !history.isEmpty()) { last = history.pop(); return last; }
        return shuffle ? current : (current - 1 + count) % count;
    }
    void clear() { bag.clear(); history.clear(); last = -1; size = 0; }
}
