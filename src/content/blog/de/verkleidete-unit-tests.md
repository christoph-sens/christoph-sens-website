---
title: 'Die meisten Integrationstests sind verkleidete Unit-Tests'
description: 'Ein @SpringBootTest ist schnell geschrieben und teuer in der Ausführung. Wer Fachlogik über Integrationstests prüft, bezahlt mit Kontext-Neustarts, Testcontainers und langen Pipelines. Wie die hexagonale Architektur die Testpyramide wieder geraderückt – und welche Spring-Hebel eine Pipeline von 40 auf 20 Minuten bringen.'
date: 2026-11-07
key: verkleidete-unit-tests
category: article
tags: [Kotlin, Spring Boot, Testing, Testpyramide, Hexagonale Architektur, Testcontainers, CI/CD]
---

Ein Fehler ist in Produktion. Der Fix ist eine Zeile, nach fünf Minuten ist er geschrieben. Danach wartet das Team 40 Minuten auf die Pipeline. Läuft ein Test aus anderem Grund rot, sind es noch einmal 40 Minuten. Wer „jederzeit releasen“ will, hat an dieser Stelle ein Problem, und dieses Problem steht nicht in der Fachlogik, sondern in der Testsuite.

In einem Projekt haben wir die Pipeline von 40 auf 20 Minuten halbiert. Wir haben dafür keine schnelleren Runner gekauft und keine Tests gestrichen. Wir haben bei jedem Integrationstest gefragt, was er eigentlich prüft. Die Antwort war erstaunlich oft: Fachlogik. Meine These nach dieser Erfahrung ist zugespitzt, aber ich halte sie für richtig: **Die meisten Integrationstests sind verkleidete Unit-Tests.**

## Warum Integrationstests so verlockend sind

Im Spring-Umfeld ist ein Integrationstest bequem. `@SpringBootTest` an die Klasse, die benötigten Beans per `@Autowired` holen, fertig. Man muss sich nicht überlegen, welche Abhängigkeiten eine Klasse hat, man muss keine Fakes bauen, und der Test fühlt sich „echt“ an. Mit Testcontainers läuft sogar eine richtige Postgres-Datenbank mit.

Die Rechnung kommt später, und sie kommt bei jedem Build. Ein Unit-Test läuft in Millisekunden. Ein Spring-Kontext braucht je nach Anwendung einige Sekunden bis zu einer halben Minute zum Starten. Ein Container braucht ebenfalls Sekunden, oft mehr. Solange alle Tests denselben Kontext nutzen, fällt das kaum auf, denn Spring cacht den Kontext und startet ihn nur einmal. Teuer wird es, wenn der Cache nicht greift:

- `@DirtiesContext` wirft den Kontext nach dem Test weg. Der nächste Test startet ihn neu.
- Jede Testklasse mit eigenem `@MockitoBean`, eigenem Profil oder eigenen Properties bekommt einen eigenen Kontext.
- Container, die pro Testklasse gestartet werden, starten bei jeder Testklasse neu.

Jede dieser Entscheidungen ist für sich harmlos. In der Summe fährt die Pipeline die Anwendung samt Infrastruktur dutzende Male hoch und wieder herunter. Die Laufzeit wächst nicht linear mit der Anzahl der Tests, sondern mit der Anzahl der unterschiedlichen Kontexte und Container. Bei uns war das der größte Posten.

## Was ein Integrationstest prüfen soll – und was nicht

Integration heißt: Wir prüfen, ob Komponenten ineinandergreifen. Kommt die Nachricht aus der Queue beim Anwendungsfall an? Landet das Ergebnis in der Datenbank? Stimmen Mapping, SQL und Transaktion? Das sind Fragen, die nur mit echter oder realistisch simulierter Infrastruktur beantwortet werden können.

Was ein Integrationstest nicht prüfen muss:

- **Wertebereiche.** Ob eine Berechnung bei 0, bei 1.200 und bei 3.500 kWh stimmt, ist eine Frage der Fachlogik. Dafür braucht es keine Datenbank.
- **Abbruchkriterien.** Ob ein Anwendungsfall bei bestimmten Eingaben gar nicht erst speichert, ist eine Entscheidung der Fachlogik. Ein Integrationstest, der prüft, dass eine Komponente *nicht* aufgerufen wird, prüft keine Integration.
- **Rundungen, Grenzwerte, Sonderfälle.** Alles, was eine Regel ausmacht, gehört zur Regel – und damit in einen Unit-Test.

