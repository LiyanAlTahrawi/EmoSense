/**
 * Browsers record WebM/Ogg/MP4 by default, but the EmoSense API accepts
 * .wav/.mp3/.m4a/.ogg/.flac. We decode the real recording and re-encode it
 * as 16 kHz mono 16-bit PCM WAV (a native format for Whisper and Emotion2Vec+).
 * This is a true transcode — never a file rename.
 */
export async function convertToWav(blob: Blob, targetRate = 16000) {
  const AudioCtx =
  window.AudioContext ??
  (window as unknown as {webkitAudioContext: typeof AudioContext;}).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const length = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineAudioContext(1, length, targetRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const v = Math.abs(samples[i]);
      if (v > peak) peak = v;
    }
    return { blob: encodeWav(samples, targetRate), duration: decoded.duration, peak };
  } finally {
    void ctx.close();
  }
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
}