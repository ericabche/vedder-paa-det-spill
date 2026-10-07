# Vedder på det! 🎲

*Spillet om å overby* – et norsk festspill i nettleseren for 3 eller flere spillere.

Spillerne vedder på hvor mange ting de klarer å nevne innenfor en kategori, for eksempel «Nevn hunderaser», på 10, 15 eller 20 sekunder. Den som byr høyest kan bli utfordret til å bevise det. Første spiller til 5 kort vinner!

Spillet styres fra én enhet, for eksempel en mobil eller en skjerm alle ser.

## Kom i gang

Spillet er laget med vanlig HTML, CSS og JavaScript, uten rammeverk eller byggesteg. Det må likevel kjøres via en lokal server, fordi nettleseren blokkerer JavaScript-moduler og lasting av JSON når siden åpnes direkte som fil.

**Med VS Code:** Installer utvidelsen *Live Server*, høyreklikk på `index.html` og velg *Open with Live Server*.

**Med terminalen:**

```bash
npx serve
```

Åpne deretter adressen som vises, for eksempel `http://localhost:3000`.

## Slik spiller du

1. **Kortet trekkes.** Oppleseren leser opp en kategori. Kortet foreslår en tid (10, 15 eller 20 sekunder) ut fra hvor vanskelig det er, og Oppleseren kan endre den.
2. **Budrunde.** Spillerne byr med klokka på hvor mange ting de kan nevne, eller passer.
3. **Oppleseren velger.** Enten *«Tipper du ikke klarer det!»*, så må høyeste byder bevise det, eller *«Vedder på at jeg kan det!»*, så byr Oppleseren høyere og må bevise det selv.
4. **Bevis det!** Timeren starter, og de andre teller riktige svar.
5. **Resultat.** Klarer du det, vinner du kortet. Klarer du det ikke, mister du et kort. Har du ingen kort, havner du i **Time Out**.

Alle starter med 1 kort. Spillere i Time Out kan prøve å komme ut i neste runde ved å nevne utfordrerens tall pluss ekstratallet på kortet.

De fullstendige reglene finnes også i spillet under «Slik spiller du».

## Mappestruktur

```
├── index.html            # Alle skjermene i spillet
├── css/
│   └── style.css         # Utseende
├── js/
│   ├── main.js           # Starter spillet og kobler knapper til logikken
│   ├── game.js           # Spillregler og tilstand (ingen DOM)
│   ├── ui.js             # Viser riktig skjerm og oppdaterer innholdet
│   ├── timer.js          # Nedtelling
│   └── cards.js          # Laster og stokker kategoriene
└── data/
    └── kategorier.json   # Kategoriene
```

Spillogikken i `game.js` er bygget som en tilstandsmaskin med fasene `OPPSETT → BUDRUNDE → OPPLESER_VELGER → BEVIS → RESULTAT → TIME_OUT → SLUTT`, og er holdt helt adskilt fra visningen.

## Legg til egne kategorier

Rediger `data/kategorier.json`. Hvert kort ser slik ut:

```json
{ "id": 200, "tema": "Film, TV og musikk", "tekst": "Nevn superhelter", "tid": 15, "ekstra": 2, "kommentar": "Superhelter fra tegneserier og filmer." }
```

- `tema` – hvilket tema kortet hører til. Nye temaer dukker automatisk opp på forsiden. Temaet `18+` er av som standard.
- `tid` – foreslått tid: 10 (lett), 15 eller 20 sekunder (vanskelig).
- `ekstra` – tallet som legges til når noen prøver å komme ut av Time Out.
- `kommentar` – vises under «Hva teller?» på kortet.

Uten `tid` brukes 10 sekunder, uten `ekstra` brukes 2, og uten `tema` havner kortet under «Annet».

## Innstillinger

Øverst i `js/game.js` ligger `KONFIG`, der du kan endre blant annet antall kort for å vinne, startkort, standard tid og minste antall spillere.

## Om prosjektet

Spillet er inspirert av kortspillet *Betcha Can't!* av Pressman Toy Corp. og Goliath Games, som bare finnes på engelsk. Dette er en uoffisiell, ikke-kommersiell norsk versjon med egne kategorier og tekster, og er ikke tilknyttet utgiverne.