Ein Integrationstest für einen Adapter fragt also: Wird geschrieben, und kommt beim Lesen dasselbe heraus? Ob vorher das Richtige berechnet wurde, ist nicht seine Aufgabe.

Das ist die Testpyramide, wie sie gemeint ist: viele schnelle Unit-Tests unten, wenige Integrationstests in der Mitte, sehr wenige End-to-End-Tests oben. In vielen Spring-Projekten steht die Pyramide auf dem Kopf, weil der bequemste Test auch der teuerste ist.

## Hexagonale Architektur macht die Trennung sichtbar

Die Pyramide umzudrehen, ist in einer klassischen Schichtenarchitektur mühsam. Wenn der Service direkt das JPA-Repository, den `RestTemplate` und den `KafkaTemplate` kennt, ist ein Unit-Test ohne Spring nur mit vielen Mocks möglich – und dann greift man doch wieder zu `@SpringBootTest`.

In einer [hexagonalen Architektur](/de/blog/hexagonale-architektur-in-der-praxis/) ist die Trennung schon im Code angelegt. Die Fachlichkeit liegt in Model und Application und kennt kein Spring. Die Technik liegt in den Adaptern. Daraus ergibt sich die Aufteilung der Tests fast von selbst:

| Ebene | Was wird geprüft | Wie |
|---|---|---|
| Model | Regeln, Berechnungen, Grenzwerte | Unit-Tests, reines Kotlin |
| Application | Ablauf des Anwendungsfalls, Abbruchkriterien | Unit-Tests mit Fakes für die Ports |
| Adapter | Mapping, SQL, Serialisierung, Infrastruktur | Integrationstests mit Test-Slice und Container |
| Bootstrap | Verdrahtung, Konfiguration | ein bis zwei Smoke-Tests |

Die Ports sind die Nahtstelle. Alles, was vor dem Port passiert, wird ohne Infrastruktur getestet. Alles, was hinter dem Port passiert, mit Infrastruktur, aber ohne Fachlogik.

## Ein Beispiel: die Abschlagsberechnung

Ein Vertrag hat einen monatlichen Abschlag. Aus dem prognostizierten Jahresverbrauch und dem Tarif ergibt sich ein neuer Abschlag. Er wird auf volle Euro aufgerundet, beträgt mindestens 15 Euro und wird nur gespeichert, wenn er um mindestens 5 Euro vom bisherigen abweicht.

So sieht ein Test aus, wie er in vielen Projekten entsteht:

```kotlin
@SpringBootTest
@Testcontainers
class AdjustInstallmentIT {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }

    @Autowired lateinit var adjustInstallment: AdjustInstallment
    @Autowired lateinit var installments: InstallmentRepository
    @MockitoBean lateinit var consumption: ConsumptionSource

    @ParameterizedTest
    @CsvSource("0, 15", "1200, 40", "3500, 98")
    fun `calculates monthly installment`(kwh: BigDecimal, expected: BigDecimal) {
        whenever(consumption.annualForecast(CONTRACT)).thenReturn(kwh)

        adjustInstallment.adjust(CONTRACT, TARIFF)

        assertThat(installments.current(CONTRACT)!!.monthly).isEqualByComparingTo(expected)
    }

    @Test
    @DirtiesContext
    fun `does not save small deviations`() {
        // bestehenden Abschlag anlegen, Verbrauch leicht ändern, prüfen, dass nichts gespeichert wurde
    }
}
```

Der Test ist korrekt und gut gemeint. Er hat trotzdem drei teure Eigenschaften: Der Container startet für diese Klasse neu. Der `@MockitoBean` erzwingt einen eigenen Kontext, den keine andere Testklasse teilt. Und `@DirtiesContext` wirft diesen Kontext nach dem letzten Test weg. Vor allem aber prüft er im Kern Fachlogik: Rundung, Mindestbetrag und Schwellenwert. Die Datenbank ist dabei nur Kulisse.

