/**
 * Client-side Vietnamese Audio Player for Grade 1 Primary Students
 * Plays natural Vietnamese TTS audio files at a gentle, clear 0.9x playback rate.
 * Auto-cleans up on navigation, modal dismiss, or component unmount.
 */

let currentAudio: HTMLAudioElement | null = null;
let currentOnEndedCallback: (() => void) | null = null;

export function stopVietnameseAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.removeAttribute('src');
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (currentOnEndedCallback) {
    try {
      currentOnEndedCallback();
    } catch {}
    currentOnEndedCallback = null;
  }
}

export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused && !currentAudio.ended;
}

export function playVietnameseAudio(
  audioUrl?: string,
  fallbackText?: string,
  onStart?: () => void,
  onEnded?: () => void
): HTMLAudioElement | null {
  // 1. Stop any currently active audio first
  stopVietnameseAudio();

  if (!audioUrl && !fallbackText) return null;

  // 2. Play via audio URL (primary path: pre-generated or dynamic MP3)
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      currentOnEndedCallback = onEnded || null;

      // 0.9x speed: gentle, crystal clear, unhurried cadence for 6-year-old first graders
      audio.playbackRate = 0.9;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        currentAudio = null;
        currentOnEndedCallback = null;
        if (onEnded) onEnded();
      };

      audio.onerror = () => {
        // Fallback to Web Speech API if audio file fails to load
        if (fallbackText) {
          playSpeechSynthesisFallback(fallbackText, onStart, onEnded);
        } else {
          currentAudio = null;
          currentOnEndedCallback = null;
          if (onEnded) onEnded();
        }
      };

      audio.play().catch(() => {
        // Autoplay policy or error -> try speech synthesis fallback
        if (fallbackText) {
          playSpeechSynthesisFallback(fallbackText, onStart, onEnded);
        } else {
          currentAudio = null;
          currentOnEndedCallback = null;
          if (onEnded) onEnded();
        }
      });

      return audio;
    } catch (e) {
      if (fallbackText) {
        playSpeechSynthesisFallback(fallbackText, onStart, onEnded);
      }
      return null;
    }
  }

  // 3. Fallback: Web Speech API
  if (fallbackText) {
    playSpeechSynthesisFallback(fallbackText, onStart, onEnded);
  }

  return null;
}

function playSpeechSynthesisFallback(
  text: string,
  onStart?: () => void,
  onEnded?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnded) onEnded();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.88; // Gentle pace
    utterance.pitch = 1.05; // Friendly warm pitch

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      currentAudio = null;
      currentOnEndedCallback = null;
      if (onEnded) onEnded();
    };

    utterance.onerror = () => {
      currentAudio = null;
      currentOnEndedCallback = null;
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnded) onEnded();
  }
}
