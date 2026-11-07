---
title: 'Wenn das Zielsystem nicht mehr kann: Circuit Breaker als Schutz für Legacy-Backends'
description: 'Warum Batching und Rate Limiting allein nicht reichen, wie ein Circuit Breaker mit gekoppelter Queue-Verarbeitung die Dead Letter Queue leer hält – und wie latenzbasierte Konfiguration ein überlastetes Altsystem wieder auf 99,9 % Verfügbarkeit gebracht hat.'
date: 2026-11-07
key: circuit-breaker-fuer-legacy-backends
category: article
tags: [Resilience, Circuit Breaker, Spring Boot, Resilience4j, Messaging]
---

Das Alerting meldet sich nachts um zwei. Die Dead Letter Queue füllt sich, mehrere Tausend Nachrichten in wenigen Minuten. Der Bereitschaftsdienst prüft das eigene System: alle Pods laufen, die Health Checks sind grün, die Queues nehmen weiter Daten an. Trotzdem kommt nichts beim Zielsystem an. Das Problem liegt nicht bei uns, wir haben es aber am Hals. Am nächsten Morgen wartet ein halber Tag Arbeit: DLQ sichten, Nachrichten einzeln oder in Tranchen zurückspielen, mit dem Fachbereich klären, was in der Zwischenzeit fehlte.

Viele Teams, die Daten für ein Altsystem aufbereiten und weiterreichen, kennen dieses Muster. In diesem Artikel beschreibe ich, wie wir es mit einem Circuit Breaker gelöst haben, was dabei technisch passiert und worauf man bei der Einführung achten sollte.

## Die Ausgangslage: vorgelagerte Verarbeitung, synchrone Übergabe

Unser System arbeitet einem anderen System vor. Es nimmt Daten aus verschiedenen Quellen entgegen, validiert, reichert an, transformiert und übergibt das Ergebnis per REST an das Zielsystem. Intern ist die Verarbeitung asynchron über Queues entkoppelt, die letzte Meile ist ein synchroner HTTP-Aufruf.

Das Zielsystem ist ein gewachsenes Legacy-System: fachlich zentral, technisch an seinen Grenzen. Es skaliert kaum horizontal, teilt sich Datenbank und Ressourcen mit anderen Funktionen und reagiert empfindlich auf Lastspitzen. Und wir sind nicht der einzige Lieferant. Mehrere vorgelagerte Systeme schicken ihm Daten, jedes nach eigenem Takt.

Die naheliegendste Lösung wäre, die Übergabe selbst asynchron zu machen: Das Zielsystem holt sich die Daten aus einer Queue, sobald es Kapazität hat, und bestimmt sein Tempo selbst. Genau das ist hier leider nicht möglich. Das Legacy-System bietet nur seine synchrone REST-Schnittstelle an, und eine Umstellung auf eine asynchrone Arbeitsweise würde tiefe Eingriffe in eine Anwendung erfordern, die kaum noch weiterentwickelt wird. Das ist in solchen Landschaften eher die Regel als die Ausnahme. Wir mussten also mit der synchronen Schnittstelle leben und die Last auf unserer Seite in den Griff bekommen.

## Was wir vorher versucht haben und warum es nur begrenzt half

Bevor man zum Circuit Breaker greift, gibt es eine Reihe naheliegender Maßnahmen. Wir haben die meisten davon umgesetzt:

