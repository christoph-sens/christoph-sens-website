---
title: 'Was die Testsuite nicht findet: Wie ich eine JSONPath-Bibliothek absichere'
description: 'Alle 715 Fälle der offiziellen Testsuite zu bestehen, reicht nicht. Fuzzing, Differential-Tests, Mutationstests und genaues Lesen der Spezifikation haben in Treetrail und Eclipse Parsson Fehler gefunden, die keine Testsuite zeigt – und einen Fehler in der Testsuite selbst.'
date: 2026-11-02
key: was-die-testsuite-nicht-findet
category: article
tags: [Java, JSONPath, RFC 9535, Testing, Fuzzing, Open Source]
---

[Treetrail](https://github.com/treetrail/treetrail), meine JSONPath-Bibliothek für Java, besteht alle 715 Fälle der offiziellen [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) für RFC 9535. Auf Java 17, 21 und 25, mit jedem unterstützten JSON-Modell, bei jedem Build. Das klingt nach „fertig“. Ist es nicht.

Eine Testsuite prüft, ob eine Implementierung auf bekannte Fragen die richtige Antwort gibt. Sie prüft nicht, was passiert, wenn jemand eine Frage stellt, an die beim Schreiben der Suite niemand gedacht hat. Und sie kann selbst falsch sein. Dieser Beitrag beschreibt, mit welchen Methoden ich Treetrail darüber hinaus absichere – und was sie gefunden haben.

## Warum das wichtig ist

JSONPath-Ausdrücke kommen immer öfter nicht aus dem eigenen Code. Mandanten konfigurieren, welche Felder eines Webhooks sie interessieren. Overlays für OpenAPI-Spezifikationen wählen mit JSONPath aus, was sie ändern. In solchen Fällen sind Abfrage und Dokument fremde Eingaben. Dann reicht es nicht, dass die Bibliothek korrekt rechnet. Sie darf auch bei böswilligen oder schlicht kaputten Eingaben nicht hängen bleiben, nicht abstürzen und nicht unbegrenzt Speicher belegen.

Das gilt nicht nur für JSONPath. Jeder Parser, jede Regel-Engine und jedes Template-System in einem Backend hat dasselbe Problem. Die Methoden lassen sich übertragen.

## Fuzzing: Was passiert bei Unsinn?

Beim Fuzzing erzeugt ein Werkzeug Millionen zufälliger, leicht veränderter Eingaben und beobachtet, ob das Programm abstürzt oder hängt. Für Treetrail nutze ich [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer). Die Regeln sind einfach: Kompilieren, Abfragen, reguläre Ausdrücke und JSON-Parsing dürfen nur die dokumentierten Exceptions werfen und müssen jede Eingabe in höchstens fünf Sekunden abarbeiten. Jeder CI-Build fuzzt 15 Sekunden pro Ziel, ein nächtlicher Lauf zehn Minuten.

Die Fünf-Sekunden-Grenze ist der wichtigere Teil. Ein Absturz fällt auf. Eine Abfrage, die den Server für Stunden beschäftigt, fällt erst in Produktion auf.

Genau so einen Fall hat das Fuzzing gefunden, allerdings nicht in Treetrail selbst, sondern in einer Streaming-Variante für JSON-P, an der ich arbeite. Die Abfrage `$..[?@..*]..[-5]..a.a` über 999 verschachtelte Arrays – ein Dokument von 2 KB, innerhalb der voreingestellten Grenzen – lief stundenlang. Die Grenze für besuchte Knoten griff nicht, weil ein Teil der Arbeit gar nicht als Besuch gezählt wurde: Die Laufzeit wuchs mit der fünften Potenz der Tiefe, die gezählten Besuche nur quadratisch. Seit dem Fix zählt jede Arbeit, und dieselbe Eingabe bricht nach wenigen Sekunden mit einer klaren Fehlermeldung ab.

Eine Grenze schützt nur, wenn sie misst, was tatsächlich Zeit kostet.

### Ein Fehler, der seit 2020 bekannt ist

Beim selben Fuzzing ist eine zweite Sache aufgefallen, diesmal in [Eclipse Parsson](https://github.com/eclipse-ee4j/parsson), der Referenzimplementierung von Jakarta JSON Processing. `skipObject()` und `skipArray()` laufen bei abgeschnittenem JSON wie `{` oder `[1,` in eine Endlosschleife, statt einen Fehler zu melden. Wer JSON aus dem Netz liest, bekommt früher oder später abgeschnittene Daten.

Der Fehler ist seit 2020 als [Issue #23](https://github.com/eclipse-ee4j/parsson/issues/23) gemeldet, auch die aktuelle Version 1.1.9 ist betroffen. Mein Fix liegt als [Pull Request #174](https://github.com/eclipse-ee4j/parsson/pull/174) vor. Er ist klein: Die Schleife prüft, ob die Eingabe zu Ende ist.

Das Beispiel zeigt, warum Fuzzing auch dann lohnt, wenn man eine etablierte Bibliothek nur benutzt. Die eigenen Tests decken die eigenen Annahmen ab. Der Fuzzer hat keine.

## Differential-Tests: Zwei Implementierungen, eine Antwort

Wenn es für ein Problem eine zweite, unabhängige Implementierung gibt, kann man beide mit denselben zufälligen Eingaben füttern und vergleichen. Jede Abweichung ist ein Fehler auf einer der beiden Seiten. Man braucht dafür kein Orakel, das die richtige Antwort kennt – es reicht, dass zwei unabhängige Teams selten denselben Fehler machen.

Treetrail läuft auf zwei solchen Strecken:

- **Reguläre Ausdrücke:** 20.000 zufällige Ausdrücke gegen `java.util.regex`, jeweils mit `match()` und `search()` auf zufälligen Eingaben. Treetrail wertet reguläre Ausdrücke mit einem eigenen Automaten aus, ohne Backtracking, damit Muster aus fremden Dokumenten keine exponentielle Laufzeit auslösen können. Ein eigener Automat ist eine eigene Fehlerquelle; der Vergleich hält ihn ehrlich.
- **Ganze Abfragen:** 2.000 zufällige Abfragen auf zufälligen Dokumenten gegen eine unabhängige RFC-9535-Implementierung in Python. Etwa jede siebte Abfrage wird absichtlich beschädigt, damit auch das Ablehnen ungültiger Abfragen verglichen wird.

Für die JSON-P-Variante habe ich das größer aufgezogen: 14,4 Millionen generierte Abfragen im Vergleich zwischen Treetrail und den Implementierungen für Parsson und Apache Johnzon. Unabhängig sind die drei nicht, die beiden JSON-P-Fassungen stammen von Treetrail ab. Trotzdem gab es eine Abweichung: eine `ArithmeticException` in Johnzon bei der Zahl `1e1000000` – eine gültige JSON-Zahl, an die beim Schreiben niemand gedacht hatte.

## Mutationstests: Wer testet die Tests?

Hohe Testabdeckung sagt nur, dass Code ausgeführt wurde, nicht, dass ein Fehler auffallen würde. Mutationstests drehen die Frage um: Das Werkzeug, hier [PIT](https://pitest.org), baut absichtlich kleine Fehler in den kompilierten Code ein – ein `<` wird zu `<=`, eine Bedingung wird umgekehrt, ein Rückgabewert fällt weg – und prüft, ob die Tests das bemerken.

Im Kern von Treetrail erzeugt PIT 1.399 solcher Mutationen. Die Tests erkennen 87 Prozent davon; fällt der Wert unter 85, schlägt der nächtliche Lauf fehl. Die verbleibenden 13 Prozent sind nicht alle Lücken – manche Mutationen ändern das Verhalten gar nicht. Aber jede überlebende Mutation ist eine konkrete Frage: Würde ich diesen Fehler bemerken? Oft lautet die Antwort nein, und dann fehlt ein Test.

## Die Spezifikation lesen – auch gegen die Testsuite

Die lehrreichste Frage brauchte kein Werkzeug. RFC 9535 verweist für reguläre Ausdrücke auf I-Regexp, [RFC 9485](https://www.rfc-editor.org/rfc/rfc9485). Dessen Grammatik führt `^` und `$` als gewöhnliche Zeichen. Die Testsuite erwartete aber in zwei Fällen, dass sie als Anker wirken, wie in den meisten Regex-Dialekten. Wer der Grammatik folgte, fiel durch die Suite. Wer der Suite folgte, wich vom RFC ab.

Treetrail ist zunächst der Suite gefolgt. Glyn Normington, Mitherausgeber von RFC 9535, hat in einem [Issue](https://github.com/treetrail/treetrail/issues/46) auf den Widerspruch hingewiesen, und Tim Bray, einer der Autoren von RFC 9485, hat dort klargestellt, dass I-Regexp keine Anker kennt – Ausdrücke sind ohnehin immer verankert. Ich habe die Frage daraufhin [bei der Testsuite gemeldet](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/issues/122) und die Korrektur als [Pull Request #125](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/125) eingereicht. Treetrail folgt dem RFC, sobald sie übernommen ist.

Eine Testsuite ist Code, und Code hat Fehler. Wer gegen einen Standard implementiert, sollte den Standard lesen, nicht nur die Tests.

## Speicher: Die Frage, die keiner stellt

Ein letzter Punkt, weil er in Testsuites praktisch nie vorkommt: Wie viel Speicher hält eine Bibliothek fest? Treetrail hat kompilierte Automaten für reguläre Ausdrücke anfangs prozessweit zwischengespeichert. Das ist schnell, solange die Muster aus dem eigenen Code kommen. Kommen sie aus Dokumenten – `$[?match(@.v, @.p)]` liest das Muster aus dem Dokument –, kann jedes Dokument neue Muster mitbringen. 256 passend gebaute Muster haben so 392 MB belegt.

Heute hat jeder Automat ein eigenes Budget, alle zusammen teilen sich rund 8 MiB, und Muster aus Dokumenten verdrängen keine Muster anderer Abfragen. [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md#limits) listet alle Grenzen. Die Frage dahinter ist einfach und wird trotzdem selten gestellt: Was passiert, wenn ein Angreifer das Dokument schreibt?

## Was ich daraus mitnehme

Keine dieser Methoden ist neu, und keine ist aufwendig. Zusammen kosten sie einen Bruchteil der Zeit, die das Schreiben der Bibliothek gekostet hat. Für Projekte, die ich berate, gilt dieselbe Reihenfolge:

1. **Grenzen für fremde Eingaben festlegen** – Zeit, Speicher, Tiefe – und sie testen. Fuzzing mit einem Zeitlimit pro Eingabe findet, was Unit-Tests übersehen.
2. **Gegen eine zweite Implementierung vergleichen**, wo es eine gibt. Für Parser, Formate und Protokolle gibt es fast immer eine.
3. **Die Tests messen, nicht nur die Abdeckung.** Mutationstests zeigen, welche Fehler unbemerkt durchrutschen würden.
4. **Die Spezifikation lesen**, und Unklarheiten dort klären, wo sie entstanden sind. Das bringt nebenbei Kontakt zu den Leuten, die den Standard geschrieben haben.

Die Werkzeuge, Konfigurationen und Ergebnisse für Treetrail sind öffentlich im [Repository](https://github.com/treetrail/treetrail#testing). Wer die Methoden in einem eigenen Projekt einsetzen möchte, kann sich gerne bei mir melden.
