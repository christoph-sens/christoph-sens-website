---
title: 'When the Target System Can No Longer Cope: Circuit Breakers as Protection for Legacy Backends'
description: 'Why batching and rate limiting alone are not enough, how a circuit breaker coupled with queue processing keeps the dead letter queue empty – and how latency-based configuration brought an overloaded legacy system back to 99.9% availability.'
date: 2026-11-07
key: circuit-breaker-fuer-legacy-backends
category: article
tags: [Resilience, Circuit Breaker, Spring Boot, Resilience4j, Messaging]
---

The alert fires at two in the morning. The dead letter queue is filling up, several thousand messages within a few minutes. The on-call engineer checks our own system: all pods are running, the health checks are green, the queues keep accepting data. Yet nothing reaches the target system. The problem is not ours, but we are the ones stuck with it. The next morning brings half a day of work: going through the DLQ, replaying messages one by one or in batches, and clarifying with the business side what was missing in the meantime.

Many teams that prepare data for a legacy system and pass it on know this pattern. In this article I describe how we solved it with a circuit breaker, what happens technically, and what to watch out for when introducing one.

## The starting point: upstream processing, synchronous handover

Our system works upstream of another system. It receives data from various sources, validates, enriches and transforms it, and hands the result over to the target system via REST. Internally, processing is decoupled asynchronously through queues; the last mile is a synchronous HTTP call.

The target system is a legacy system that has grown over many years: central to the business, technically at its limits. It barely scales horizontally, shares its database and resources with other functions, and reacts sensitively to load peaks. And we are not its only supplier. Several upstream systems send it data, each at its own pace.

The obvious solution would be to make the handover itself asynchronous: the target system pulls the data from a queue whenever it has capacity and sets its own pace. Unfortunately, that is exactly what is not possible here. The legacy system only offers its synchronous REST interface, and switching it to an asynchronous way of working would require deep changes to an application that is barely being developed any more. In landscapes like this, that is the rule rather than the exception. So we had to live with the synchronous interface and get the load under control on our side.

## What we tried before, and why it only helped to a limited extent

Before reaching for a circuit breaker, there are a number of obvious measures. We implemented most of them:

- **Batching**: Instead of transferring each message individually, we combine several. That saves connection and protocol overhead, but it only shifts the load. Large batches cause long transactions and peaks of their own on the other side.
- **Rate limiting**: We cap the calls per unit of time at a value the target system can supposedly handle according to what was agreed. The problem: this value is static, the capacity of the legacy system is not. If a batch job is running there, or another upstream system is sending data at the same time, the agreed value is suddenly too high.
- **Retries with exponential backoff**: Failed calls are repeated with increasing intervals. That helps against short outages. Under real overload it makes things worse, because every retry creates additional load. This is known as a retry storm.
- **Timeouts**: Short timeouts protect our own threads from hanging. But on the other side the request is often already being processed and keeps consuming resources there.
- **Limited concurrency (bulkhead)**: We capped the number of concurrent consumers and open connections. That makes the load more predictable, but here too the cap knows nothing about the state of the target system.
- **Spreading load over time**: We moved non-urgent data deliveries to off-peak hours.

All of this helped, but not enough. All of these measures share a blind spot: they do not react to how the target system is doing *right now*. They keep sending even when the other side has long been signalling that it can no longer cope. The result was a familiar picture: latencies rose from milliseconds to many seconds, then came timeouts and HTTP 5xx errors, and finally the system was not reachable at all. On our side the retries ran out and the messages ended up in the DLQ.

## The circuit breaker principle

The circuit breaker is named after the electrical fuse and became widely known mainly through Michael Nygard's book *Release It!*. The idea: when a dependent system is obviously in trouble, we stop putting load on it. We fail immediately and in a controlled way instead of letting every call run into a timeout first.

Technically, a circuit breaker is a state machine with three states:

**Closed**: Normal operation. All calls go through. The circuit breaker observes the results in a sliding window, for example the last 100 calls or the last 60 seconds. It counts how many of them failed and how many were slower than a defined threshold.

