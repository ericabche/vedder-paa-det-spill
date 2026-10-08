// main.js – starter spillet og kobler knapper til spillogikken.

import { Spill, FASE } from './game.js';
import { hentKategorier, Kortstokk } from './cards.js';
import { Timer } from './timer.js';
import * as ui from './ui.js';
import * as lyd from './lyd.js';

const $ = (id) => document.getElementById(id);

let spill;
const timer = new Timer({
  onTikk: (sek) => {
    ui.visTid(sek);
    if (sek >= 1 && sek <= 3) {
      lyd.nedtelling(sek);
      lyd.vibrer('nedtelling');
    }
  },
  onFerdig: () => utfor(() => spill.avsluttBevis()),
});

// Spiller lyd og vibrasjon når spillet går over i en ny fase.
function lydForFaseskifte(fra, til) {
  if (fra === til) return;
  if (til === FASE.RESULTAT) {
    // Man kan bare feile ved at tiden går ut, så tap = buzzer.
    if (spill.resultat.klarte) {
      lyd.seier();
      lyd.vibrer('seier');
    } else {
      lyd.buzzer();
      lyd.vibrer('buzzer');
    }
  }
  if (til === FASE.SLUTT) {
    lyd.fanfare();
    lyd.vibrer('seier');
  }
}

function oppdaterLydknapp() {
  const knapp = $('lyd-knapp');
  const paa = lyd.erPaa();
  knapp.setAttribute('aria-pressed', paa);
  knapp.querySelector('.lyd-tekst').textContent = paa ? 'Lyd på' : 'Lyd av';
}

// Kjører en handling, viser eventuelle feil/meldinger og tegner skjermen på nytt.
function utfor(handling) {
  ui.visMelding('');
  const forrigeFase = spill.fase;
  try {
    handling();
  } catch (feil) {
    ui.visMelding(feil.message);
  }
  if (spill.melding) {
    ui.visMelding(spill.melding);
    spill.melding = null;
  }
  // Ny bevisrunde: nullstill timer-visningen
  if (spill.fase === FASE.BEVIS && forrigeFase !== FASE.BEVIS) {
    timer.stopp();
    ui.visTid(spill.tid);
    ui.settBevisAktiv(false);
  }
  lydForFaseskifte(forrigeFase, spill.fase);
  ui.oppdater(spill);
}

const tall = (id) => Number($(id).value);

function kobleHendelser() {
  // Lyd: nettlesere tillater bare lyd etter at brukeren har trykket på noe,
  // så lydmotoren startes ved første trykk på siden.
  document.addEventListener('pointerdown', lyd.aktiver);
  document.addEventListener('keydown', lyd.aktiver);
  $('lyd-knapp').addEventListener('click', () => {
    lyd.settPaa(!lyd.erPaa());
    oppdaterLydknapp();
    if (lyd.erPaa()) lyd.riktig(); // lite pip som bekreftelse
  });

  // Oppsett
  $('ny-spiller-skjema').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('spillernavn');
    utfor(() => spill.leggTilSpiller(input.value));
    input.value = '';
    input.focus();
  });
  $('spillerliste').addEventListener('click', (e) => {
    const knapp = e.target.closest('.fjern-knapp');
    if (knapp) utfor(() => spill.fjernSpiller(Number(knapp.dataset.index)));
  });
  $('start-knapp').addEventListener('click', () =>
    utfor(() => {
      spill.kortstokk.velgTemaer(ui.valgteTemaer());
      spill.start();
    })
  );

  // Temavalg
  $('tema-liste').addEventListener('change', () => ui.oppdater(spill));
  $('velg-alle-temaer').addEventListener('click', () => {
    ui.velgAlleTemaer(true);
    ui.oppdater(spill);
  });
  $('fjern-alle-temaer').addEventListener('click', () => {
    ui.velgAlleTemaer(false);
    ui.oppdater(spill);
  });

  // Tidsvalg på kortet
  document.querySelector('.tid-velger').addEventListener('click', (e) => {
    const knapp = e.target.closest('button[data-tid]');
    if (knapp) utfor(() => spill.settTid(Number(knapp.dataset.tid)));
  });

  // Budrunde
  $('by-knapp').addEventListener('click', () => utfor(() => spill.by(tall('bud-input'))));
  $('bud-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') utfor(() => spill.by(tall('bud-input')));
  });
  $('pass-knapp').addEventListener('click', () => utfor(() => spill.pass()));

  // Oppleseren velger
  $('betcha-knapp').addEventListener('click', () => utfor(() => spill.tipperDuIkke()));
  $('bet-i-can-knapp').addEventListener('click', () =>
    utfor(() => spill.vedderPaaDet(tall('oppleser-bud-input')))
  );

  // Bevis
  $('start-timer-knapp').addEventListener('click', () => {
    lyd.start();
    timer.start(spill.tid);
    ui.settBevisAktiv(true);
  });
  $('riktig-knapp').addEventListener('click', () =>
    utfor(() => {
      const ferdig = spill.registrerRiktig();
      if (!ferdig) {
        lyd.riktig(); // siste riktige får seierslyden i stedet
        lyd.vibrer('riktig');
      }
      if (ferdig) {
        timer.stopp();
        spill.avsluttBevis();
      }
    })
  );

  // Resultat og Time Out
  $('neste-knapp').addEventListener('click', () => utfor(() => spill.neste()));
  $('timeout-liste').addEventListener('click', (e) => {
    const knapp = e.target.closest('button[data-index]');
    if (!knapp) return;
    utfor(() => spill.utbrudd(Number(knapp.dataset.index)));
  });
  $('ingen-utfordring-knapp').addEventListener('click', () => utfor(() => spill.ingenUtfordring()));

  // Slutt
  $('nytt-spill-knapp').addEventListener('click', () => utfor(() => spill.nyttSpill()));
}

async function init() {
  try {
    const kategorier = await hentKategorier();
    const kortstokk = new Kortstokk(kategorier);
    spill = new Spill(kortstokk);
    ui.tegnTemaer(kortstokk.temaer);
    kobleHendelser();
    oppdaterLydknapp();
    ui.oppdater(spill);
  } catch (feil) {
    console.error(feil);
    ui.visMelding(`${feil.message} Kjører du siden via en lokal server?`);
  }
}

init();