- **Batching**: Statt jede Nachricht einzeln zu übertragen, fassen wir mehrere zusammen. Das spart Verbindungs- und Protokoll-Overhead, verschiebt die Last aber nur. Große Batches erzeugen auf der Gegenseite lange Transaktionen und eigene Spitzen.
- **Rate Limiting**: Wir begrenzen die Aufrufe pro Zeiteinheit auf einen Wert, den das Zielsystem laut Abstimmung verträgt. Das Problem: Dieser Wert ist statisch, die Belastbarkeit des Altsystems ist es nicht. Läuft dort gerade ein Batch-Job, oder schickt ein anderes vorgelagertes System parallel Daten, ist der vereinbarte Wert plötzlich zu hoch.
- **Retries mit Exponential Backoff**: Fehlgeschlagene Aufrufe werden mit wachsendem Abstand wiederholt. Gegen kurze Aussetzer hilft das. Bei echter Überlast verschlimmert es die Lage, weil jede Wiederholung zusätzliche Last erzeugt. Man spricht von einem Retry Storm.
- **Timeouts**: Kurze Timeouts schützen die eigenen Threads vor dem Hängenbleiben. Die Anfrage ist auf der Gegenseite aber oft schon in Bearbeitung und verbraucht dort weiter Ressourcen.
- **Begrenzte Parallelität (Bulkhead)**: Wir haben die Zahl gleichzeitiger Consumer und offener Verbindungen gedeckelt. Das macht die Last berechenbarer, aber auch hier gilt: der Deckel kennt den Zustand des Zielsystems nicht.
- **Zeitliche Entzerrung**: Nicht dringende Datenlieferungen haben wir in Nebenzeiten verschoben.

All das hat geholfen, aber nicht genug. Allen Maßnahmen gemeinsam ist ein blinder Fleck: Sie reagieren nicht darauf, wie es dem Zielsystem *gerade* geht. Sie senden weiter, auch wenn die Gegenseite längst signalisiert, dass sie nicht mehr kann. Die Folge war ein bekanntes Bild: Latenzen stiegen von Millisekunden auf viele Sekunden, dann folgten Timeouts und HTTP-5xx-Fehler, schließlich war das System gar nicht mehr erreichbar. Bei uns liefen die Retries aus, und die Nachrichten landeten auf der DLQ.

## Das Prinzip Circuit Breaker

Der Circuit Breaker ist nach der elektrischen Sicherung benannt und wurde vor allem durch Michael Nygards Buch *Release It!* bekannt. Die Idee: Wenn ein abhängiges System offensichtlich gestört ist, hören wir auf, es weiter zu belasten. Wir scheitern sofort und kontrolliert, statt jeden Aufruf erst in einen Timeout laufen zu lassen.

Technisch ist der Circuit Breaker ein Zustandsautomat mit drei Zuständen:

**Closed (geschlossen)**: Der Normalbetrieb. Alle Aufrufe gehen durch. Der Circuit Breaker beobachtet dabei die Ergebnisse in einem gleitenden Fenster, etwa die letzten 100 Aufrufe oder die letzten 60 Sekunden. Er zählt, wie viele davon fehlgeschlagen sind und wie viele langsamer waren als ein definierter Schwellwert.

**Open (offen)**: Überschreitet die Fehlerrate oder die Rate langsamer Aufrufe einen Grenzwert, zum Beispiel 50 %, öffnet der Circuit Breaker. Ab jetzt werden Aufrufe gar nicht erst abgeschickt, sondern sofort mit einer Exception abgelehnt. Das Zielsystem bekommt eine Atempause, und das eigene System verschwendet keine Threads und Verbindungen auf Aufrufe, die ohnehin scheitern würden.

**Half-Open (halb offen)**: Nach einer festgelegten Wartezeit wechselt der Circuit Breaker in einen Testmodus. Er lässt eine kleine, begrenzte Zahl von Aufrufen durch, etwa fünf oder zehn. Sind diese erfolgreich und schnell genug, schließt er wieder und der Normalbetrieb läuft an. Scheitern sie, öffnet er erneut und die Wartezeit beginnt von vorn.

Der entscheidende Unterschied zu Retries und Rate Limiting: Der Circuit Breaker entscheidet auf Basis von *beobachtetem Verhalten*. Er braucht keine im Voraus vereinbarte Belastungsgrenze, sondern reagiert auf das, was das Zielsystem tatsächlich zurückmeldet.

## Circuit Breaker und Queues: Verarbeitung anhalten statt Nachrichten verbrennen

