// Renderer observations are primitives only; importing the original FrameLimiter in unit tests
// must not create a browser controller or require a DOM.
let frames = 0;
let backend = 'loading';
export function setPureTvRenderer(value: string) { backend = value; }
export function recordPureTvFrame() { frames++; }
export function readPureTvRenderer() { return { frames, backend }; }
