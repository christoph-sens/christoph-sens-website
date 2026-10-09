---
title: 'Treetrail: Warum ich eine JSONPath-Bibliothek für Java geschrieben habe'
description: 'Treetrail bringt den JSONPath-Standard RFC 9535 nach Java: gleiche Ergebnisse wie in anderen Sprachen, sicher bei fremden Abfragen, Adapter für Jackson, Gson und JSON-P – und ein geordneter Weg weg von Jayway JsonPath.'
date: 2026-10-09
key: treetrail-jsonpath-fuer-java
category: article
tags: [Java, JSONPath, RFC 9535, Open Source, Spring]
---

Wer in Java mit JSON arbeitet, benutzt JSONPath – oft, ohne es zu merken. In Spring-Tests steckt es hinter `jsonPath("$.items[0].name")`, in API-Gateways und Integrationsplattformen wählt es Felder aus Webhooks aus, in Konfigurationen beschreibt es, welcher Wert wohin gehört. Erstaunlich ist, dass JSONPath seit Stefan Goessners Artikel von 2007 rund 17 Jahre lang keine Spezifikation hatte. Jede Bibliothek hat selbst entschieden, was `$..book[-1:]` oder `$[?(@.price < 10)]` zurückgibt.

Das hat sich im Februar 2024 geändert: Die IETF hat mit [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535) einen Standard für JSONPath veröffentlicht, begleitet von einer [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) mit 706 Testfällen. Für Python, Rust oder .NET gab es bald konforme Implementierungen. Für Java – die Plattform, auf der vermutlich die meisten JSONPath-Ausdrücke laufen – fehlte eine ausgereifte Antwort.