Ein Circuit Breaker allein löst unser DLQ-Problem noch nicht. Wenn er öffnet und der Queue-Consumer weiterläuft, wird jede Nachricht sofort abgelehnt, schneller als vorher, und landet entsprechend schneller auf der DLQ. Man hat dann ein sehr effizientes System zum Füllen der Dead Letter Queue gebaut.

Die eigentliche Lösung liegt in der Kopplung: **Öffnet der Circuit Breaker, stoppen wir die Queue-Verarbeitung.** Die Nachrichten bleiben dort, wo sie hingehören, in der Eingangsqueue. Sie sind weder verloren noch fehlerhaft, sie warten nur. Die Queue übernimmt damit die Rolle eines Puffers, für die sie gemacht ist.

Konkret sieht der Ablauf so aus:

1. Der Circuit Breaker wechselt nach *Open*. Ein Listener auf das Zustandsereignis pausiert die betroffenen Consumer.
2. Nach Ablauf der Wartezeit wechselt der Circuit Breaker automatisch nach *Half-Open*. Der Consumer wird wieder aktiviert, aber nur so weit, dass einzelne Nachrichten als Testtransaktionen durchgehen.
3. Gehen die Testaufrufe durch, schließt der Circuit Breaker, und die Consumer arbeiten den aufgelaufenen Rückstand ab, idealerweise mit gedrosselter Parallelität, damit nicht sofort die nächste Lastspitze entsteht.
4. Scheitern sie, öffnet der Circuit Breaker erneut, und die Consumer pausieren wieder.

Ein Detail, das in der Praxis wichtig ist: Nachrichten, die vom Circuit Breaker abgelehnt werden, dürfen nicht als Verarbeitungsfehler zählen. Sie müssen zurück in die Queue (nicht bestätigen, Sichtbarkeit zurücksetzen, Requeue, je nach Broker), ohne den Zähler zu erhöhen, der irgendwann zur DLQ-Weiterleitung führt. Sonst landen sie doch wieder dort. Die DLQ bleibt damit für das reserviert, wofür sie gedacht ist: Nachrichten, die *inhaltlich* nicht verarbeitbar sind, nicht solche, die nur zur falschen Zeit kamen.

## Alerting: Wer ist eigentlich zuständig?

Ein Nebeneffekt, den wir unterschätzt hatten, betrifft den Betrieb. Vor dem Circuit Breaker lief es meist so: Das Alerting schlug an, weil die DLQ wuchs. Der Support wurde kontaktiert, prüfte unser System und fand nichts, denn unser System war erreichbar und funktionierte. Wir konnten die Daten nur nicht weiterleiten. Bis klar war, dass die Ursache beim Zielsystem lag, verging wertvolle Zeit, oft mit mehreren Beteiligten in einem Call.

Der Circuit Breaker liefert hier ein präzises Signal. Ein Alert "Circuit Breaker zum Zielsystem X offen" sagt sofort, wo das Problem liegt und wer es beheben kann. Wir haben die Zustandswechsel als Metrik exportiert und den Alert so geschnitten, dass er direkt an das Betriebsteam des Zielsystems geht und bei uns nur informativ ist. Unser Bereitschaftsdienst muss nachts nicht mehr aufstehen, um festzustellen, dass er nichts tun kann. Und nach der Störung muss niemand die DLQ von Hand zurückspielen: Die Verarbeitung läuft von selbst wieder an, sobald das Zielsystem reagiert.

## Der eigentliche Hebel: auf Latenz reagieren, bevor das System fällt

Bis hierhin schützt der Circuit Breaker vor allem *uns*: vor DLQ-Fluten, nutzlosen Aufrufen und Fehlalarmen. Die größere Wirkung entfaltet er, wenn man ihn nicht erst auf Fehler, sondern schon auf **steigende Latenz** reagieren lässt.

