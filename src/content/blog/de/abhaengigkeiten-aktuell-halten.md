---
title: 'Abhängigkeiten aktuell halten: Warum Renovate und Dependabot zu jeder Codebasis gehören'
description: 'Software altert, auch wenn niemand sie anfasst. Warum viele kleine Updates günstiger sind als seltene große Migrationen, wie Renovate und Dependabot den Entwickleralltag entlasten – und wann sich der Prozess bei ausreichender Testabdeckung vollständig automatisieren lässt.'
date: 2026-11-07
key: abhaengigkeiten-aktuell-halten
category: article
tags: [Dependabot, Renovate, Security, CI/CD, Testing]
---

Kaum ein Entwicklungsteam beschließt bewusst, veraltete Software zu betreiben. Es passiert trotzdem. Ein Projekt geht live, das Team zieht zum nächsten Feature weiter, und die `package.json`, `pom.xml` oder `build.gradle.kts` bleibt auf dem Stand vom Release-Tag. Zwei Jahre später steht ein Framework-Upgrade über drei Major-Versionen an. Niemand traut sich so recht heran, und eine kritische Sicherheitslücke in einer transitiven Bibliothek macht aus einer Wartungsaufgabe einen Notfall.

Dieses Muster sehe ich in Projekten immer wieder. Fast nie liegt es an fehlender Kompetenz. Es liegt daran, dass Abhängigkeitspflege als Aufgabe gilt, die man „bei Gelegenheit“ erledigt. Werkzeuge wie Renovate und Dependabot ändern genau das: Aus einer lästigen Pflicht, die man ständig aufschiebt, wird ein kontinuierlicher und weitgehend automatischer Prozess.

## Software altert, auch wenn niemand sie anfasst

Wer über Aktualität spricht, muss zuerst den Lebenszyklus von Software verstehen. Eine Anwendung besteht heute zum größten Teil aus fremdem Code: Frameworks, Bibliotheken, Laufzeitumgebungen, Container-Basis-Images, Build-Plugins, CI-Actions. Der selbst geschriebene Anteil ist oft der kleinere. Jede dieser Komponenten hat einen eigenen Lebenszyklus. Sie wird veröffentlicht, gepflegt, durch Nachfolgeversionen abgelöst und erreicht irgendwann ihr End of Life, also den Punkt, ab dem es keine Sicherheitsupdates mehr gibt.

Laufzeitumgebungen wie Java, Node.js oder Python veröffentlichen ihre Support-Zeiträume offen, Frameworks wie Spring Boot oder Angular ebenso. Daraus folgt: Selbst eine fachlich fertige Anwendung, an der niemand mehr etwas ändert, wird mit jedem Monat riskanter. Der eigene Code bleibt gleich, aber das Fundament darunter verliert nach und nach die Wartung.

Für das Management ist das ein wichtiger Perspektivwechsel. Software ist kein Investitionsgut, das einmal angeschafft wird und dann abgeschrieben läuft. Sie gleicht eher einer Immobilie: Ohne laufende Instandhaltung sinkt ihr Wert, und der Sanierungsstau wird mit der Zeit nicht billiger, sondern teurer.

## Warum „immer aktuell“ die günstigste Strategie ist

### Sicherheit: Das Zeitfenster entscheidet

Zwei Fälle sind in der Branche zu Recht zu Lehrbeispielen geworden. Beim Equifax-Vorfall 2017 wurde eine Lücke im Webframework Apache Struts ausgenutzt, für die bereits Monate vorher ein Patch verfügbar war. Bei Log4Shell Ende 2021 mussten Unternehmen weltweit innerhalb weniger Tage herausfinden, wo überall eine bestimmte Logging-Bibliothek steckte, oft transitiv und tief im Abhängigkeitsbaum.

Beide Fälle zeigen dasselbe Muster. Entscheidend ist nicht, ob eine Lücke auftritt, sondern wie schnell ein Team den Fix ausrollen kann. Ein Team, dessen Abhängigkeiten ohnehin aktuell sind, muss bei einer neuen Sicherheitslücke nur eine Patch-Version anheben. Ein Team, das drei Major-Versionen zurückliegt, muss erst den Rückstand aufholen, bevor es überhaupt patchen kann, und das unter Zeitdruck.

