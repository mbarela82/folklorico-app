import { useState, useRef, useCallback } from "react";

export function useMediaLoop() {
  // The "Truth" Reference (Mutable, instant access for loop checking)
  const loopRef = useRef<{
    a: number | null;
    b: number | null;
    active: boolean;
  }>({
    a: null,
    b: null,
    active: false,
  });

  // UI State (Triggers re-renders so we can draw the blue loop box)
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopDuration, setLoopDuration] = useState(5); // Default 5s

  const clearLoop = useCallback(() => {
    loopRef.current = { a: null, b: null, active: false };
    setLoopA(null);
    setLoopB(null);
    setActiveLoopId(null);
  }, []);

  const toggleBookmarkLoop = useCallback(
    (mark: any, currentDuration: number) => {
      // If clicking the same one, turn it off
      if (activeLoopId === mark.id) {
        clearLoop();
        return null; // Return null to signal "loop cleared"
      }

      const start = mark.start_time;
      const end = mark.start_time + currentDuration;

      // Update Logic
      loopRef.current = { a: start, b: end, active: true };

      // Update Visuals
      setLoopA(start);
      setLoopB(end);
      setActiveLoopId(mark.id);

      return start; // Return start time so the player can jump to it
    },
    [activeLoopId, clearLoop]
  );

  const updateLoopDuration = useCallback((newDuration: number) => {
    setLoopDuration(newDuration);
    if (loopRef.current.active && loopRef.current.a !== null) {
      const newB = loopRef.current.a + newDuration;
      loopRef.current.b = newB;
      setLoopB(newB);
    }
  }, []);

  // The critical check function run every millisecond by the player
  const checkLoop = useCallback((currentTime: number) => {
    const { a, b, active } = loopRef.current;
    if (active && a !== null && b !== null) {
      // If we passed the end point OR are way before the start point
      if (currentTime >= b || currentTime < a - 0.5) {
        return a; // Return the time we should jump to
      }
    }
    return null; // No jump needed
  }, []);

  return {
    // State
    activeLoopId,
    loopA,
    loopB,
    loopDuration,
    loopRef, // Exported just in case we need direct access
    // Actions
    clearLoop,
    toggleBookmarkLoop,
    updateLoopDuration,
    checkLoop,
  };
}
