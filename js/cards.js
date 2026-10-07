// cards.js – laster kategorier og trekker tilfeldige kort uten gjentakelse.

export async function hentKategorier(url = 'data/kategorier.json') {
  const svar = await fetch(url);
  if (!svar.ok) throw new Error(`Kunne ikke laste kategorier (${svar.status}).`);
  return svar.json();
}

export class Kortstokk {
  constructor(kort) {
    if (!Array.isArray(kort) || kort.length === 0) {
      throw new Error('Kortstokken er tom.');
    }
    this.alle = [...kort];
    this.stokk();
  }

  // Fisher–Yates-stokking
  stokk() {
    this.bunke = [...this.alle];
    for (let i = this.bunke.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bunke[i], this.bunke[j]] = [this.bunke[j], this.bunke[i]];
    }
  }

  // Trekker et kort. Når bunken er tom, stokkes alle kortene på nytt.
  trekk() {
    if (this.bunke.length === 0) this.stokk();
    return this.bunke.pop();
  }
}