### Die Regel gehört ins Model

Die Berechnung ist eine fachliche Regel. Sie steht im Model, ohne jede Abhängigkeit:

```kotlin
// model
data class Installment(val contractId: ContractId, val monthly: BigDecimal) {

    fun deviatesSignificantlyFrom(other: Installment): Boolean =
        (monthly - other.monthly).abs() >= SIGNIFICANT_DEVIATION

    companion object {
        private val MINIMUM = BigDecimal("15")
        private val SIGNIFICANT_DEVIATION = BigDecimal("5")

        fun calculate(contractId: ContractId, forecastKwh: BigDecimal, tariff: Tariff): Installment {
            val yearly = tariff.basePricePerYear + forecastKwh * tariff.pricePerKwh
            val monthly = yearly.divide(BigDecimal(12), 0, RoundingMode.CEILING)
            return Installment(contractId, maxOf(monthly, MINIMUM))
        }
    }
}
```

Der Test dafür braucht weder Spring noch Datenbank. Er kann so viele Wertebereiche abdecken, wie die Regel verlangt, und läuft trotzdem in Millisekunden:

```kotlin
class InstallmentTest {

    private val tariff = Tariff(basePricePerYear = BigDecimal("120"), pricePerKwh = BigDecimal("0.30"))

    @ParameterizedTest
    @CsvSource("0, 15", "100, 15", "1200, 40", "3500, 98")
    fun `rounds up to full euro and applies minimum`(kwh: BigDecimal, expected: BigDecimal) {
        val installment = Installment.calculate(CONTRACT, kwh, tariff)

        assertThat(installment.monthly).isEqualByComparingTo(expected)
    }

    @ParameterizedTest
    @CsvSource("40, 44, false", "40, 45, true", "40, 35, true")
    fun `detects significant deviation`(old: BigDecimal, new: BigDecimal, expected: Boolean) {
        val result = Installment(CONTRACT, new).deviatesSignificantlyFrom(Installment(CONTRACT, old))

        assertThat(result).isEqualTo(expected)
    }
}
```

### Der Ablauf gehört in die Application

Der Anwendungsfall verbindet Verbrauch, Berechnung und Speicherung. Hier steht auch das Abbruchkriterium:

```kotlin
// application
interface InstallmentRepository {
    fun current(contractId: ContractId): Installment?
    fun save(installment: Installment)
}

class AdjustInstallment(
    private val consumption: ConsumptionSource,
    private val installments: InstallmentRepository,
) {
    fun adjust(contractId: ContractId, tariff: Tariff) {
        val forecast = consumption.annualForecast(contractId)
        val new = Installment.calculate(contractId, forecast, tariff)
        val current = installments.current(contractId)

        if (current != null && !new.deviatesSignificantlyFrom(current)) return

        installments.save(new)
    }
}
```

Ob bei einer kleinen Abweichung gespeichert wird, prüft ein Unit-Test mit einem einfachen Fake. Ein Fake ist hier eine kleine Implementierung des Ports im Speicher, lesbarer als jedes Mock-Setup:

```kotlin
class InMemoryInstallments : InstallmentRepository {
    val saved = mutableListOf<Installment>()
    private val current = mutableMapOf<ContractId, Installment>()

    fun given(installment: Installment) { current[installment.contractId] = installment }
    override fun current(contractId: ContractId) = current[contractId]
    override fun save(installment: Installment) { saved += installment }
}

class AdjustInstallmentTest {

    private val installments = InMemoryInstallments()

    @Test
    fun `does not save small deviations`() {
        installments.given(Installment(CONTRACT, BigDecimal("40")))
        val adjust = AdjustInstallment({ BigDecimal("1300") }, installments)

        adjust.adjust(CONTRACT, TARIFF)

        assertThat(installments.saved).isEmpty()
    }
}
```

Der Lambda-Ausdruck funktioniert, wenn `ConsumptionSource` als `fun interface` deklariert ist. Bei 1.300 kWh ergibt sich ein Abschlag von 43 Euro, die Abweichung liegt unter 5 Euro, also wird nichts gespeichert. Kein Kontext, kein Container, kein `@DirtiesContext`.

### Der Adapter bekommt seinen Integrationstest

