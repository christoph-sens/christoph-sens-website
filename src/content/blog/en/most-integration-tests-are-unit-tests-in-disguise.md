---
title: 'Most integration tests are unit tests in disguise'
description: 'A @SpringBootTest is quick to write and expensive to run. Testing domain logic through integration tests costs context restarts, Testcontainers start-ups and long pipelines. How hexagonal architecture puts the test pyramid back on its feet – and which Spring levers take a pipeline from 40 to 20 minutes.'
date: 2026-11-07
key: verkleidete-unit-tests
category: article
tags: [Kotlin, Spring Boot, Testing, Test Pyramid, Hexagonal Architecture, Testcontainers, CI/CD]
---

A bug is in production. The fix is one line and takes five minutes to write. Then the team waits 40 minutes for the pipeline. If a test fails for some unrelated reason, that is another 40 minutes. If you want to be able to release at any time, this is where you have a problem – and the problem is not in the domain logic, it is in the test suite.

On one project we cut the pipeline from 40 to 20 minutes. We did not buy faster runners and we did not delete tests. We asked every integration test what it actually checks. Surprisingly often the answer was: domain logic. My conclusion from that experience is pointed, but I believe it is right: **most integration tests are unit tests in disguise.**

## Why integration tests are so tempting

In the Spring world an integration test is convenient. Put `@SpringBootTest` on the class, pull in the beans you need with `@Autowired`, done. You do not have to think about a class's dependencies, you do not have to build fakes, and the test feels "real". With Testcontainers, a real Postgres database even runs alongside.

The bill comes later, and it comes with every build. A unit test runs in milliseconds. A Spring context takes anything from a few seconds to half a minute to start, depending on the application. A container also takes seconds, often more. As long as all tests share the same context, you barely notice, because Spring caches the context and starts it only once. It gets expensive when the cache does not hit:

- `@DirtiesContext` throws the context away after the test. The next test starts it again.
- Every test class with its own `@MockitoBean`, its own profile or its own properties gets its own context.
- Containers started per test class start again for every test class.

Each of these decisions is harmless on its own. Together, they make the pipeline start and stop the application and its infrastructure dozens of times. Run time does not grow with the number of tests, but with the number of distinct contexts and containers. For us, that was the biggest cost item.

## What an integration test should check – and what it should not

Integration means: we check whether components fit together. Does the message from the queue reach the use case? Does the result end up in the database? Are mapping, SQL and transaction right? These are questions only real or realistically simulated infrastructure can answer.

What an integration test does not need to check:

- **Value ranges.** Whether a calculation is right for 0, 1,200 and 3,500 kWh is a question of domain logic. No database required.
- **Early exits.** Whether a use case skips saving for certain inputs is a decision of the domain logic. An integration test that checks that a component is *not* called does not test integration.
- **Rounding, limits, edge cases.** Everything that makes up a rule belongs to the rule – and therefore in a unit test.

So an integration test for an adapter asks: is the data written, and does reading it back return the same thing? Whether the right values were calculated beforehand is not its job.

That is the test pyramid as it was meant: many fast unit tests at the bottom, a few integration tests in the middle, very few end-to-end tests at the top. In many Spring projects the pyramid stands on its head, because the most convenient test is also the most expensive one.

## Hexagonal architecture makes the separation visible

Turning the pyramid the right way up is hard in a classic layered architecture. If the service knows the JPA repository, the `RestTemplate` and the `KafkaTemplate` directly, a unit test without Spring needs a lot of mocks – and then you reach for `@SpringBootTest` after all.

In a [hexagonal architecture](/blog/hexagonal-architecture-in-practice/) the separation is already built into the code. The domain lives in model and application and knows nothing about Spring. The technology lives in the adapters. The split of the tests follows almost by itself:

| Level | What is checked | How |
|---|---|---|
| Model | Rules, calculations, limits | Unit tests, plain Kotlin |
| Application | Flow of the use case, early exits | Unit tests with fakes for the ports |
| Adapter | Mapping, SQL, serialization, infrastructure | Integration tests with a test slice and a container |
| Bootstrap | Wiring, configuration | one or two smoke tests |

The ports are the seam. Everything in front of a port is tested without infrastructure. Everything behind it is tested with infrastructure, but without domain logic.

## An example: calculating instalments

A contract has a monthly instalment. A new instalment is derived from the forecast annual consumption and the tariff. It is rounded up to a full euro, is at least 15 euros, and is only saved if it differs from the current one by at least 5 euros.