Ein überlastetes System fällt selten schlagartig aus. Es wird erst langsam, dann sehr langsam, dann unerreichbar. Die steigende Antwortzeit ist das Frühwarnsignal. Wer sie ignoriert und weiter mit voller Last sendet, treibt das Zielsystem in den Ausfall, den er eigentlich vermeiden will. Der Ausfall ist dann zu einem guten Teil selbst verursacht.

Moderne Circuit-Breaker-Implementierungen erlauben deshalb, neben der Fehlerrate eine **Slow Call Rate** zu konfigurieren: Ein Aufruf gilt als "langsam", wenn er länger als ein definierter Schwellwert dauert, etwa zwei Sekunden statt der üblichen 200 Millisekunden. Überschreitet der Anteil langsamer Aufrufe einen Grenzwert, öffnet der Circuit Breaker, obwohl noch kein einziger Aufruf fehlgeschlagen ist.

Das Ergebnis ist ein Rhythmus, der die Last auf das Zielsystem dosiert: kurze Pausen, dann wenige Testaufrufe im Half-Open-Zustand, dann wieder volle Last, sobald die Antwortzeiten stimmen. In Summe fließen in einer Belastungsphase deutlich weniger Nachrichten zum Zielsystem, und es bekommt die Chance, seinen Rückstand abzuarbeiten, bevor es kippt.

Ehrlicherweise: Der Circuit Breaker ist ein binäres Instrument, er ist offen oder geschlossen. Eine stufenlose Drosselung leistet er nicht. Wer feiner steuern will, kombiniert ihn mit einer begrenzten Parallelität, die bei steigender Latenz reduziert wird, oder mit adaptiven Concurrency-Limits. Für unseren Fall war die latenzbasierte Konfiguration des Circuit Breakers aber der entscheidende Schritt.

## Das Ergebnis: erst die Summe macht den Unterschied

Den Circuit Breaker haben wir zunächst in unserem System eingeführt. Die DLQ-Vorfälle verschwanden fast vollständig, und die nächtlichen Alarme bei uns ebenso. Am Zielsystem änderte sich zunächst aber weniger, als wir gehofft hatten. Der Grund liegt auf der Hand: Wir waren nur einer von mehreren Lieferanten. Wenn wir zurückhaltend werden, die anderen aber weiter mit voller Last senden, bleibt das Zielsystem überlastet.

Den Durchbruch brachte die Einführung desselben Musters bei *allen* vorgelagerten Systemen. Erst als jeder Lieferant auf steigende Latenz mit Zurückhaltung reagierte, entstand ein System, das sich selbst stabilisiert. Seitdem erfüllt das Legacy-System wieder seine SLA von 99,9 % Verfügbarkeit, ohne dass an ihm selbst etwas umgebaut werden musste.

Diese Erkenntnis ist für Entscheider vielleicht die wichtigste: Resilienz in verteilten Systemen ist keine Eigenschaft einzelner Komponenten, sondern eine Eigenschaft des Zusammenspiels. Ein einzelnes Team kann sich schützen. Das gemeinsame Zielsystem schützen nur alle zusammen. Das ist auch eine organisatorische Aufgabe: Jemand muss das Muster als Standard für alle Schnittstellen zu diesem System durchsetzen.

## Umsetzung in Spring Boot mit Resilience4j

