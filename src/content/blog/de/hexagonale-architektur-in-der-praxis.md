---
title: 'Hexagonale Architektur in der Praxis: Fachlichkeit und Technik sauber trennen'
description: 'Bei der schrittweisen Ablösung eines Monolithen in der Energiewirtschaft baue ich jede neue Anwendung hexagonal: Model, Application, Adapter und Bootstrap als eigene Gradle-Module, abgesichert mit ArchUnit. Was das Entscheidern, Architekten und Entwicklern bringt, warum es KI-gestützte Entwicklung beschleunigt – und wo es wehtut.'
date: 2026-11-07
key: hexagonale-architektur-in-der-praxis
category: article
tags: [Kotlin, Spring Boot, Architektur, Hexagonale Architektur, ArchUnit, KI]
---

Ein Zählerstand kommt nicht beim Marktpartner an. Liegt der Fehler in der Fachlichkeit, also in der Regel, welcher Zählerstand an wen geht? Oder in der Technik: in der Queue, im Mapping, in der Datenbankabfrage, in einem Timeout? In einem gewachsenen Monolithen ist das oft dieselbe Methode. Wer den Fehler sucht, liest beides gleichzeitig – und versteht keins von beiden richtig.

Genau das ist der Grund, warum ich Backends hexagonal baue. Derzeit löse ich bei einem Energieversorger einen PHP-Monolithen für die Marktkommunikation Schritt für Schritt ab ([zur Success Story](/de/success-stories/abloesung-eines-monolithen/)). Jede neue Anwendung folgt demselben Aufbau. Inzwischen dient er in der Abteilung als Vorlage für weitere Anwendungen. Dieser Beitrag zeigt, wie der Aufbau aussieht, was er bringt und wo er Arbeit macht – für Entscheider, Architekten und Entwickler.

## Der Kern in einem Satz

Hexagonale Architektur, auch „Ports and Adapters“ genannt, trennt die Fachlichkeit einer Anwendung von allem Technischen. Die Fachlichkeit definiert, was sie von außen braucht und anbietet – die Ports. Die Technik liefert dafür Implementierungen – die Adapter. Die Fachlichkeit kennt weder Spring noch AWS noch die Datenbank.

Das Prinzip ist nicht neu. Neu ist, wie sehr es sich heute lohnt: Frameworks bekommen in kurzen Abständen große Versionssprünge, Systeme laufen in der Cloud mit Queues, Topics und Objektspeichern, und Anwendungen müssen jahrelang wartbar bleiben, obwohl sich die Technik darunter mehrfach ändert.

## Wie ich es aufbaue: vier Gradle-Module

Ich teile jede Anwendung in vier Gradle-Module:

- **Model**: die fachlichen Begriffe und Regeln. Reines Kotlin, keine Abhängigkeiten.
- **Application**: die Anwendungsfälle und die Ports, also die Schnittstellen nach außen. Hängt nur vom Model ab.
- **Adapter**: alles Technische. Hier, und nur hier, kommt Spring vor.
- **Bootstrap**: startet die Anwendung und verdrahtet alles miteinander.

In der Anwendung zur Marktkommunikation sieht das so aus: Eingehende Adapter nehmen Nachrichten aus SQS entgegen, stellen REST-Schnittstellen bereit und lösen geplante Abläufe per Scheduler aus. Ausgehende Adapter schreiben in SNS, SQS, S3 und Postgres und sprechen mit externen Marktpartnern. Für die Fachlichkeit ist das alles unsichtbar. Sie weiß nur, dass es „etwas“ gibt, das Zählerstände liefert, und „etwas“, das Nachrichten an Marktpartner verschickt.

## Für Entwickler: wie das im Code aussieht

Ein vereinfachtes Beispiel. Im Model steht die Fachlichkeit:

```kotlin
// model
data class MeterReading(
    val meteringPointId: MeteringPointId,
    val value: BigDecimal,
    val readAt: Instant,
)
```

Im Application-Modul stehen der Anwendungsfall und die Ports, die er braucht:

```kotlin
// application
interface MeterReadingSource {
    fun readingsOf(day: LocalDate): List<MeterReading>
}

interface MarketPartnerNotifier {
    fun send(messages: List<MarketMessage>)
}

class ForwardMeterReadings(
    private val source: MeterReadingSource,
    private val notifier: MarketPartnerNotifier,
) {
    fun forward(day: LocalDate) {
        val messages = source.readingsOf(day).map(MarketMessage::from)
        notifier.send(messages)
    }
}
```

Der Adapter erledigt die Technik. Hier sieht man einen Vorteil, den ich im Alltag sehr schätze: Batching ist eine technische Frage, keine fachliche. SNS nimmt höchstens zehn Nachrichten pro Aufruf an. Das gehört in den Adapter und nicht in den Anwendungsfall:

```kotlin
// adapter
@Component
class SnsMarketPartnerNotifier(
    private val sns: SnsClient,
    private val topic: TopicProperties,
) : MarketPartnerNotifier {

    override fun send(messages: List<MarketMessage>) {
        messages.chunked(10).forEach { batch ->
            sns.publishBatch(batchRequest(topic.arn, batch))
        }
    }
}
```

Die Bootstrap-Ebene verbindet beides. Der Anwendungsfall bleibt eine einfache Klasse ohne Annotationen:

```kotlin
// bootstrap
@SpringBootApplication
class MarketCommunicationApplication {

    @Bean
    fun forwardMeterReadings(source: MeterReadingSource, notifier: MarketPartnerNotifier) =
        ForwardMeterReadings(source, notifier)
}
```

Der Anwendungsfall lässt sich so mit zwei kleinen Fakes testen, ohne Spring-Kontext, ohne Testcontainers, in Millisekunden. Die Adapter teste ich getrennt davon gegen echte oder simulierte Infrastruktur, etwa mit Testcontainers und LocalStack.

## Für Architekten: Regeln, die sich selbst prüfen

Eine Architektur, die nur im Wiki steht, hält nicht lange. Deshalb sichere ich sie auf zwei Ebenen ab.

Die erste Ebene sind die Gradle-Module. Das Application-Modul deklariert nur das Model als Abhängigkeit. Ein Import von Spring kompiliert dort schlicht nicht. Das ist die stärkste Regel, weil sie gar nicht erst gebrochen werden kann.

Die zweite Ebene ist ArchUnit. Es prüft im Build, was Gradle nicht sieht – zum Beispiel, dass nicht doch über eine weitergereichte Abhängigkeit ein Framework in die Fachlichkeit rutscht:

```kotlin
@AnalyzeClasses(packages = ["com.example.marketcommunication"])
class ArchitectureTest {

    @ArchTest
    val domainIsFrameworkFree: ArchRule = noClasses()
        .that().resideInAnyPackage("..model..", "..application..")
        .should().dependOnClassesThat()
        .resideInAnyPackage("org.springframework..", "software.amazon..", "jakarta.persistence..")
}
```

Wer gegen die Regel verstößt, bekommt keinen grünen Build. Diskussionen im Code-Review werden dadurch kürzer, weil die Grundregeln nicht mehr verhandelt werden.

Für Architekten ist noch ein zweiter Punkt wichtig: Ein einheitlicher Aufbau über mehrere Anwendungen hinweg ist mehr wert als der perfekte Aufbau einer einzelnen. Wer eine Anwendung kennt, findet sich in der nächsten sofort zurecht. Genau deshalb nutzt die Abteilung den Aufbau inzwischen als Vorlage.

## Für Entscheider: was die Trennung wirtschaftlich bedeutet

Hexagonale Architektur ist keine Stilfrage für Entwickler. Sie wirkt sich direkt auf Kosten und Risiken aus:

- **Schnellere Fehlersuche.** Ein Fehler lässt sich klar zuordnen: Fachlichkeit oder Technik. Das verkürzt die Zeit bis zur Ursache – gerade bei Störungen im laufenden Betrieb.
- **Fachlichkeit wird beurteilbar.** Die Regeln stehen lesbar an einer Stelle, ohne technisches Beiwerk. Fachbereich und Entwicklung können gemeinsam prüfen, ob die Software tut, was sie soll.
- **Weniger Abhängigkeit von Frameworks.** Ein Framework-Upgrade oder sogar ein Wechsel trifft in erster Linie Adapter und Bootstrap, nicht die Fachlichkeit. Das macht große Versionssprünge planbarer.
- **Schnellerer Start neuer Anwendungen.** Mit einer bewährten Vorlage beginnt ein Team nicht bei null.