[Treetrail](https://github.com/treetrail/treetrail) ist mein Versuch, diese Lücke zu schließen. Dieser Beitrag erzählt, warum es die Bibliothek gibt, was sie heute kann und wie sie sich zu den Alternativen verhält.

## Die Motivation

### Eine Abfrage, mehrere Antworten

Der Ausgangspunkt war eine einfache Beobachtung: Dieselbe JSONPath-Abfrage liefert je nach Bibliothek unterschiedliche Ergebnisse. Auf dem Array `[0, 1, …, 9]` etwa:

| Abfrage | RFC 9535 | Jayway JsonPath 3.0.0 |
| --- | --- | --- |
| `$[1:6:2]` | `[1, 3, 5]` | `[1, 2, 3, 4, 5]` |
| `$[9:0:-1]` | `[9, 8, 7, 6, 5, 4, 3, 2, 1]` | `[]` |

Solange ein Ausdruck nur in einem einzigen Java-Service lebt, fällt das kaum auf. Sobald aber dieselbe Abfrage im Backend, in einem Python-Skript der Datenanalyse und im TypeScript-Frontend ausgewertet wird, wird es heikel: Drei Komponenten, drei Interpretationen, und der Fehler zeigt sich erst in Produktion. Genau dafür gibt es Standards. Ein Standard nützt aber nur, wenn es auf jeder Plattform eine Implementierung gibt, die ihn wirklich einhält.

### Jayway JsonPath: verdienstvoll, aber älter als der Standard

Die mit Abstand verbreitetste JSONPath-Bibliothek in Java ist [Jayway JsonPath](https://github.com/json-path/JsonPath). Sie hat dem Java-Ökosystem seit 2011 hervorragende Dienste geleistet, und Spring nutzt sie für seine `jsonPath(...)`-Matcher. Sie ist aber entstanden, lange bevor es einen Standard gab – und ist deshalb, ganz ohne Vorwurf, nicht standardkonform. Gegen die Compliance Test Suite gemessen liefert Jayway 3.0.0 bei 86 der 459 gültigen Abfragen dasselbe Ergebnis wie der Standard; setzt man bei Filtern Klammern, wie Jayway sie verlangt, sind es 176. Umgekehrt akzeptiert Jayway 132 der 247 Abfragen, die laut Standard ungültig sind.

Eine so breit genutzte Bibliothek kann ihr Verhalten nicht einfach umstellen, ohne tausende Projekte zu brechen. Deshalb braucht es eine eigenständige, standardkonforme Bibliothek – und einen Weg, ohne Risiko dorthin zu wechseln.

### Abfragen aus fremder Hand

Der dritte Grund ist Sicherheit. JSONPath-Ausdrücke kommen immer öfter nicht aus dem eigenen Code, sondern von Mandanten, Nutzern oder aus Konfigurationen Dritter. Dann darf eine Abfrage den Service nicht lahmlegen können. Reguläre Ausdrücke mit Backtracking sind dabei die bekannteste Schwachstelle: Das Muster `((a+)+)+b` gegen 24 `a` und ein `!` beschäftigt `java.util.regex` auf JDK 25 rund 0,4 Sekunden – und jedes weitere `a` verdoppelt die Zeit.

### Und ein persönlicher Grund

Ich baue seit über 15 Jahren Backends mit Java und Kotlin. Open Source ist für mich der ehrlichste Weg, zu zeigen, wie ich arbeite: Jede Entscheidung, jeder Test und jeder Fehler ist öffentlich nachvollziehbar. Treetrail ist bewusst in Java geschrieben, nicht in Kotlin – eine Kotlin-Standardbibliothek als Abhängigkeit würde die Aufnahme in Projekte wie Spring, Apache Camel oder Apache NiFi unnötig erschweren.

## Was Treetrail heute kann

Version 0.2.0 ist seit dem 8. Oktober 2026 auf Maven Central. Die wichtigsten Eigenschaften:

### Standardkonform – und das wird bei jedem Build geprüft

Treetrail besteht alle 706 Fälle der Compliance Test Suite, auf Java 17, 21 und 25 und mit jedem unterstützten JSON-Modell. Schlägt ein einziger Fall fehl, schlägt der Build fehl. Wo der Standard Spielraum lässt oder die Test Suite vom RFC-Text abweicht, ist die Entscheidung in [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md) dokumentiert.

### Eine Art von Ergebnis

Jede Abfrage liefert eine Liste von Knoten, egal ob sie einen oder viele Werte trifft. Jeder Knoten kennt seinen normalisierten Pfad. Es gibt keine Konfigurationsoption, die das Ergebnis einer Abfrage verändert.

```java
JsonPath path = JsonPath.compile("$.store.book[?@.price < 10].title");

NodeList<Object> nodes = path.query(document);
nodes.values(); // ["Sayings of the Century", "Moby Dick"]
nodes.paths();  // ["$['store']['book'][0]['title']", "$['store']['book'][2]['title']"]
```

### Der JSON-Baum, den Sie schon haben

Der Kern hat keine Abhängigkeiten außer dem JDK. Er arbeitet auf einfachen Java-Maps und -Listen oder parst JSON-Text mit einem kleinen, strikten Parser selbst. Adapter fragen die Bäume von Jackson 2 und 3, Gson und Jakarta JSON-P direkt ab – ohne Konvertierung – und liefern die Knoten der jeweiligen Bibliothek zurück, sodass man mit ihnen weiterarbeiten kann. Weitere Modelle lassen sich über ein kleines Interface anbinden.

```java
JsonNode document = objectMapper.readTree(json);
NodeList<JsonNode> books = JsonPath.compile("$.store.book[?@.price < 10]")
        .query(document, Jackson2Model.INSTANCE);
```

### Sicher bei Abfragen aus fremder Hand

Reguläre Ausdrücke in `match()` und `search()` folgen [I-Regexp (RFC 9485)](https://www.rfc-editor.org/rfc/rfc9485) und laufen auf einer eigenen Automaten-Engine ohne Backtracking, in linearer Zeit. Das Muster von oben, das `java.util.regex` 0,4 Sekunden kostet, erledigt Treetrail in weniger als einer Zehntelmikrosekunde. Dazu kommen Grenzen für jeden Lauf: ein Budget an besuchten Knoten, eine maximale Tiefe, eine Begrenzung der Ergebnisgröße. Selbst wenn ein Dokument tausende verschiedene reguläre Ausdrücke mitbringt, belegen die Caches höchstens etwa 10 MB Speicher.

```java
JsonPath path = JsonPath.compile(untrustedExpression)
        .withLimits(EvaluationLimits.DEFAULT.withMaxVisitedNodes(1_000_000).withMaxResultSize(10_000));
```

### Schnell

Standardkonformität kostet keine Geschwindigkeit. In den JMH-Benchmarks ist Treetrail in jeder Abfrage mindestens gleichauf mit Jayway JsonPath; auf Jackson-Bäumen, dem häufigsten Fall in der Praxis, ist Treetrail 1,2- bis 2,2-mal schneller, beim Kompilieren eines Ausdrucks 1,7-mal. Die Messungen und ihre Einschränkungen stehen in [docs/benchmarks.md](https://github.com/treetrail/treetrail/blob/main/docs/benchmarks.md).

### Für Tests gemacht

Der größte Teil des JSONPath-Codes in Java-Projekten steckt in Tests. Zwei Module bringen den Standard dorthin: AssertJ-Assertions und ein Ersatz für Springs `jsonPath(...)`-Matcher in MockMvc und WebTestClient.

```java
mockMvc.perform(get("/store"))
        .andExpect(jsonPath("$.store.book[?@.price < 10].title").values("Sayings of the Century", "Moby Dick"));
```

Werte werden als JSON-Werte verglichen: `399`, `399L` und `399.0` passen alle auf die JSON-Zahl `399`. Schlägt eine Assertion fehl, nennt sie den Ausdruck und zeigt die gefundenen Werte mit ihren Pfaden.

### Ein geordneter Weg weg von Jayway

Niemand migriert gern auf gut Glück. Deshalb bringt Treetrail zwei Werkzeuge mit:

- **`jsonpath-migration`** führt Ihre Ausdrücke mit Jayway JsonPath und mit Treetrail gegen Beispieldokumente aus und meldet jeden Unterschied – mit Umschreibhinweis für Jayway-spezifische Syntax. Es nutzt die Jayway-Version, die Ihr Projekt ohnehin verwendet, und berücksichtigt Ihre Jayway-Konfiguration.
- **`jsonpath-rewrite`** enthält ein [OpenRewrite](https://docs.openrewrite.org)-Rezept, das jeden JSONPath-Ausdruck in einer Codebasis findet, der an Jayway oder an Springs Matcher übergeben wird, und ihn bewertet: gültig nach RFC 9535, nur in Jayway gültig, Schreib-API oder erst zur Laufzeit berechnet.

Dazu kommt im README eine [Tabelle mit Jayway-Idiomen und ihren Entsprechungen](https://github.com/treetrail/treetrail#jayway-idioms-and-their-equivalents).

## Treetrail im Vergleich

### Gegenüber Jayway JsonPath

| | Treetrail | Jayway JsonPath |
| --- | --- | --- |
| Standard | RFC 9535, alle 706 CTS-Fälle | eigener Dialekt, älter als der Standard |
| Ergebnis von `$.a.b` | immer eine Knotenliste mit Pfaden | einzelner Wert oder Liste, je nach Pfad und Konfiguration |
| Filter | `[?@.price < 10]` (Klammern optional) | `[?(@.price < 10)]` |
| Reguläre Ausdrücke | I-Regexp, lineare Laufzeit | `java.util.regex` mit Backtracking |
| Grenzen für fremde Abfragen | Knotenbudget, Tiefe, Ergebnisgröße, Regex-Speicher | – |
| JSON-Bibliotheken | Java-Objekte, Jackson 2/3, Gson, JSON-P | json-smart, Jackson, Gson u. a. über Provider |
| Spring-Test-Matcher | eigenes Modul | in Spring eingebaut |
| Schreib-API (`set`, `delete`) | nein, nur Abfragen | ja |
| Typ-Mapping (`read(…, Integer.class)`) | nein, über die eigene JSON-Bibliothek | ja |
| Aggregatfunktionen (`sum()`, `avg()`, …) | nein, Standardfunktionen `length()`, `count()`, `match()`, `search()`, `value()` | ja |

Die Tabelle zeigt auch, wo Jayway mehr bietet: Schreib-API, Typ-Mapping und Aggregatfunktionen sind bequem und gehören bewusst nicht zum Standard. Wer sie intensiv nutzt, findet im README, wie sich die gleichen Aufgaben mit Treetrail und der eigenen JSON-Bibliothek lösen lassen – oder bleibt für diese Stellen bei Jayway. Beide Bibliotheken können problemlos nebeneinander existieren.

### Gegenüber anderen RFC-9535-Implementierungen in Java

Treetrail ist nicht die einzige Java-Bibliothek, die den Standard umsetzt, und das ist gut so. Christoph Burgmers [JSONPath Comparison](https://github.com/cburgmer/json-path-comparison) vergleicht seit Jahren Dutzende Implementierungen über alle Sprachen hinweg. Für Treetrail habe ich dort einen [Pull Request](https://github.com/cburgmer/json-path-comparison/pull/170) eingereicht; im lokalen Lauf über 258 Abfragen sieht das Bild für Java so aus (Übereinstimmung mit dem sprachübergreifenden Konsens bei 175 Abfragen):

| Implementierung | Konsens getroffen |
| --- | --- |
| Treetrail | 173 |
| ajp (XSLT-/ixml-basiert) | 173 |
| SJF4J | 173 |
| Jayway JsonPath 3.0.0 | 143 |
| JSurfer | 133 |

Die zwei verbleibenden Abfragen sind Kurzschreibweisen, die nach RFC 9535 ungültig sind – dort weicht der Standard bewusst vom alten Konsens ab. Bemerkenswert finde ich, dass Treetrail und ajp, zwei völlig unabhängig entstandene Implementierungen, bei allen 258 Abfragen identisch antworten. Genau das soll ein Standard leisten.

Die Unterschiede liegen deshalb weniger in der Konformität als im Drumherum:

- **SJF4J** ist großzügiger und akzeptiert deutlich mehr Ausdrücke, die der Standard ablehnt – praktisch beim Umstieg, aber weniger streng, wenn Abfragen portabel bleiben sollen.
- **[jsonlens](https://github.com/MarcusDunn/jsonlens)** kombiniert JSONPath mit JSON Pointer (RFC 6901) und JSON Patch (RFC 6902) – ein Funktionsumfang, den Treetrail nicht hat.
- **Treetrail** setzt den Schwerpunkt auf Betriebssicherheit bei fremden Abfragen, direkte Adapter für die verbreiteten JSON-Bibliotheken, Test-Integration für AssertJ und Spring und die Migrationswerkzeuge für bestehenden Jayway-Code.

## Wie Treetrail getestet wird

Die Compliance Test Suite prüft Grammatik und Semantik, aber nicht, was bei Eingaben passiert, an die niemand gedacht hat. Deshalb kommen hinzu:

- **Fuzzing** mit [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer) in jedem CI-Build und jede Nacht: Kompilieren, Abfragen, Regex-Matching und JSON-Parsing dürfen nur die dokumentierten Ausnahmen werfen und müssen jede Eingabe in fünf Sekunden schaffen. Der Fuzzer hat vor 0.2.0 tatsächlich einen Fehler gefunden: Ein regulärer Ausdruck, der eine leere Gruppe über eine Milliarde Mal wiederholt, brauchte 46 Sekunden zum Kompilieren.
- **Property-Tests** mit [jqwik](https://jqwik.net), etwa dass jeder normalisierte Pfad genau seinen Knoten trifft.
- **Differenzielle Tests:** 20.000 zufällige reguläre Ausdrücke gegen `java.util.regex` und 2.000 zufällige Abfragen gegen [jsonpath-rfc9535](https://github.com/jg-rp/python-jsonpath-rfc9535), eine sorgfältige Python-Implementierung des Standards.
- **Nebenläufigkeit:** 16 Threads teilen sich kompilierte Abfragen, während die Regex-Automaten aufgebaut werden.

Auch die Lieferkette gehört zur Qualität: Jedes Release ist signiert, enthält pro Modul eine CycloneDX-SBOM und eine Build-Provenance-Attestierung, die Jars sind reproduzierbar. Seit Kurzem prüft der Build außerdem die API-Kompatibilität zum letzten Release, die Testabdeckung pro Modul und mit Error Prone und NullAway den Code selbst; das nächste Release bringt [JSpecify](https://jspecify.dev)-Annotationen, sodass auch Kotlin sieht, welche Werte `null` sein können.

## Wie es weitergeht

Der Weg zu 1.0 ist [öffentlich auf GitHub](https://github.com/treetrail/treetrail/milestones) geplant: eine stabile API mit Kompatibilitätsgarantie, weitere statische Analysen und Mutationstests. Vor 1.0 kann sich die API noch ändern – und genau deshalb ist jetzt der beste Zeitpunkt für Rückmeldungen.

Ausprobieren ist eine Zeile:

```kotlin
dependencies {
    implementation("io.github.treetrail:jsonpath-core:0.2.0")
}
```

Treetrail läuft ab Java 17 und steht unter der Apache License 2.0. Wenn Ihnen etwas fehlt oder etwas nicht in Ihren Anwendungsfall passt, [eröffnen Sie gern ein Issue](https://github.com/treetrail/treetrail/issues). Und wenn Sie in Ihrem Team vor der Frage stehen, wie Sie JSONPath-Ausdrücke aus einer gewachsenen Codebasis sicher auf den Standard bringen: [Sprechen Sie mich an](mailto:kontakt@christoph-sens.com).
