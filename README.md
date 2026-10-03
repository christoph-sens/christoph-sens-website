# christoph-sens.com

Website von Christoph Sens – Kotlin- und Java-Backends auf AWS. Statische Seite mit [Astro](https://astro.build), Deutsch und Englisch.

## Befehle

| Befehl            | Zweck                                         |
| ----------------- | --------------------------------------------- |
| `npm install`     | Abhängigkeiten installieren                   |
| `npm run dev`     | Dev-Server auf `http://localhost:4321`        |
| `npm run check`   | Typprüfung (`astro check`)                    |
| `npm run build`   | Statische Seite nach `dist/` bauen            |
| `npm run preview` | Gebaute Seite lokal ansehen                   |

## Struktur

```
src/
  i18n/ui.ts          Sprachen, URLs je Seite und Sprache, gemeinsame Texte (Navigation, Kontakt, Footer)
  data/home.ts        Inhalte der Startseite (de/en)
  data/services.ts    Inhalte der Leistungsseite (de/en)
  data/stories.ts     Success Stories (de/en) – Abschnitte als Block-Liste
  layouts/            BaseLayout: <head>, hreflang, Header, Kontaktbereich, Footer
  components/         Header, Contact, Footer, CodeCard, StoryCard, PageHero
  views/              Seitenvorlagen: HomeView, ServicesView, StoryView
  pages/              Routen – je Seite nur eine Zeile, die die View mit Sprache aufruft
  styles/global.css   Design-Tokens (Farben, Schriften, Abstände) und gemeinsame Klassen
```

| Seite             | Deutsch                                       | Englisch                                         |
| ----------------- | --------------------------------------------- | ------------------------------------------------ |
| Startseite        | `/`                                           | `/en/`                                           |
| Leistungen        | `/leistungen/`                                | `/en/services/`                                  |
| Story Kotlin      | `/success-stories/kotlin-extended-clients/`   | `/en/success-stories/kotlin-extended-clients/`   |
| Story PDF         | `/success-stories/pdf-generierung/`           | `/en/success-stories/pdf-generation/`            |

Texte ändern: in `src/data/*` bzw. `src/i18n/ui.ts`. Neue Seite: URL in `routes` eintragen, View bauen, Route unter `src/pages` (de) und `src/pages/en` anlegen.

Schriften (Bricolage Grotesque, IBM Plex Sans, JetBrains Mono) sind über Fontsource selbst gehostet – es werden keine Google-Server angefragt.
