// game.js – ren spillogikk. Ingen DOM her, bare tilstand og regler.

export const KONFIG = Object.freeze({
  KORT_FOR_SEIER: 5,
  STARTKORT: 1,        // alle får ett kort ved start
  STANDARD_TID: 10,    // sekunder, brukes hvis kortet ikke har egen "tid"
  STANDARD_EKSTRA: 2,  // ekstratall for utbrudd, brukes hvis kortet ikke har "ekstra"
  MIN_SPILLERE: 3,
});

export const FASE = Object.freeze({
  OPPSETT: 'OPPSETT',
  BUDRUNDE: 'BUDRUNDE',
  OPPLESER_VELGER: 'OPPLESER_VELGER',
  BEVIS: 'BEVIS',
  RESULTAT: 'RESULTAT',
  TIME_OUT: 'TIME_OUT',
  SLUTT: 'SLUTT',
});

export class Spill {
  constructor(kortstokk) {
    this.kortstokk = kortstokk;
    this.spillere = [];        // { navn, kort, timeout }
    this.fase = FASE.OPPSETT;
    this.oppleser = 0;         // indeks i spillere
    this.kategori = null;      // kortet som er trukket
    this.bud = null;           // { spiller, tall } – høyeste bud
    this.budKo = [];           // indekser som ennå ikke har budt/passet
    this.utfordring = null;    // { spiller, mal, riktige, erUtbrudd }
    this.rundensMal = null;    // utfordrerens tall denne runden – grunnlag for utbrudd
    this.ikkeUtbrudd = new Set(); // spillere som ikke kan prøve utbrudd denne runden
    this.resultat = null;      // { spiller, klarte, erUtbrudd, mistetKort }
    this.melding = null;       // info til UI (f.eks. "ingen bød")
  }

  // ---------- Oppsett ----------

  leggTilSpiller(navn) {
    this.#krevFase(FASE.OPPSETT);
    navn = navn.trim();
    if (!navn) throw new Error('Skriv inn et navn.');
    if (this.spillere.some((s) => s.navn.toLowerCase() === navn.toLowerCase())) {
      throw new Error(`${navn} er allerede med.`);
    }
    this.spillere.push({ navn, kort: KONFIG.STARTKORT, timeout: false });
  }

  fjernSpiller(indeks) {
    this.#krevFase(FASE.OPPSETT);
    this.spillere.splice(indeks, 1);
  }

  get kanStarte() {
    return this.spillere.length >= KONFIG.MIN_SPILLERE;
  }

  start() {
    this.#krevFase(FASE.OPPSETT);
    if (!this.kanStarte) {
      throw new Error(`Dere må være minst ${KONFIG.MIN_SPILLERE} spillere.`);
    }
    this.oppleser = 0;
    this.#nyRunde();
  }

  nyttSpill() {
    this.spillere.forEach((s) => { s.kort = KONFIG.STARTKORT; s.timeout = false; });
    this.kortstokk.stokk();
    this.fase = FASE.OPPSETT;
    this.start();
  }

  // ---------- Budrunde ----------

  get aktivSpiller() {
    return this.budKo[0] ?? null;
  }

  get minsteBud() {
    return (this.bud?.tall ?? 0) + 1;
  }

  by(tall) {
    this.#krevFase(FASE.BUDRUNDE);
    this.#sjekkBud(tall, this.minsteBud);
    this.bud = { spiller: this.budKo.shift(), tall };
    this.#etterBud();
  }

  pass() {
    this.#krevFase(FASE.BUDRUNDE);
    this.budKo.shift();
    this.#etterBud();
  }

  // ---------- Oppleseren velger ----------

  tipperDuIkke() {
    this.#krevFase(FASE.OPPLESER_VELGER);
    this.#startBevis(this.bud.spiller, this.bud.tall, false);
  }

  vedderPaaDet(tall) {
    this.#krevFase(FASE.OPPLESER_VELGER);
    this.#sjekkBud(tall, this.minsteBud);
    this.#startBevis(this.oppleser, tall, false);
  }

  // ---------- Bevis ----------

  get tid() {
    return this.kategori?.tid ?? KONFIG.STANDARD_TID;
  }

  /** Returnerer true når målet er nådd. */
  registrerRiktig() {
    this.#krevFase(FASE.BEVIS);
    this.utfordring.riktige++;
    return this.utfordring.riktige >= this.utfordring.mal;
  }

