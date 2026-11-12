export type SoundEffectName =
  | 'click'
  | 'select'
  | 'reelSpin'
  | 'reelStop'
  | 'combo'
  | 'rouletteTick'
  | 'diceRoll'
  | 'cardDeal'
  | 'cardFlip'
  | 'cupSwap'
  | 'plinkoPeg'
  | 'upgradeCharge'
  | 'win'
  | 'loss'
  | 'roundEnd';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.35;

  public configure(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.35));
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || this.volume <= 0.001) return null;
    if (typeof window === 'undefined') return null;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    gainScale: number,
    delay = 0,
    endFreq?: number
  ): void {
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    const peak = Math.min(0.4, this.volume * gainScale);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.01);
  }

  public play(effect: SoundEffectName): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      switch (effect) {
        case 'click':
          this.playTone(ctx, 560, 0.045, 'triangle', 0.16, 0, 380);
          break;
        case 'select':
          this.playTone(ctx, 480, 0.07, 'sine', 0.2, 0, 640);
          this.playTone(ctx, 720, 0.09, 'sine', 0.18, 0.045);
          break;
        case 'reelSpin':
          this.playTone(ctx, 220, 0.08, 'triangle', 0.14, 0, 340);
          break;
        case 'reelStop':
          this.playTone(ctx, 190, 0.06, 'square', 0.12, 0, 110);
          break;
        case 'rouletteTick':
          this.playTone(ctx, 980, 0.025, 'triangle', 0.11, 0, 620);
          break;
        case 'diceRoll':
          this.playTone(ctx, 320, 0.045, 'triangle', 0.16, 0, 180);
          this.playTone(ctx, 440, 0.045, 'triangle', 0.15, 0.055, 250);
          this.playTone(ctx, 380, 0.05, 'triangle', 0.14, 0.11, 210);
          break;
        case 'cardDeal':
          this.playTone(ctx, 740, 0.04, 'sine', 0.14, 0, 360);
          break;
        case 'cardFlip':
          this.playTone(ctx, 520, 0.055, 'triangle', 0.16, 0, 780);
          break;
        case 'cupSwap':
          this.playTone(ctx, 280, 0.05, 'sine', 0.12, 0, 350);
          break;
        case 'plinkoPeg':
          this.playTone(ctx, 880, 0.035, 'sine', 0.11, 0, 1040);
          break;
        case 'upgradeCharge':
          this.playTone(ctx, 240, 0.28, 'sine', 0.18, 0, 660);
          break;
        case 'combo':
          [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
            this.playTone(ctx, f, 0.14, 'triangle', 0.22, idx * 0.055);
          });
          break;
        case 'win':
          [440, 554.37, 659.25, 880].forEach((f, idx) => {
            this.playTone(ctx, f, 0.18, 'sine', 0.24, idx * 0.06);
          });
          break;
        case 'loss':
          this.playTone(ctx, 293.66, 0.14, 'sine', 0.16, 0, 261.63);
          this.playTone(ctx, 220, 0.2, 'sine', 0.14, 0.09, 185);
          break;
        case 'roundEnd':
          this.playTone(ctx, 620, 0.09, 'sine', 0.16, 0);
          break;
      }
    } catch {
      // Never throw on audio playback failures
    }
  }
}

export const soundEngine = new SoundEngine();
