// Loop points per track (seconds), measured in the browser from loudness per
// 0.5 s window: the loop ends at the last window before the closing fade.
export const LOOPS = {
  morning: { loopStart: 0, loopEnd: 74.5 },
  sunset: { loopStart: 0.5, loopEnd: 69.5 },
  moon: { loopStart: 0, loopEnd: 67 },
};
