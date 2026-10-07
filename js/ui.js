// ui.js – leser tilstanden fra Spill og oppdaterer DOM-en. Ingen spillregler her.

import { FASE, KONFIG } from './game.js'; // eslint-disable-line no-unused-vars

const $ = (id) => document.getElementById(id);

const SKJERMER = {
  [FASE.OPPSETT]: 'skjerm-oppsett',
  [FASE.BUDRUNDE]: 'skjerm-budrunde',
  [FASE.OPPLESER_VELGER]: 'skjerm-oppleser',
  [FASE.BEVIS]: 'skjerm-bevis',
  [FASE.RESULTAT]: 'skjerm-resultat',
  [FASE.TIME_OUT]: 'skjerm-timeout',
  [FASE.SLUTT]: 'skjerm-slutt',
};

// Meldingsfelt lages her, så det ikke trengs i HTML-en.
const meldingEl = document.createElement('p');
meldingEl.id = 'melding';
meldingEl.setAttribute('role', 'alert');
meldingEl.hidden = true; // skjult til det finnes en melding
document.querySelector('main').prepend(meldingEl);

export function visMelding(tekst) {
  meldingEl.textContent = tekst;
  meldingEl.hidden = !tekst;
}

export function visTid(sekunder) {
  const el = $('timer');
  el.textContent = sekunder;
  el.classList.toggle('lite-tid', sekunder <= 3);
}

export function settBevisAktiv(aktiv) {
  $('riktig-knapp').disabled = !aktiv;
  $('start-timer-knapp').hidden = aktiv;
}

// Temaer som må velges bevisst: de er av ved start og tas ikke med i «Velg alle».
const VOKSENTEMAER = new Set(['18+']);

/** Lager én avkrysningsbrikke per tema. Kalles én gang ved oppstart. */
export function tegnTemaer(temaer) {
  $('tema-liste').replaceChildren(
    ...temaer.map(({ navn, kort }) => {
      const voksen = VOKSENTEMAER.has(navn);
      const label = document.createElement('label');
      label.className = voksen ? 'tema-brikke tema-voksen' : 'tema-brikke';
      const boks = document.createElement('input');
      boks.type = 'checkbox';
      boks.name = 'tema';
      boks.value = navn;
      boks.checked = !voksen;
      const sjekk = document.createElement('span');
      sjekk.className = 'tema-sjekk';
      sjekk.setAttribute('aria-hidden', 'true');
      sjekk.textContent = '✓';
      const tekst = document.createElement('span');
      tekst.className = 'tema-navn';
      tekst.textContent = navn;
      const antall = document.createElement('small');
      antall.textContent = kort;
      label.append(boks, sjekk, tekst, antall);
      return label;
    })
  );
}

export function valgteTemaer() {
  return [...document.querySelectorAll('#tema-liste input:checked')].map((b) => b.value);
}

export function velgAlleTemaer(valgt) {
  document.querySelectorAll('#tema-liste input').forEach((b) => {
    if (valgt && VOKSENTEMAER.has(b.value)) return; // 18+ slås bare på manuelt
    b.checked = valgt;
  });
}