### Regulierung: Aus guter Praxis wird Pflicht

Mit dem Cyber Resilience Act der EU wird Schwachstellenmanagement für Hersteller von Produkten mit digitalen Elementen schrittweise zur rechtlichen Anforderung. Die Meldepflichten greifen ab September 2026, die übrigen Pflichten ab Dezember 2027. Wer nachweisen muss, dass bekannte Schwachstellen zeitnah behoben werden, braucht einen nachvollziehbaren und wiederholbaren Update-Prozess. Ein automatischer Prozess, der jeden Schritt im Versionskontrollsystem dokumentiert, liefert diesen Nachweis praktisch nebenbei.

### Wirtschaftlichkeit: Kleine Schritte sind billiger als große Sprünge

Der wichtigste Punkt ist aus meiner Sicht der wirtschaftliche. Der Aufwand eines Updates wächst nicht linear mit dem Abstand zur aktuellen Version, sondern deutlich schneller. Ein einzelnes Minor-Update betrifft meist wenige Änderungen, die gut dokumentiert sind und sich isoliert prüfen lassen. Zehn aufgestaute Updates auf einmal bedeuten dagegen: Breaking Changes aus mehreren Versionen überlagern sich, Abhängigkeiten untereinander erzwingen eine bestimmte Reihenfolge, Migrationsanleitungen setzen Zwischenstände voraus, die man übersprungen hat. Geht danach etwas kaputt, lässt sich kaum noch sagen, welche Änderung schuld war.

Hinzu kommen die indirekten Kosten. Wer auf alten Versionen festhängt, kann neue Features und Performance-Verbesserungen der Frameworks nicht nutzen, findet für veraltete Versionen immer weniger Antworten in Dokumentation und Community und tut sich schwerer bei der Personalgewinnung. Kaum ein Entwickler wechselt gern in ein Projekt, dessen Technologiestand fünf Jahre alt ist.

Die Rechnung ist also einfach: Viele kleine, regelmäßige Updates sind in Summe günstiger als seltene große Migrationsprojekte. Das Problem war bisher nur, dass sich die vielen kleinen Updates niemand antun wollte. Genau hier setzen die Werkzeuge an.

## Was Renovate und Dependabot konkret tun

Beide Werkzeuge verfolgen dasselbe Grundprinzip. Sie scannen das Repository nach Abhängigkeitsdefinitionen, gleichen sie mit den Paket-Registries ab und eröffnen für jedes verfügbare Update einen Pull Request. Dieser enthält die Versionsänderung, Release Notes und Changelog-Auszüge und durchläuft die normale CI-Pipeline. Das Team sieht also nicht „es gibt irgendwo eine neue Version“, sondern eine konkrete, getestete Änderung, die nur noch gemergt werden muss.

**Dependabot** ist direkt in GitHub integriert. Neben den regulären Versionsupdates liefert es Security Updates, die aus der GitHub Advisory Database gespeist werden. Die Konfiguration erfolgt über eine `dependabot.yml`. Inzwischen unterstützt Dependabot auch das Gruppieren von Updates und Wartezeiten nach einem Release:

```yaml
version: 2
updates:
  - package-ecosystem: "gradle"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 3
    groups:
      minor-and-patch:
        update-types: ["minor", "patch"]
```

**Renovate** stammt von Mend, ist Open Source und läuft neben GitHub auch auf GitLab, Bitbucket und Azure DevOps. Es unterstützt sehr viele Paketmanager und Dateiformate und ist deutlich feiner konfigurierbar: Regeln pro Paket oder Update-Typ, Zeitfenster, ein Dependency Dashboard als zentrale Übersicht über offene und zurückgestellte Updates, gemeinsame Presets über viele Repositories hinweg und integriertes Automerge.

```json
{
  "extends": ["config:recommended"],
  "minimumReleaseAge": "3 days",
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "matchCurrentVersion": "!/^0\\./",
      "automerge": true
    }
  ]
}
```

Meine Einschätzung aus der Praxis: Für einzelne Projekte auf GitHub ist Dependabot ein sehr guter Einstieg ohne zusätzliche Infrastruktur. Wer viele Repositories einheitlich steuern will, außerhalb von GitHub arbeitet oder komplexe Regeln braucht, landet früher oder später bei Renovate. Wichtiger als die Wahl des Werkzeugs ist ohnehin, dass überhaupt eines konsequent eingesetzt wird.

