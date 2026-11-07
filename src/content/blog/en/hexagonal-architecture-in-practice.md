---
title: 'Hexagonal architecture in practice: keeping domain logic and technology apart'
description: 'While replacing a monolith in the energy sector step by step, I build every new application hexagonally: model, application, adapter and bootstrap as separate Gradle modules, enforced with ArchUnit. What this gives decision-makers, architects and developers, why it speeds up AI-assisted development – and where it hurts.'
date: 2026-11-07
key: hexagonale-architektur-in-der-praxis
category: article
tags: [Kotlin, Spring Boot, Architecture, Hexagonal Architecture, ArchUnit, AI]
---

A meter reading never reaches the market partner. Is the bug in the domain logic, in the rule that decides which reading goes to whom? Or in the technology: the queue, the mapping, the database query, a timeout? In a monolith that has grown over the years, both often live in the same method. Whoever hunts the bug reads both at once – and understands neither properly.

That is exactly why I build backends hexagonally. I am currently replacing a PHP monolith for market communication at an energy supplier, one step at a time ([see the success story](/success-stories/monolith-replacement/)). Every new application follows the same structure, and the department now uses it as a template for further applications. This article shows what the structure looks like, what it gives you and where it takes effort – for decision-makers, architects and developers.

## The core idea in one sentence

Hexagonal architecture, also called "ports and adapters", separates an application's domain logic from everything technical. The domain defines what it needs from the outside world and what it offers – the ports. The technology provides implementations for them – the adapters. The domain knows nothing about Spring, AWS or the database.

The principle is not new. What is new is how much it pays off today: frameworks make big version jumps at short intervals, systems run in the cloud with queues, topics and object storage, and applications have to stay maintainable for years while the technology underneath changes several times.

## How I structure it: four Gradle modules

I split every application into four Gradle modules:

- **Model**: the domain concepts and rules. Plain Kotlin, no dependencies.
- **Application**: the use cases and the ports, i.e. the interfaces to the outside. Depends only on the model.
- **Adapter**: everything technical. This is where Spring appears – and only here.
- **Bootstrap**: starts the application and wires everything together.

In the market communication application, it looks like this: inbound adapters receive messages from SQS, expose REST endpoints and trigger scheduled jobs. Outbound adapters write to SNS, SQS, S3 and Postgres and talk to external market partners. None of this is visible to the domain. It only knows that there is "something" that supplies meter readings and "something" that sends messages to market partners.

## For developers: what it looks like in code

A simplified example. The model holds the domain:

```kotlin
// model
data class MeterReading(
    val meteringPointId: MeteringPointId,
    val value: BigDecimal,
    val readAt: Instant,
)
```

The application module holds the use case and the ports it needs:

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

The adapter does the technical work. This shows an advantage I value a lot in day-to-day work: batching is a technical question, not a domain one. SNS accepts at most ten messages per call. That belongs in the adapter, not in the use case:

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

The bootstrap layer connects both. The use case stays a plain class without annotations:

```kotlin
// bootstrap
@SpringBootApplication
class MarketCommunicationApplication {

    @Bean
    fun forwardMeterReadings(source: MeterReadingSource, notifier: MarketPartnerNotifier) =
        ForwardMeterReadings(source, notifier)
}
```

This way, the use case can be tested with two small fakes – no Spring context, no Testcontainers, in milliseconds. I test the adapters separately against real or simulated infrastructure, for example with Testcontainers and LocalStack.

## For architects: rules that check themselves

An architecture that only lives in the wiki does not last long. That is why I enforce it on two levels.

The first level is the Gradle modules. The application module declares only the model as a dependency. A Spring import there simply does not compile. This is the strongest rule because it cannot be broken in the first place.

The second level is ArchUnit. It checks in the build what Gradle cannot see – for example, that no framework slips into the domain through a dependency passed on by another module:

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

Whoever breaks the rule does not get a green build. Code review discussions get shorter, because the ground rules are no longer up for negotiation.

A second point matters for architects: a consistent structure across several applications is worth more than the perfect structure of a single one. Anyone who knows one application finds their way around the next one immediately. That is exactly why the department now uses the structure as a template.

## For decision-makers: what the separation means in business terms

Hexagonal architecture is not a matter of developer taste. It has a direct effect on cost and risk:

- **Faster troubleshooting.** A bug can be attributed clearly: domain or technology. That shortens the time to the root cause – especially during incidents in production.
- **The domain logic can be assessed.** The rules sit readably in one place, without technical clutter. Business and development can check together whether the software does what it should.
- **Less dependence on frameworks.** A framework upgrade, or even a switch, mainly affects adapters and bootstrap, not the domain. That makes big version jumps easier to plan.
- **New applications start faster.** With a proven template, a team does not start from zero.

Against this stands an effort you should plan for honestly.

## Hexagonal architecture and AI: the domain language makes the difference

One point is often overlooked: hexagonal architecture makes AI-assisted development much more effective. The model and the application express the domain in its own language – meter reading, metering point, market partner, market message – without technical clutter.

The developer has to master exactly this domain language. Then they can phrase tickets in domain terms so precisely that an AI implements them almost automatically: the use case is clearly bounded, the ports are named, and the adapters follow a familiar pattern. The AI does not have to guess where something belongs.

The reverse is also true: whoever does not master the domain language writes vague tickets, and the AI fills the gaps with assumptions. That is why responsibility stays with the human. They specify, review the result and decide. The architecture rules help here too: generated code that pulls Spring into the domain gets no green build, just like handwritten code.

## Where it hurts

The technology is not the problem. Discipline is.

Many developers have thought in layers for years: controller, service, repository. Hexagonal architecture requires a different way of thinking. Where does a validation belong? Is a retry a domain or a technical concern? May the use case know that a database exists? Questions like these come up all the time, and not every team member grasps the principles straight away. That costs onboarding time, explanations and patience in reviews.

On top of that comes the well-known price of extra types: domain objects and technical representations, such as the JSON of a message or a database row, are kept apart, and mapping code is needed in between.

Even so, I see no reason not to build a backend hexagonally. The onboarding effort is paid once. The benefit grows with every year an application runs in production and with every framework upgrade it survives.

## What to look out for when introducing it

**For decision-makers:**
- Plan onboarding deliberately instead of expecting it to happen on the side.
- Ask for a template that applies to all new applications – not for one-off solutions per team.
- Require the rules to be checked in the build. Documentation alone is not enough.
- Invest in your developers' domain knowledge. With AI-assisted development, it pays off twice.

**For architects:**
- Separate model, application, adapter and bootstrap into their own modules, not just packages.
- Add ArchUnit rules in CI on top of the module boundaries.
- Decide early where cross-cutting concerns belong: batching, retries, transactions.

**For developers:**
- Write the use case first and the adapters afterwards.
- Learn the domain language. It is the best specification – for people and for AI.
- Test the domain without Spring and the adapters against real or simulated infrastructure.
- If you need a framework annotation in the model or the application, treat it as a warning sign, not an exception.

Hexagonal architecture does not automatically make a backend good. But it makes visible where it is good and where it is not – and for an application that is meant to run for a long time, that is worth a lot.
