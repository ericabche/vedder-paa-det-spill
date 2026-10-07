// timer.js – nedtelling basert på klokketid, så den ikke "driver" hvis fanen henger.

export class Timer {
  constructor({ onTikk = () => {}, onFerdig = () => {} } = {}) {
    this.onTikk = onTikk;
    this.onFerdig = onFerdig;
    this.id = null;
    this.igjen = 0;
  }

  get kjorer() {
    return this.id !== null;
  }

  start(sekunder) {
    this.stopp();
    const slutt = Date.now() + sekunder * 1000;
    this.igjen = sekunder;
    this.onTikk(this.igjen);

    this.id = setInterval(() => {
      const igjen = Math.max(0, Math.ceil((slutt - Date.now()) / 1000));
      if (igjen !== this.igjen) {
        this.igjen = igjen;
        this.onTikk(igjen);
      }
      if (igjen === 0) {
        this.stopp();
        this.onFerdig();
      }
    }, 100);
  }

  stopp() {
    clearInterval(this.id);
    this.id = null;
  }
}