Dem steht ein Aufwand gegenüber, den man ehrlich einplanen sollte.

## Hexagonale Architektur und KI: Die Fachsprache macht den Unterschied

Ein Punkt wird oft übersehen: Hexagonale Architektur macht KI-gestützte Entwicklung deutlich wirksamer. Im Model und in der Application steht die Fachlichkeit in der Sprache der Domäne – Zählerstand, Messstelle, Marktpartner, Marktnachricht – ohne technisches Beiwerk.

Genau diese Fachsprache muss der Entwickler beherrschen. Dann kann er Tickets so präzise in fachlichen Begriffen formulieren, dass eine KI sie fast schon automatisiert umsetzt: Der Anwendungsfall ist klar abgegrenzt, die Ports sind benannt, und die Adapter folgen einem bekannten Muster. Die KI muss nicht raten, wo etwas hingehört.

Umgekehrt gilt: Wer die Fachsprache nicht beherrscht, schreibt unscharfe Tickets, und die KI füllt die Lücken mit Annahmen. Die Verantwortung bleibt deshalb beim Menschen. Er spezifiziert, prüft das Ergebnis im Review und entscheidet. Auch hier helfen die Architekturregeln: Generierter Code, der Spring in die Fachlichkeit zieht, bekommt genauso wenig einen grünen Build wie handgeschriebener.

## Wo es wehtut

Die Technik ist nicht das Problem. Das Problem ist die Disziplin.

Viele Entwickler haben jahrelang in Schichten gedacht: Controller, Service, Repository. Hexagonale Architektur verlangt ein anderes Denken. Wo gehört eine Validierung hin? Ist ein Retry fachlich oder technisch? Darf der Anwendungsfall wissen, dass es eine Datenbank gibt? Solche Fragen kommen im Alltag ständig, und nicht jedes Teammitglied versteht die Prinzipien sofort. Das kostet Einarbeitung, Erklärungen und Geduld in Reviews.

Dazu kommt der bekannte Preis zusätzlicher Typen: Fachliche Objekte und technische Darstellungen, etwa das JSON einer Nachricht oder eine Datenbankzeile, sind getrennt, und dazwischen braucht es Mapping-Code.

Trotzdem sehe ich keinen Grund, ein Backend nicht hexagonal zu bauen. Der Einarbeitungsaufwand fällt einmal an. Der Nutzen wächst mit jedem Jahr, das eine Anwendung im Betrieb ist, und mit jedem Framework-Upgrade, das sie überlebt.

## Worauf Sie bei der Einführung achten sollten

**Für Entscheider:**
- Planen Sie Einarbeitung bewusst ein, statt sie nebenbei zu erwarten.
- Fragen Sie nach einer Vorlage, die für alle neuen Anwendungen gilt – nicht nach Einzellösungen pro Team.
- Fordern Sie, dass die Regeln im Build geprüft werden. Dokumentation allein reicht nicht.
- Investieren Sie in das Fachwissen Ihrer Entwickler. Bei KI-gestützter Entwicklung zahlt es sich doppelt aus.

**Für Architekten:**
- Trennen Sie Model, Application, Adapter und Bootstrap in eigene Module, nicht nur in Packages.
- Ergänzen Sie die Modulgrenzen um ArchUnit-Regeln im CI.
- Legen Sie früh fest, wo Querschnittsthemen hingehören: Batching, Retries, Transaktionen.

**Für Entwickler:**
- Schreiben Sie den Anwendungsfall zuerst und die Adapter danach.
- Lernen Sie die Fachsprache. Sie ist die beste Spezifikation – für Menschen und für die KI.
- Testen Sie die Fachlichkeit ohne Spring und die Adapter gegen echte oder simulierte Infrastruktur.
- Wenn Sie im Model oder in der Application eine Framework-Annotation brauchen, ist das ein Warnsignal, keine Ausnahme.

Hexagonale Architektur macht ein Backend nicht automatisch gut. Aber sie sorgt dafür, dass man sieht, wo es gut ist und wo nicht – und das ist bei einer Anwendung, die lange laufen soll, viel wert.
