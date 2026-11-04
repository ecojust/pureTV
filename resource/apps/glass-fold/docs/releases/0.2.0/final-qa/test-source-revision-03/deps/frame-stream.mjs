// CDP may deliver stale compositor frames. Keep only the observed forward stream;
// never sort frames or change their timestamps to conceal delivery anomalies.
export function createFrameStream({ acknowledge = () => {} } = {}) {
  let rawCdpFrames = 0, acceptedCdpFrames = 0, fileSequence = 0;
  let priorTimestamp = null, accepting = true;
  const droppedFrames = [];
  const filename = () => 'frame-' + String(fileSequence++).padStart(5, '0') + '.jpg';
  const printable = value => typeof value === 'number' && Number.isFinite(value) ? value : String(value);
  return {
    observe({ timestamp, receivedAt, sha256, sessionId }) {
      // Acknowledgement is independent of admission, including stale callbacks.
      acknowledge(sessionId);
      const rawIndex = rawCdpFrames++;
      const reason = !accepting ? 'after-stream-stop'
        : typeof timestamp !== 'number' || !Number.isFinite(timestamp) ? 'nonfinite-timestamp'
        : priorTimestamp !== null && timestamp < priorTimestamp ? 'backward-timestamp'
        : timestamp === priorTimestamp ? 'duplicate-timestamp' : null;
      if (reason) {
        droppedFrames.push({ rawIndex, timestamp:printable(timestamp), priorTimestamp, receivedAt, reason, sha256 });
        return null;
      }
      priorTimestamp = timestamp;
      acceptedCdpFrames++;
      return { file:filename(), timestamp, receivedAt, sha256, rawIndex };
    },
    stop() { accepting = false; },
    finalFilename() { return filename(); },
    stats() {
      return {
        policy:'Acknowledge every observed CDP frame; retain strictly increasing finite timestamps. Omit and log invalid, duplicate, backward, or post-stop events. Never sort or rewrite retained timestamps.',
        rawCdpFrames, acceptedCdpFrames, droppedCdpFrames:droppedFrames.length,
        droppedFrames:droppedFrames.map(frame => ({ ...frame })),
      };
    },
  };
}
