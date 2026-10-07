// main.js – starter spillet og kobler knapper til spillogikken.

import { Spill, FASE } from './game.js';
import { hentKategorier, Kortstokk } from './cards.js';
import { Timer } from './timer.js';
import * as ui from './ui.js';

const $ = (id) => document.getElementById(id);

let spill;
const timer = new Timer({
  onTikk: (sek) => ui.visTid(sek),
  onFerdig: () => utfor(() => spill.avsluttBevis()),
});

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
  ui.oppdater(spill);
}

const tall = (id) => Number($(id).value);

function kobleHendelser() {
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
  $('start-knapp').addEventListener('click', () => utfor(() => spill.start()));

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
    timer.start(spill.tid);
    ui.settBevisAktiv(true);
  });
  $('riktig-knapp').addEventListener('click', () =>
    utfor(() => {
      if (spill.registrerRiktig()) {
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
    spill = new Spill(new Kortstokk(kategorier));
    kobleHendelser();
    ui.oppdater(spill);
  } catch (feil) {
    console.error(feil);
    ui.visMelding(`${feil.message} Kjører du siden via en lokal server?`);
  }
}

init();