## Wie sich der Entwickleralltag verändert

Ohne Automatisierung ist Abhängigkeitspflege eine Recherche-Aufgabe. Jemand muss regelmäßig prüfen, welche Versionen es gibt, Changelogs lesen, Versionsnummern anpassen, lokal bauen, testen und einen Pull Request schreiben. Diese Arbeit ist monoton, bringt fachlich keinen Fortschritt und wird deshalb verlässlich verschoben.

Mit Renovate oder Dependabot bleibt davon nur die eigentliche Entscheidung übrig: Ist dieses Update in Ordnung? Und die Entscheidung kommt gut vorbereitet an, nämlich mit Release Notes im Pull Request und einem grünen oder roten CI-Ergebnis. Aus einer Stunde Recherche wird eine Minute Review.

Dazu kommen einige weniger offensichtliche Effekte:

- **Fehler lassen sich klar zuordnen.** Bricht ein Build, ist klar, welches Update schuld ist, denn jeder Pull Request enthält genau eine (oder eine bewusst gruppierte) Änderung.
- **Wissen verteilt sich im Team.** Breaking Changes werden sichtbar, wenn sie auftreten, und nicht erst Jahre später gebündelt in einem Migrationsprojekt, das eine einzelne Person stemmen muss.
- **Planung wird verlässlicher.** Statt unvorhersehbarer Upgrade-Projekte entsteht ein gleichmäßiger, kleiner Grundaufwand, der sich in jede Sprint-Planung einrechnen lässt.
- **Die Kosten für Kontextwechsel sinken.** Mit Zeitplänen (z. B. „Updates montags früh“) und Gruppierung werden Updates gebündelt bearbeitet, statt den ganzen Tag über einzutreffen.

Ein Hinweis aus Erfahrung: Wer die Werkzeuge ohne Konfiguration aktiviert, bekommt in einem gewachsenen Projekt am ersten Tag dutzende Pull Requests. Das frustriert, und die Bots werden schnell wieder abgeschaltet. Sinnvoller ist es, mit Gruppierung, einem Limit für gleichzeitig offene Pull Requests und einem festen Zeitplan zu starten und den Rückstand gezielt abzubauen.

## Der nächste Schritt: Vollautomatisierung

Wenn jeder Update-Pull-Request ohnehin die komplette Pipeline durchläuft, liegt die Frage nahe: Warum muss überhaupt noch ein Mensch auf „Merge“ klicken? Die Antwort hängt von einer einzigen Frage ab: Wie viel Vertrauen verdient die eigene Testsuite?

Beide Werkzeuge unterstützen automatisches Mergen. Renovate bringt es selbst mit, bei Dependabot wird es typischerweise über GitHubs Auto-Merge-Funktion in Kombination mit einem kleinen Workflow umgesetzt. Technisch ist das trivial. Die eigentliche Voraussetzung ist organisatorisch und qualitativ: Ein Auto-Merge ist genau so sicher wie die Checks, die vorher bestanden sein müssen. Deshalb gehören Branch Protection und verpflichtende Status-Checks zwingend dazu. Ohne sie merged der Bot im Zweifel auch einen roten Build.

Und auch Testabdeckung ist mehr als eine Prozentzahl. Eine hohe Line Coverage aus Unit-Tests, die jede Abhängigkeit wegmocken, sagt wenig darüber, ob ein neuer Datenbanktreiber oder eine neue HTTP-Client-Version im Zusammenspiel funktioniert. Für Vollautomatisierung zählen vor allem:

- **Integrationstests gegen echte Komponenten**, etwa mit Testcontainers für Datenbanken, Message Broker oder Cloud-Emulatoren,
- **Contract- oder API-Tests**, die das nach außen sichtbare Verhalten absichern,
- **Tests der Serialisierung und Konfiguration**, weil genau dort Framework-Updates erfahrungsgemäß am häufigsten still etwas verändern,
- optional **Mutation Testing**, um zu prüfen, ob die Tests Fehler tatsächlich erkennen und nicht nur Code ausführen.