Bleibt die Frage, die tatsächlich Infrastruktur braucht: Schreibt der Adapter korrekt in Postgres, und liest er dasselbe wieder? Dafür reicht ein Test-Slice. `@JdbcTest` startet nur die JDBC-Infrastruktur, nicht die ganze Anwendung:

```kotlin
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JdbcInstallmentRepository::class)
class JdbcInstallmentRepositoryIT(
    @Autowired private val repository: JdbcInstallmentRepository,
) : PostgresTest() {

    @Test
    fun `saves and reads installment`() {
        repository.save(Installment(CONTRACT, BigDecimal("40")))

        assertThat(repository.current(CONTRACT)!!.monthly).isEqualByComparingTo("40")
    }
}
```

`PostgresTest` stellt den Container bereit; wie, zeigt der Abschnitt zu den Gegenmitteln. Der Vergleich mit `isEqualByComparingTo` ist übrigens kein Detail: Aus einer `numeric(10,2)`-Spalte kommt `40.00` zurück, und `BigDecimal("40") == BigDecimal("40.00")` ist in Kotlin wie in Java `false`. Genau solche Fehler findet der Adapter-Test, und genau dafür ist er da.

Ein Fall, ein Rundlauf durch die Datenbank. Wertebereiche spielen hier keine Rolle mehr. Die einzige Verantwortung des Adapters ist, einen Abschlag verlustfrei zu speichern und wieder zu lesen.

Oben auf der Pyramide steht dann noch ein einziger `@SpringBootTest`, der prüft, dass die Anwendung startet und ein Anwendungsfall von außen nach innen durchläuft. Einer, nicht dreißig.

## Die Gegenmittel im Spring-Kontext

Die Architektur sorgt dafür, dass weniger Integrationstests nötig sind. Die verbleibenden sollten so billig wie möglich sein. Diese Hebel haben in der Praxis den größten Effekt.

### 1. Test-Slices statt `@SpringBootTest`

Spring Boot bringt für die meisten Adapter einen passenden Slice mit: `@JdbcTest` und `@DataJdbcTest` für JDBC, `@DataJpaTest` für JPA, `@WebMvcTest` für Controller, `@JsonTest` für die Serialisierung. Ein Slice lädt nur die Auto-Konfigurationen, die für diesen Ausschnitt nötig sind. Der Kontext ist kleiner, startet schneller, und der Test zeigt schon in der Annotation, was er prüft.

Ein Stolperstein: Die Datenbank-Slices ersetzen die Datenquelle standardmäßig durch eine eingebettete Datenbank. Wer gegen Postgres im Container testen will, setzt `@AutoConfigureTestDatabase(replace = Replace.NONE)`.

### 2. Den Kontext-Cache arbeiten lassen

Spring cacht Kontexte anhand ihrer Konfiguration: Konfigurationsklassen, Profile, Properties, Mock-Beans. Zwei Testklassen mit identischer Konfiguration teilen sich einen Kontext. Eine abweichende Property reicht für einen zweiten.

- Legen Sie Mocks, die viele Tests brauchen, in eine gemeinsame Basisklasse oder eine gemeinsame Test-Konfiguration, statt sie in jeder Klasse leicht anders zu deklarieren.
- Vermeiden Sie `@TestPropertySource` und Profile pro Testklasse, wenn es nicht wirklich nötig ist.
- Schauen Sie hin: Mit `logging.level.org.springframework.test.context.cache=DEBUG` gibt Spring die Cache-Statistik aus, also wie viele Kontexte erzeugt und wie oft sie wiederverwendet wurden. Diese Zahl ist aufschlussreicher als jede Vermutung.

### 3. `@DirtiesContext` vermeiden

`@DirtiesContext` ist fast immer eine Abkürzung für ein anderes Problem: Ein Test hinterlässt Daten, die den nächsten stören. Das lässt sich billiger lösen. Die JDBC- und JPA-Slices sind standardmäßig transaktional und rollen nach jedem Test zurück. Wo das nicht passt, räumt ein `@Sql`-Skript oder ein `TRUNCATE` vor dem Test auf. Beides kostet Millisekunden, nicht einen Neustart der Anwendung.