This is what a test looks like as it is written in many projects:

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
        // create an existing instalment, change consumption slightly, check that nothing was saved
    }
}
```

The test is correct and well meant. Still, it has three expensive properties: the container starts again for this class. The `@MockitoBean` forces a context of its own that no other test class shares. And `@DirtiesContext` throws that context away after the last test. Above all, though, its core is domain logic: rounding, minimum amount and threshold. The database is just scenery.

### The rule belongs in the model

The calculation is a domain rule. It lives in the model, without any dependencies:

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

Its test needs neither Spring nor a database. It can cover as many value ranges as the rule demands and still runs in milliseconds:

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

### The flow belongs in the application

The use case connects consumption, calculation and storage. This is also where the early exit lives:

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

Whether a small deviation is saved is checked by a unit test with a simple fake. A fake here is a small in-memory implementation of the port, easier to read than any mock setup:

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

The lambda works if `ConsumptionSource` is declared as a `fun interface`. At 1,300 kWh the instalment comes to 43 euros, the deviation is below 5 euros, so nothing is saved. No context, no container, no `@DirtiesContext`.

### The adapter gets its integration test

That leaves the question that really needs infrastructure: does the adapter write to Postgres correctly, and does it read back the same thing? A test slice is enough for that. `@JdbcTest` starts only the JDBC infrastructure, not the whole application:

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

`PostgresTest` provides the container; the section on countermeasures shows how. By the way, comparing with `isEqualByComparingTo` is not a detail: a `numeric(10,2)` column returns `40.00`, and `BigDecimal("40") == BigDecimal("40.00")` is `false` in Kotlin as in Java. This is exactly the kind of bug the adapter test finds, and exactly what it is there for.

One case, one round trip through the database. Value ranges no longer matter here. The adapter's only responsibility is to store an instalment without loss and read it back.

At the top of the pyramid there is then a single `@SpringBootTest` that checks that the application starts and that one use case runs from the outside in. One, not thirty.

## Countermeasures in Spring

The architecture means fewer integration tests are needed. The remaining ones should be as cheap as possible. These levers have the biggest effect in practice.

### 1. Test slices instead of `@SpringBootTest`

Spring Boot ships a matching slice for most adapters: `@JdbcTest` and `@DataJdbcTest` for JDBC, `@DataJpaTest` for JPA, `@WebMvcTest` for controllers, `@JsonTest` for serialization. A slice loads only the auto-configurations needed for that part. The context is smaller, starts faster, and the annotation already tells you what the test checks.

One pitfall: by default, the database slices replace the data source with an embedded database. If you want to test against Postgres in a container, set `@AutoConfigureTestDatabase(replace = Replace.NONE)`.

### 2. Let the context cache do its work

Spring caches contexts by their configuration: configuration classes, profiles, properties, mock beans. Two test classes with identical configuration share one context. A single different property is enough for a second one.

- Put mocks that many tests need into a shared base class or a shared test configuration instead of declaring them slightly differently in every class.
- Avoid `@TestPropertySource` and profiles per test class unless you really need them.
- Take a look: with `logging.level.org.springframework.test.context.cache=DEBUG`, Spring logs the cache statistics – how many contexts were created and how often they were reused. That number tells you more than any guess.

### 3. Avoid `@DirtiesContext`

`@DirtiesContext` is almost always a shortcut around another problem: a test leaves data behind that disturbs the next one. That can be solved more cheaply. The JDBC and JPA slices are transactional by default and roll back after each test. Where that does not fit, an `@Sql` script or a `TRUNCATE` cleans up before the test. Both cost milliseconds, not an application restart.

### 4. Start containers once per JVM

With `@Container` on a field of the test class, Testcontainers starts the container per class. That is correct, but expensive. A container that starts once per test run and is shared by all tests is enough in the vast majority of cases:

```kotlin
abstract class PostgresTest {
    companion object {
        @JvmStatic
        @ServiceConnection
        val postgres = PostgreSQLContainer("postgres:17-alpine").apply { start() }
    }
}
```

`@ServiceConnection` (since Spring Boot 3.1) reads URL, user and password directly from the container, without `@DynamicPropertySource`. The static field is initialized exactly once, when the JVM loads the class, and every test class that extends `PostgresTest` uses the same container. Testcontainers itself stops it when the JVM exits.

What matters is what is missing: the `@Container` annotation and `@Testcontainers` on the class. With them, the JUnit extension takes over the lifecycle and stops the container after each test class. For one container per test run, you start it yourself.

### 5. Split the pipeline into stages

Unit tests and integration tests belong in separate Gradle tasks, for example with JVM Test Suites and a dedicated `integrationTest` suite. Unit tests run first and fail within seconds if the domain logic is broken. Integration tests run afterwards or in parallel. This does not shorten the total time, but it shortens the time to first feedback – and that is what counts most for a hotfix.

## What this means for delivery

Continuous delivery does not mean that no bug ever reaches production. It means that a bug is out again quickly. The key figure is the time from fix to deployment. A 40-minute pipeline turns a five-minute fix into three quarters of an hour. At 20 minutes it is half that. With two failed attempts, the difference is already an hour.

Slow pipelines also have a side effect that is not measured in minutes: developers batch changes instead of shipping them one by one. Bigger changes mean bigger risks and harder debugging. A fast test suite is therefore not a matter of comfort, it is the precondition for small, frequent releases actually happening.

## What to look out for

- **Ask every integration test one question:** what would go wrong if the infrastructure did not exist? If the answer is "nothing, the calculation would be the same", it is a unit test in disguise.
- **Test rules in the model.** Value ranges, rounding, limits: as many cases as the rule needs, without Spring.
- **Test flows in the application** with small fakes for the ports. Early exits belong here.
- **Give each adapter exactly the integration tests that check its technology.** One round trip per operation is usually enough.
- **Use test slices** instead of `@SpringBootTest`, and keep the full context for one or two smoke tests.
- **Measure the context cache** and avoid `@DirtiesContext`.
- **Start containers once per JVM** in a static field, without `@Container`.
- **Split the pipeline into stages** so that fast feedback comes first.

An integration test is a good tool when it tests integration. Use it for domain logic and you pay for it with every build – and by the next hotfix at the latest, the whole team notices how much.
