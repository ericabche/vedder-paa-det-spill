// cards.js – laster kategorier, filtrerer på tema og trekker tilfeldige kort uten gjentakelse.

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
    this.kilde = [...kort]; // alle kortene, uansett tema
    this.alle = [...kort];  // kortene som er med i spillet
    this.stokk();
  }

  /** Alle temaer med antall kort, i den rekkefølgen de står i filen. */
  get temaer() {
    const antall = new Map();
    for (const k of this.kilde) {
      const tema = k.tema ?? 'Annet';
      antall.set(tema, (antall.get(tema) ?? 0) + 1);
    }
    return [...antall].map(([navn, kort]) => ({ navn, kort }));
  }

  /** Antall kort som blir med hvis disse temaene velges. */
  antallKort(temaer) {
    const valgt = new Set(temaer);
    return this.kilde.filter((k) => valgt.has(k.tema ?? 'Annet')).length;
  }

  /** Begrenser kortstokken til de valgte temaene og stokker på nytt. */
  velgTemaer(temaer) {
    const valgt = new Set(temaer);
    const kort = this.kilde.filter((k) => valgt.has(k.tema ?? 'Annet'));
    if (kort.length === 0) throw new Error('Velg minst ett tema.');
    this.alle = kort;
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

  // Trekker et kort. Når bunken er tom, stokkes kortene på nytt.
  trekk() {
    if (this.bunke.length === 0) this.stokk();
    return this.bunke.pop();
  }
}