  avsluttBevis() {
    this.#krevFase(FASE.BEVIS);
    const { spiller: i, mal, riktige, erUtbrudd } = this.utfordring;
    const spiller = this.spillere[i];
    const klarte = riktige >= mal;
    let mistetKort = false;

    if (erUtbrudd) {
      // Klarer man utbruddet, er man ute av Time Out og får et kort.
      if (klarte) {
        spiller.timeout = false;
        spiller.kort++;
      }
    } else {
      this.rundensMal = mal;
      if (klarte) {
        spiller.kort++;
      } else if (spiller.kort > 0) {
        spiller.kort--;          // kortet går i kastebunken
        mistetKort = true;
      } else {
        spiller.timeout = true;  // ingen kort å miste → Time Out
        this.ikkeUtbrudd.add(i); // kan først prøve å komme ut neste runde
      }
    }

    this.resultat = { spiller: i, klarte, erUtbrudd, mistetKort };
    this.fase = FASE.RESULTAT;
  }

  // ---------- Resultat og Time Out ----------

  get vinner() {
    return this.spillere.find((s) => s.kort >= KONFIG.KORT_FOR_SEIER) ?? null;
  }

  get timeoutSpillere() {
    return this.spillere.flatMap((s, i) => (s.timeout ? [i] : []));
  }

  /** Spillere i Time Out som kan prøve å komme ut denne runden. */
  get utbruddKandidater() {
    return this.timeoutSpillere.filter((i) => !this.ikkeUtbrudd.has(i));
  }

  /** Utfordrerens tall + ekstratallet på kortet. */
  get utbruddMal() {
    return this.rundensMal + (this.kategori?.ekstra ?? KONFIG.STANDARD_EKSTRA);
  }

  neste() {
    this.#krevFase(FASE.RESULTAT);
    if (this.vinner) {
      this.fase = FASE.SLUTT;
    } else if (this.rundensMal !== null && this.utbruddKandidater.length > 0) {
      this.fase = FASE.TIME_OUT;
    } else {
      this.#nesteRunde();
    }
  }

  utbrudd(indeks) {
    this.#krevFase(FASE.TIME_OUT);
    if (!this.utbruddKandidater.includes(indeks)) {
      throw new Error('Denne spilleren kan ikke prøve å komme ut nå.');
    }
    this.ikkeUtbrudd.add(indeks); // ett forsøk per runde
    this.#startBevis(indeks, this.utbruddMal, true);
  }

  ingenUtfordring() {
    this.#krevFase(FASE.TIME_OUT);
    this.#nesteRunde();
  }

  // ---------- Private hjelpere ----------

  #nesteRunde() {
    this.oppleser = (this.oppleser + 1) % this.spillere.length;
    this.#nyRunde();
  }

  #nyRunde() {
    // Husregel: er færre enn 2 spillere igjen utenfor Time Out, slippes alle ut.
    if (this.spillere.filter((s) => !s.timeout).length < 2) {
      this.spillere.forEach((s) => { s.timeout = false; });
      this.melding = 'For mange i Time Out – alle er tilbake i spillet!';
    }
    if (this.spillere[this.oppleser].timeout) {
      this.oppleser = this.#nesteAktive(this.oppleser);
    }

    this.kategori = this.kortstokk.trekk();
    this.bud = null;
    this.utfordring = null;
    this.resultat = null;
    this.rundensMal = null;
    this.ikkeUtbrudd = new Set();

    // Budene går med klokka fra spilleren etter Oppleseren og tilbake.
    const n = this.spillere.length;
    this.budKo = [];
    for (let steg = 1; steg < n; steg++) {
      const i = (this.oppleser + steg) % n;
      if (!this.spillere[i].timeout) this.budKo.push(i);
    }
    this.fase = FASE.BUDRUNDE;
  }

  #etterBud() {
    if (this.budKo.length > 0) return;
    if (!this.bud) {
      this.melding = 'Ingen bød – nytt kort!';
      this.#nyRunde();
      return;
    }
    this.fase = FASE.OPPLESER_VELGER;
  }

  #startBevis(spiller, mal, erUtbrudd) {
    this.utfordring = { spiller, mal, riktige: 0, erUtbrudd };
    this.fase = FASE.BEVIS;
  }

  #nesteAktive(fra) {
    const n = this.spillere.length;
    for (let steg = 1; steg <= n; steg++) {
      const i = (fra + steg) % n;
      if (!this.spillere[i].timeout) return i;
    }
    return fra;
  }

  #sjekkBud(tall, minst) {
    if (!Number.isInteger(tall) || tall < minst) {
      throw new Error(`Budet må være et helt tall, minst ${minst}.`);
    }
  }

  #krevFase(fase) {
    if (this.fase !== fase) {
      throw new Error(`Ugyldig handling i fasen ${this.fase}.`);
    }
  }
}