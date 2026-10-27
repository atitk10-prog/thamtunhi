/**
 * Client-side Vietnamese Audio Player for Grade 1 Primary Students
 * Plays verified Vietnamese MP3 audio files at a gentle, clear 0.9x playback rate.
 * STRICT POLICY: ZERO browser speechSynthesis fallback to completely eliminate
 * foreign robotic English / broken voice playback on any device.
 */

let currentAudio: HTMLAudioElement | null = null;
let currentOnEndedCallback: (() => void) | null = null;
let currentOnErrorCallback: ((err: any) => void) | null = null;

export function stopVietnameseAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.removeAttribute('src');
    } catch {}
    currentAudio = null;
  }
  // Browser speechSynthesis is completely removed from the entire application
  if (currentOnEndedCallback) {
    try {
      currentOnEndedCallback();
    } catch {}
    currentOnEndedCallback = null;
  }
  currentOnErrorCallback = null;
}

export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused && !currentAudio.ended;
}

/**
 * Plays genuine Vietnamese MP3 audio file.
 * If audio is missing, 404, blocked by autoplay, or errors: triggers onError and onEnded.
 * ABSOLUTELY NEVER falls back to window.speechSynthesis to prevent foreign/robotic voices.
 */
export function playVietnameseAudio(
  audioUrl?: string,
  _deprecatedFallbackText?: string,
  onStart?: () => void,
  onEnded?: () => void,
  onError?: (err: any) => void
): HTMLAudioElement | null {
  // 1. Stop any currently active audio first
  stopVietnameseAudio();

  const cleanUrl = typeof audioUrl === 'string' ? audioUrl.trim() : '';
  if (!cleanUrl) {
    if (onError) onError(new Error('Chưa có tệp âm thanh'));
    if (onEnded) onEnded();
    return null;
  }

  // 2. Play via genuine audio URL (pre-generated or verified MP3)
  try {
    const audio = new Audio(cleanUrl);
    currentAudio = audio;
    currentOnEndedCallback = onEnded || null;
    currentOnErrorCallback = onError || null;

    // 0.9x speed: gentle, crystal clear, unhurried cadence for 6-year-old first graders
    audio.playbackRate = 0.9;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      currentAudio = null;
      currentOnEndedCallback = null;
      currentOnErrorCallback = null;
      if (onEnded) onEnded();
    };

    audio.onerror = (e) => {
      currentAudio = null;
      const errCb = currentOnErrorCallback;
      currentOnEndedCallback = null;
      currentOnErrorCallback = null;
      if (errCb) {
        errCb(e || new Error('Tệp âm thanh lỗi hoặc không tồn tại (404)'));
      }
      if (onEnded) onEnded();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy or load error -> report error cleanly, DO NOT call speechSynthesis
        currentAudio = null;
        const errCb = currentOnErrorCallback;
        currentOnEndedCallback = null;
        currentOnErrorCallback = null;
        if (errCb) {
          errCb(err);
        }
        if (onEnded) onEnded();
      });
    }

    return audio;
  } catch (e) {
    currentAudio = null;
    currentOnEndedCallback = null;
    currentOnErrorCallback = null;
    if (onError) onError(e);
    if (onEnded) onEnded();
    return null;
  }
}