**Open**: If the failure rate or the rate of slow calls exceeds a threshold, for example 50%, the circuit breaker opens. From now on calls are not even sent; they are rejected immediately with an exception. The target system gets a breather, and our own system does not waste threads and connections on calls that would fail anyway.

**Half-open**: After a defined waiting time, the circuit breaker switches to a test mode. It lets a small, limited number of calls through, say five or ten. If they succeed and are fast enough, it closes again and normal operation resumes. If they fail, it opens again and the waiting time starts over.

The decisive difference from retries and rate limiting: the circuit breaker decides based on *observed behaviour*. It needs no load limit agreed in advance; it reacts to what the target system actually reports back.

## Circuit breakers and queues: pause processing instead of burning messages

A circuit breaker alone does not yet solve our DLQ problem. If it opens and the queue consumer keeps running, every message is rejected immediately, faster than before, and ends up in the DLQ correspondingly faster. You have then built a very efficient system for filling the dead letter queue.

The real solution lies in the coupling: **when the circuit breaker opens, we stop queue processing.** The messages stay where they belong, in the input queue. They are neither lost nor faulty; they are just waiting. The queue thus takes on the role of a buffer, which is what it is made for.

Concretely, the flow looks like this:

1. The circuit breaker switches to *open*. A listener on the state event pauses the affected consumers.
2. After the waiting time, the circuit breaker automatically switches to *half-open*. The consumer is reactivated, but only so far that individual messages go through as test transactions.
3. If the test calls succeed, the circuit breaker closes and the consumers work through the backlog, ideally with throttled concurrency so that the next load peak does not follow immediately.
4. If they fail, the circuit breaker opens again and the consumers pause again.

One detail that matters in practice: messages rejected by the circuit breaker must not count as processing errors. They have to go back to the queue (no acknowledgement, reset visibility, requeue, depending on the broker) without increasing the counter that eventually leads to forwarding to the DLQ. Otherwise they end up there after all. That keeps the DLQ reserved for what it is meant for: messages that cannot be processed because of their *content*, not ones that just arrived at the wrong time.

## Alerting: who is actually responsible?

A side effect we had underestimated concerns operations. Before the circuit breaker, it usually went like this: the alert fired because the DLQ was growing. Support was contacted, checked our system and found nothing, because our system was reachable and working. We just could not forward the data. Until it was clear that the cause lay with the target system, valuable time passed, often with several people on a call.

The circuit breaker provides a precise signal here. An alert saying "circuit breaker to target system X is open" immediately tells you where the problem is and who can fix it. We exported the state transitions as a metric and set up the alert so that it goes directly to the operations team of the target system and is only informational for us. Our on-call engineer no longer has to get up at night to find out there is nothing they can do. And after the outage, nobody has to replay the DLQ by hand: processing resumes on its own as soon as the target system responds.

## The real lever: react to latency before the system goes down

Up to this point, the circuit breaker mainly protects *us*: from DLQ floods, pointless calls and false alarms. It has a much bigger effect when you let it react not only to errors but already to **rising latency**.

An overloaded system rarely fails all at once. It first becomes slow, then very slow, then unreachable. Rising response time is the early warning signal. Anyone who ignores it and keeps sending at full load drives the target system into exactly the outage they want to avoid. A good part of that outage is then self-inflicted.

Modern circuit breaker implementations therefore let you configure a **slow call rate** in addition to the failure rate: a call counts as "slow" if it takes longer than a defined threshold, for example two seconds instead of the usual 200 milliseconds. If the share of slow calls exceeds a threshold, the circuit breaker opens, even though not a single call has failed yet.

The result is a rhythm that doses the load on the target system: short pauses, then a few test calls in the half-open state, then full load again as soon as response times are back to normal. Overall, significantly fewer messages flow to the target system during a period of heavy load, and it gets the chance to work through its backlog before it tips over.

To be honest: the circuit breaker is a binary instrument, it is either open or closed. It cannot throttle smoothly. If you want finer control, combine it with limited concurrency that is reduced as latency rises, or with adaptive concurrency limits. In our case, though, the latency-based configuration of the circuit breaker was the decisive step.

