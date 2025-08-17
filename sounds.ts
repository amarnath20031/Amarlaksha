// Sound feedback system for Laksha Coach
export class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;

  private constructor() {
    // Check user preference for sounds
    const soundPref = localStorage.getItem('laksha-sounds-enabled');
    this.enabled = soundPref !== 'false';
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  // Create audio using Web Audio API with fallback
  private createAudio(frequency: number, duration: number, type: 'sine' | 'square' = 'sine'): void {
    if (!this.enabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio not supported in this browser');
    }
  }

  // Success sound - coin drop effect
  playExpenseAdded(): void {
    this.createAudio(800, 0.2);
    setTimeout(() => this.createAudio(600, 0.15), 100);
    setTimeout(() => this.createAudio(400, 0.1), 200);
  }

  // Mission complete sound
  playMissionComplete(): void {
    this.createAudio(523, 0.2); // C
    setTimeout(() => this.createAudio(659, 0.2), 150); // E
    setTimeout(() => this.createAudio(784, 0.3), 300); // G
  }

  // Streak milestone sound
  playStreakMilestone(): void {
    this.createAudio(440, 0.15); // A
    setTimeout(() => this.createAudio(554, 0.15), 100); // C#
    setTimeout(() => this.createAudio(659, 0.15), 200); // E
    setTimeout(() => this.createAudio(880, 0.25), 300); // A (higher)
  }

  // Toggle sound on/off
  toggleSounds(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('laksha-sounds-enabled', this.enabled.toString());
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}