export function oppdater(spill) {
  for (const [fase, id] of Object.entries(SKJERMER)) {
    $(id).hidden = fase !== spill.fase;
  }
  tegnPoengtavle(spill);

  const navn = (i) => spill.spillere[i]?.navn ?? '';

  switch (spill.fase) {
    case FASE.OPPSETT: {
      $('spillerliste').replaceChildren(
        ...spill.spillere.map((s, i) => {
          const li = document.createElement('li');
          const initial = document.createElement('span');
          initial.className = 'initial';
          initial.textContent = s.navn.charAt(0).toUpperCase();
          const navnEl = document.createElement('span');
          navnEl.className = 'navn';
          navnEl.textContent = s.navn;
          li.append(initial, navnEl);
          const fjern = document.createElement('button');
          fjern.textContent = '✕';
          fjern.className = 'fjern-knapp';
          fjern.dataset.index = i;
          fjern.setAttribute('aria-label', `Fjern ${s.navn}`);
          li.append(fjern);
          return li;
        })
      );
      const temaer = valgteTemaer();
      const antallKort = spill.kortstokk.antallKort(temaer);
      $('tema-antall').textContent = antallKort === 0
        ? 'Ingen temaer valgt'
        : `${antallKort} kort valgt`;
      $('start-knapp').disabled = !spill.kanStarte || antallKort === 0;
      const mangler = Math.max(0, KONFIG.MIN_SPILLERE - spill.spillere.length);
      $('spiller-hint').textContent = mangler > 0
        ? `Legg til ${mangler} ${mangler === 1 ? 'spiller' : 'spillere'} til for å starte`
        : `${spill.spillere.length} spillere klare!`;
      break;
    }

    case FASE.BUDRUNDE: {
      $('oppleser-navn').textContent = navn(spill.oppleser);
      $('kategori-tekst').textContent = spill.kategori.tekst;
      document.querySelectorAll('.tid-velger button').forEach((knapp) => {
        const aktiv = Number(knapp.dataset.tid) === spill.tid;
        knapp.classList.toggle('aktiv', aktiv);
        knapp.setAttribute('aria-pressed', aktiv);
      });
      visKommentar('kategori-kommentar', spill.kategori);
      $('hoyeste-bud').textContent = spill.bud?.tall ?? '–';
      $('hoyeste-byder').textContent = spill.bud ? navn(spill.bud.spiller) : 'ingen';
      $('aktiv-spiller').textContent = navn(spill.aktivSpiller);
      const input = $('bud-input');
      input.min = spill.minsteBud;
      input.value = '';
      input.placeholder = spill.minsteBud;
      input.focus();
      break;
    }

    case FASE.OPPLESER_VELGER: {
      $('oppleser-navn-2').textContent = navn(spill.oppleser);
      const input = $('oppleser-bud-input');
      input.min = spill.minsteBud;
      input.value = '';
      input.placeholder = spill.minsteBud;
      break;
    }

    case FASE.BEVIS: {
      const u = spill.utfordring;
      $('utfordret-navn').textContent = navn(u.spiller);
      $('mal-antall').textContent = u.mal;
      $('mal-antall-2').textContent = u.mal;
      $('antall-riktige').textContent = u.riktige;
      $('bevis-kategori-tekst').textContent = spill.kategori.tekst;
      visKommentar('bevis-kommentar', spill.kategori);
      break;
    }

    case FASE.RESULTAT: {
      const r = spill.resultat;
      const n = navn(r.spiller);
      let tekst;
      if (r.erUtbrudd) {
        tekst = r.klarte ? `${n} er ute av Time Out og får et kort!` : `${n} blir i Time Out.`;
      } else if (r.klarte) {
        tekst = `${n} klarte det og vinner kortet!`;
      } else if (r.mistetKort) {
        tekst = `${n} klarte det ikke og mister et kort.`;
      } else {
        tekst = `${n} klarte det ikke – Time Out!`;
      }
      const el = $('resultat-tekst');
      el.textContent = tekst;
      el.classList.toggle('seier', r.klarte);
      el.classList.toggle('tap', !r.klarte);
      break;
    }

    case FASE.TIME_OUT: {
      $('utbrudd-mal').textContent = spill.utbruddMal;
      $('timeout-liste').replaceChildren(
        ...spill.utbruddKandidater.map((i) => {
          const li = document.createElement('li');
          const navnEl = document.createElement('span');
          navnEl.textContent = navn(i); // textContent: trygt mot HTML i navn
          const knapp = document.createElement('button');
          knapp.textContent = 'Prøv';
          knapp.dataset.index = i;
          li.append(navnEl, ' ', knapp);
          return li;
        })
      );
      break;
    }

    case FASE.SLUTT: {
      $('vinner-slutt').textContent = spill.vinner.navn;
      break;
    }
  }
}

// Fyller nedtrekksboksen med kortets kommentar. Boksen skjules hvis kortet
// ikke har kommentar, og lukkes når et nytt kort vises.
function visKommentar(id, kategori) {
  const boks = $(id);
  const tekst = kategori?.kommentar ?? '';
  if (boks.dataset.kortId !== String(kategori?.id)) {
    boks.open = false;
    boks.dataset.kortId = kategori?.id;
  }
  boks.querySelector('p').textContent = tekst;
  boks.hidden = !tekst;
}

function tegnPoengtavle(spill) {
  const vis = spill.fase !== FASE.OPPSETT;
  $('poengtavle').replaceChildren(
    ...(vis ? spill.spillere : []).map((s, i) => {
      const li = document.createElement('li');
      li.textContent = `${s.navn}: ${s.kort}`;
      li.classList.toggle('timeout', s.timeout);
      li.classList.toggle('oppleser', i === spill.oppleser);
      return li;
    })
  );
}