Im Java- und Spring-Umfeld ist [Resilience4j](https://resilience4j.readme.io/) die gängige Bibliothek für Circuit Breaker. Sie hat Netflix Hystrix abgelöst, das sich seit 2018 nur noch im Wartungsmodus befindet. Resilience4j ist leichtgewichtig, modular und bringt neben dem Circuit Breaker auch Retry, Rate Limiter, Bulkhead und TimeLimiter mit, also genau die Bausteine, die man kombinieren möchte. Mit `resilience4j-spring-boot3` gibt es eine direkte Spring-Boot-Integration; alternativ bietet Spring Cloud Circuit Breaker eine Abstraktionsschicht, unter der Resilience4j als Implementierung arbeitet.

Die Konfiguration erfolgt deklarativ, etwa in der `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      legacySystem:
        slidingWindowType: TIME_BASED
        slidingWindowSize: 60                  # Sekunden
        minimumNumberOfCalls: 20
        failureRateThreshold: 50               # Prozent
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 50              # Prozent
        waitDurationInOpenState: 30s
        automaticTransitionFromOpenToHalfOpenEnabled: true
        permittedNumberOfCallsInHalfOpenState: 5
        registerHealthIndicator: true
```

Im Code genügt eine Annotation am Client:

```java
@CircuitBreaker(name = "legacySystem")
public void deliver(Payload payload) {
    restClient.post()
        .uri("/api/data")
        .body(payload)
        .retrieve()
        .toBodilessEntity();
}
```

Die Kopplung an die Queue-Verarbeitung erfolgt über die Event-API. Über die `CircuitBreakerRegistry` registriert man einen Listener auf Zustandswechsel und pausiert oder startet damit die Listener-Container, bei Spring Kafka etwa über die `KafkaListenerEndpointRegistry`, bei JMS über `stop()` und `start()` des Containers. Zustände und Metriken landen über Micrometer automatisch im Monitoring, und der Health Indicator macht den Zustand im Actuator-Endpunkt sichtbar.

Bei der Reihenfolge der Bausteine lohnt ein zweiter Blick: Retries sollten *innerhalb* des Circuit Breakers liegen oder so konfiguriert sein, dass sie bei offenem Circuit Breaker (`CallNotPermittedException`) nicht greifen. Sonst wiederholt man Aufrufe, die der Circuit Breaker gerade bewusst verhindert.

## Empfehlungen für die Einführung

Aus unserem Projekt lassen sich einige Kriterien ableiten, die ich Teams in ähnlicher Lage mitgeben würde:

**Latenz als erstes Signal nutzen.** Konfigurieren Sie den Circuit Breaker nicht nur auf Fehler, sondern auf langsame Aufrufe. Der Schwellwert sollte sich an den gemessenen Normalwerten orientieren, nicht am Timeout. Wer erst bei 30 Sekunden reagiert, reagiert zu spät.

**Queue-Verarbeitung mit dem Circuit Breaker koppeln.** Ein Circuit Breaker vor einem weiterlaufenden Consumer verlagert das Problem nur. Abgelehnte Nachrichten gehören zurück in die Queue, nicht in die DLQ.

**Schwellwerte mit echten Daten kalibrieren.** Mindestanzahl an Aufrufen, Fenstergröße und Wartezeit bestimmen, wie nervös oder träge der Circuit Breaker reagiert. Starten Sie mit konservativen Werten, beobachten Sie Zustandswechsel über einige Wochen und justieren Sie nach. Ein Circuit Breaker, der ständig flattert, ist genauso unbrauchbar wie einer, der nie auslöst.

**Alerting nach Zuständigkeit schneiden.** Ein offener Circuit Breaker ist ein Signal für das Team des Zielsystems. Leiten Sie den Alarm dorthin, wo jemand handeln kann.

**Den Wiederanlauf drosseln.** Nach einer Störung wartet ein Rückstand. Wenn alle Consumer gleichzeitig mit voller Parallelität starten, erzeugen sie die nächste Lastspitze. Ein langsames Hochfahren verhindert das.

**Das Muster für alle Lieferanten etablieren.** Wenn mehrere Systeme dasselbe Backend beliefern, wirkt der Circuit Breaker erst dann voll, wenn alle ihn einsetzen. Das braucht eine Vereinbarung über Teamgrenzen hinweg, idealerweise als verbindlicher Standard für die Anbindung des Systems.

Ein Circuit Breaker macht ein Altsystem nicht leistungsfähiger. Er sorgt dafür, dass alle Beteiligten seine Grenzen respektieren. Oft reicht das, um ein System, das als nicht mehr zu retten galt, wieder verlässlich zu betreiben, und es verschafft die Zeit, die eine echte Modernisierung braucht.