Bewährt hat sich ein gestuftes Vorgehen:

1. **Stufe 1:** Patch-Updates und Updates von Entwicklungswerkzeugen (Linter, Test-Frameworks, CI-Actions) werden automatisch gemergt. Das Risiko ist gering, der Entlastungseffekt sofort spürbar.
2. **Stufe 2:** Minor-Updates stabiler Bibliotheken (Version ≥ 1.0) kommen dazu, sobald die Testsuite sich bewährt hat.
3. **Stufe 3:** Major-Updates bleiben manuell. Sie erfordern oft bewusste Code-Anpassungen, und das ist auch gut so.

Ein Aspekt wird bei der Automatisierung oft übersehen: die Software-Lieferkette. In den vergangenen Jahren gab es wiederholt Fälle, in denen Angreifer kompromittierte Versionen populärer Pakete veröffentlicht haben. Wer jede neue Version sofort automatisch übernimmt, holt sich solche Versionen im ungünstigsten Fall innerhalb von Minuten in die Codebasis. Die Gegenmaßnahme ist einfach und wirksam: eine Mindestwartezeit nach Veröffentlichung (`minimumReleaseAge` bei Renovate, `cooldown` bei Dependabot). Kompromittierte Releases werden in der Regel schnell entdeckt und zurückgezogen. Ein paar Tage Verzögerung kosten fast nichts, schließen aber einen großen Teil dieses Risikos aus. Sicherheitsupdates für bekannte Schwachstellen sind bei Dependabot automatisch von der Wartezeit ausgenommen, bei Renovate lassen sie sich über `vulnerabilityAlerts` gesondert steuern.

Wer noch weiter gehen will, ergänzt die Automatisierung um Absicherung im Betrieb: Canary-Deployments, aussagekräftiges Monitoring und einen schnellen Rollback-Pfad. Damit ist ein Update, das trotz grüner Tests ein Problem verursacht, kein Drama, sondern ein normaler, umkehrbarer Vorgang.

## Handlungsempfehlungen

Für Teams und Verantwortliche, die das Thema angehen wollen, empfehle ich folgende Schritte:

1. **Bestandsaufnahme machen.** Welche Laufzeitumgebungen und Frameworks sind im Einsatz, und wann endet jeweils ihr Support? Allein diese Übersicht verändert erfahrungsgemäß die Prioritäten.
2. **Ein Werkzeug einführen, und zwar überall.** Dependabot für GitHub-zentrierte Umgebungen mit überschaubarer Komplexität, Renovate für heterogene Plattformen oder viele Repositories mit zentraler Konfiguration. Auch Docker-Images, CI-Actions und Infrastruktur-Code gehören dazu, nicht nur Anwendungsbibliotheken.
3. **Sinnvoll konfigurieren, bevor man aktiviert.** Gruppierung, Zeitplan, ein Limit für offene Pull Requests und eine Mindestwartezeit nach Releases von Anfang an festlegen.
4. **Branch Protection und Pflicht-Checks einrichten.** Ohne sie ist jede Automatisierung ein Risiko.
5. **In die Tests investieren, die bei Updates wirklich zählen.** Integrations- und Contract-Tests sind der Hebel, der Vollautomatisierung erst verantwortbar macht.
6. **Automerge stufenweise ausweiten.** Mit Patches und Dev-Tools beginnen, Ergebnisse beobachten, Vertrauen aufbauen und dann erweitern.
7. **Abhängigkeitspflege als festen Bestandteil der Arbeit verankern.** Nicht als Sonderprojekt, sondern als kleiner, planbarer Grundaufwand, den das Management bewusst trägt.

Für Entscheider lässt sich der Kern in einem Satz sagen: Veraltete Abhängigkeiten sind technische Schulden mit Zinseszins, und Renovate oder Dependabot sind das Werkzeug, um diese Schulden in kleinen, planbaren Raten zu tilgen, statt sie irgendwann auf einen Schlag begleichen zu müssen. Wer zusätzlich in eine belastbare Testsuite investiert, kann diesen Prozess weitgehend der Maschine überlassen. Das Team gewinnt so Zeit für das, wofür es eigentlich da ist: fachlichen Mehrwert zu schaffen.
