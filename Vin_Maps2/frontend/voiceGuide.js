// frontend/voiceGuide.js
// Simple voice guide using the Web Speech API.
// Exposes a global function `speakInstruction(text)` that reads the given text aloud.

function speakInstruction(text) {
  if (!('speechSynthesis' in window)) return;
  // Cancel any ongoing speech to avoid overlap
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  // Use the browser's default language or fallback to English US
  utterance.lang = navigator.language || 'en-US';
  // Simple voice settings – can be tuned later
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// Expose globally for the navigation flow to call.
window.speakInstruction = speakInstruction;
