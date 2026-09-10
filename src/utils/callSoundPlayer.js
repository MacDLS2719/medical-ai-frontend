// Utility for playing calling and ringing tones using Web Audio API

class CallSoundPlayer {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Tono de marcación saliente ('calling') -> 440Hz + 480Hz por 1.8s cada 3.5s
  playOutgoingRing() {
    this.stop();
    this.initContext();
    if (!this.audioCtx) return;

    const playDialTone = () => {
      if (!this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (e) {
        console.error('Error playing outgoing tone:', e);
      }
    };

    playDialTone();
    this.intervalId = setInterval(playDialTone, 3500);
  }

  // Tono de llamada entrante ('ringing') -> Chime melodioso cada 2.5s
  playIncomingRing() {
    this.stop();
    this.initContext();
    if (!this.audioCtx) return;

    const playIncomingChime = () => {
      if (!this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;

        // Beep 1: 480Hz -> 520Hz
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(480, now);
        osc1.frequency.exponentialRampToValueAtTime(520, now + 0.35);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Beep 2: 520Hz -> 660Hz
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(520, now + 0.45);
        osc2.frequency.exponentialRampToValueAtTime(660, now + 0.8);
        gain2.gain.setValueAtTime(0.18, now + 0.45);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.45);
        osc2.stop(now + 0.8);
      } catch (e) {
        console.error('Error playing incoming ringtone:', e);
      }
    };

    playIncomingChime();
    this.intervalId = setInterval(playIncomingChime, 2500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const callSoundPlayer = new CallSoundPlayer();