### 4. Container einmal pro JVM starten

Mit `@Container` an einem Feld der Testklasse startet Testcontainers den Container pro Klasse. Das ist korrekt, aber teuer. Ein Container, der einmal pro Testlauf startet und von allen Tests genutzt wird, reicht in den allermeisten Fällen:

```kotlin
abstract class PostgresTest {
    companion object {
        @JvmStatic
        @ServiceConnection
        val postgres = PostgreSQLContainer("postgres:17-alpine").apply { start() }
    }
}
```

`@ServiceConnection` (seit Spring Boot 3.1) liest URL, Benutzer und Passwort direkt aus dem Container, ohne `@DynamicPropertySource`. Das statische Feld wird genau einmal initialisiert, wenn die JVM die Klasse lädt, und alle Testklassen, die von `PostgresTest` erben, nutzen denselben Container. Gestoppt wird er am Ende der JVM von Testcontainers selbst.

Entscheidend ist, was fehlt: die Annotation `@Container` und `@Testcontainers` an der Klasse. Mit ihnen übernimmt die JUnit-Extension den Lebenszyklus und stoppt den Container nach jeder Testklasse wieder. Für einen Container pro Testlauf startet man ihn deshalb selbst.

### 5. Die Pipeline in Stufen schneiden

Unit-Tests und Integrationstests gehören in getrennte Gradle-Tasks, etwa über die JVM Test Suites mit einer eigenen Suite `integrationTest`. Die Unit-Tests laufen zuerst und scheitern in Sekunden, wenn die Fachlogik kaputt ist. Die Integrationstests laufen danach oder parallel. Das verkürzt nicht die Gesamtzeit, aber die Zeit bis zur ersten Rückmeldung, und die zählt beim Hotfix am meisten.

## Was das für die Lieferfähigkeit bedeutet

Continuous Delivery bedeutet nicht, dass nie ein Fehler in Produktion geht. Es bedeutet, dass ein Fehler schnell wieder draußen ist. Die wichtigste Kennzahl dafür ist die Zeit von der Korrektur bis zum Deployment. Eine Pipeline von 40 Minuten macht aus einem Fünf-Minuten-Fix eine Dreiviertelstunde. Bei 20 Minuten ist es die Hälfte. Bei zwei Fehlversuchen ist der Unterschied schon eine Stunde.

Langsame Pipelines haben außerdem eine Nebenwirkung, die man nicht in Minuten misst: Entwickler sammeln Änderungen, statt sie einzeln auszuliefern. Größere Änderungen bedeuten größere Risiken und schwierigere Fehlersuche. Eine schnelle Testsuite ist deshalb keine Komfortfrage, sondern die Voraussetzung dafür, dass kleine, häufige Releases überhaupt gelebt werden.

## Worauf Sie achten sollten

- **Stellen Sie jedem Integrationstest eine Frage:** Was würde schiefgehen, wenn es die Infrastruktur nicht gäbe? Lautet die Antwort „nichts, die Berechnung wäre dieselbe“, ist es ein verkleideter Unit-Test.
- **Testen Sie Regeln im Model.** Wertebereiche, Rundungen, Grenzwerte: so viele Fälle, wie die Regel braucht, ohne Spring.
- **Testen Sie Abläufe in der Application** mit kleinen Fakes für die Ports. Abbruchkriterien gehören hierher.
- **Geben Sie jedem Adapter genau die Integrationstests, die seine Technik prüfen.** Ein Rundlauf pro Operation reicht meist.
- **Nutzen Sie Test-Slices** statt `@SpringBootTest`, und halten Sie den vollständigen Kontext für ein, zwei Smoke-Tests zurück.
- **Messen Sie den Kontext-Cache** und vermeiden Sie `@DirtiesContext`.
- **Starten Sie Container einmal pro JVM** in einem statischen Feld, ohne `@Container`.
- **Trennen Sie die Pipeline in Stufen**, damit die schnelle Rückmeldung zuerst kommt.

Ein Integrationstest ist ein gutes Werkzeug, wenn er Integration prüft. Wer ihn für Fachlogik einsetzt, bezahlt bei jedem Build dafür – und spätestens beim nächsten Hotfix merkt das ganze Team, wie viel.