## The result: only the sum makes the difference

We first introduced the circuit breaker in our own system. The DLQ incidents disappeared almost completely, and so did the night-time alarms on our side. At the target system, however, less changed at first than we had hoped. The reason is obvious: we were only one of several suppliers. If we hold back but the others keep sending at full load, the target system stays overloaded.

The breakthrough came when the same pattern was introduced in *all* upstream systems. Only when every supplier responded to rising latency by holding back did a system emerge that stabilises itself. Since then the legacy system has been meeting its SLA of 99.9% availability again, without anything having to be rebuilt in the system itself.

For decision-makers, this insight is perhaps the most important: resilience in distributed systems is not a property of individual components but a property of how they interact. A single team can protect itself. Only everyone together can protect the shared target system. That is also an organisational task: someone has to establish the pattern as the standard for all interfaces to this system.

## Implementation in Spring Boot with Resilience4j

In the Java and Spring world, [Resilience4j](https://resilience4j.readme.io/) is the usual library for circuit breakers. It replaced Netflix Hystrix, which has only been in maintenance mode since 2018. Resilience4j is lightweight and modular, and besides the circuit breaker it also brings retry, rate limiter, bulkhead and time limiter, exactly the building blocks you want to combine. With `resilience4j-spring-boot3` there is a direct Spring Boot integration; alternatively, Spring Cloud Circuit Breaker offers an abstraction layer with Resilience4j as the implementation underneath.

Configuration is declarative, for example in `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      legacySystem:
        slidingWindowType: TIME_BASED
        slidingWindowSize: 60                  # seconds
        minimumNumberOfCalls: 20
        failureRateThreshold: 50               # percent
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 50              # percent
        waitDurationInOpenState: 30s
        automaticTransitionFromOpenToHalfOpenEnabled: true
        permittedNumberOfCallsInHalfOpenState: 5
        registerHealthIndicator: true
```

In the code, an annotation on the client is enough:

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

The coupling to queue processing works via the event API. Through the `CircuitBreakerRegistry` you register a listener for state transitions and use it to pause or start the listener containers, with Spring Kafka for example via the `KafkaListenerEndpointRegistry`, with JMS via `stop()` and `start()` on the container. States and metrics end up in monitoring automatically via Micrometer, and the health indicator makes the state visible in the Actuator endpoint.

The order of the building blocks deserves a second look: retries should sit *inside* the circuit breaker or be configured so that they do not kick in when the circuit breaker is open (`CallNotPermittedException`). Otherwise you retry calls that the circuit breaker is deliberately preventing.

## Recommendations for the introduction

From our project, a few criteria can be derived that I would pass on to teams in a similar situation:

**Use latency as the first signal.** Do not configure the circuit breaker on errors alone, but on slow calls. The threshold should be based on measured normal values, not on the timeout. If you only react at 30 seconds, you react too late.

**Couple queue processing to the circuit breaker.** A circuit breaker in front of a consumer that keeps running just moves the problem. Rejected messages belong back in the queue, not in the DLQ.

**Calibrate thresholds with real data.** The minimum number of calls, the window size and the waiting time determine how nervous or sluggish the circuit breaker is. Start with conservative values, observe state transitions over a few weeks and adjust. A circuit breaker that flaps constantly is just as useless as one that never trips.

**Route alerts by responsibility.** An open circuit breaker is a signal for the team of the target system. Send the alarm to where someone can act.

**Throttle the restart.** After an outage there is a backlog waiting. If all consumers start at the same time with full concurrency, they create the next load peak. Ramping up slowly prevents that.

**Establish the pattern for all suppliers.** When several systems feed the same backend, the circuit breaker only takes full effect once all of them use it. That requires an agreement across team boundaries, ideally as a binding standard for connecting to the system.

A circuit breaker does not make a legacy system more powerful. It makes sure that everyone involved respects its limits. Often that is enough to run a system that was considered beyond saving reliably again, and it buys the time a real modernisation needs.
