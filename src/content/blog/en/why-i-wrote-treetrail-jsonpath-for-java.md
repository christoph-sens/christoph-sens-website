---
title: 'Treetrail: Why I wrote a JSONPath library for Java'
description: 'Treetrail brings RFC 9535, the JSONPath standard, to Java: the same results as in other languages, safe with untrusted queries, adapters for Jackson, Gson and JSON-P – and an orderly way off Jayway JsonPath.'
date: 2026-10-09
key: treetrail-jsonpath-fuer-java
category: article
tags: [Java, JSONPath, RFC 9535, Open Source, Spring]
---

If you work with JSON in Java, you use JSONPath – often without noticing. In Spring tests it sits behind `jsonPath("$.items[0].name")`, in API gateways and integration platforms it picks fields out of webhooks, and in configuration files it describes which value goes where. Surprisingly, JSONPath had no specification for some 17 years after Stefan Goessner's article of 2007. Every library decided for itself what `$..book[-1:]` or `$[?(@.price < 10)]` should return.

That changed in February 2024, when the IETF published [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535), a standard for JSONPath, together with a [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) of 706 test cases. Conformant implementations soon appeared for Python, Rust and .NET. For Java – the platform that probably runs more JSONPath expressions than any other – a mature answer was missing.

[Treetrail](https://github.com/treetrail/treetrail) is my attempt to close that gap. This post explains why the library exists, what it can do today and how it compares with the alternatives.

## The motivation

### One query, several answers

It started with a simple observation: the same JSONPath query returns different results depending on the library. On the array `[0, 1, …, 9]`, for example:

| Query | RFC 9535 | Jayway JsonPath 3.0.0 |
| --- | --- | --- |
| `$[1:6:2]` | `[1, 3, 5]` | `[1, 2, 3, 4, 5]` |
| `$[9:0:-1]` | `[9, 8, 7, 6, 5, 4, 3, 2, 1]` | `[]` |

As long as an expression lives in a single Java service, this hardly shows. But once the same query is evaluated in the backend, in a Python script for data analysis and in a TypeScript frontend, it gets tricky: three components, three interpretations, and the bug only shows up in production. That is exactly what standards are for. A standard only helps, though, if every platform has an implementation that really follows it.

### Jayway JsonPath: a great service, but older than the standard

By far the most widely used JSONPath library in Java is [Jayway JsonPath](https://github.com/json-path/JsonPath). It has served the Java ecosystem extremely well since 2011, and Spring uses it for its `jsonPath(...)` matchers. But it was created long before there was a standard – and so, through no fault of its own, it does not conform to it. Measured against the Compliance Test Suite, Jayway 3.0.0 returns the same result as the standard for 86 of the 459 valid queries; with filters put in parentheses, as Jayway requires, it is 176. Conversely, Jayway accepts 132 of the 247 queries that the standard considers invalid.

A library this widely used cannot simply change its behavior without breaking thousands of projects. That calls for a separate, standard-conformant library – and for a way to switch to it without risk.

### Queries from untrusted sources

The third reason is security. More and more often, JSONPath expressions don't come from your own code but from tenants, users or third-party configuration. Then a query must not be able to take the service down. Regular expressions with backtracking are the best-known weak spot: the pattern `((a+)+)+b` against 24 `a`s and a `!` keeps `java.util.regex` busy for about 0.4 seconds on JDK 25 – and every further `a` doubles the time.

### And a personal reason

I have been building backends with Java and Kotlin for more than 15 years. To me, open source is the most honest way to show how I work: every decision, every test and every bug is public. Treetrail is written in Java on purpose, not in Kotlin – a dependency on the Kotlin standard library would make adoption by projects such as Spring, Apache Camel or Apache NiFi needlessly harder.

## What Treetrail can do today

Version 0.2.0 has been on Maven Central since 8 October 2026. Its key features:

### Standard-conformant – checked in every build

Treetrail passes all 706 cases of the Compliance Test Suite, on Java 17, 21 and 25 and with every supported JSON model. If a single case fails, the build fails. Where the standard leaves room or the test suite deviates from the RFC text, the decision is documented in [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md).

### One kind of result

Every query returns a list of nodes, whether it selects one value or many. Every node knows its normalized path. There is no configuration option that changes what a query returns.

```java
JsonPath path = JsonPath.compile("$.store.book[?@.price < 10].title");

NodeList<Object> nodes = path.query(document);
nodes.values(); // ["Sayings of the Century", "Moby Dick"]
nodes.paths();  // ["$['store']['book'][0]['title']", "$['store']['book'][2]['title']"]
```

### The JSON tree you already have

The core has no dependencies besides the JDK. It works on plain Java maps and lists, or parses JSON text itself with a small, strict parser. Adapters query the trees of Jackson 2 and 3, Gson and Jakarta JSON-P directly – without conversion – and return that library's own nodes, so you can keep working with them. Other models plug in through a small interface.

```java
JsonNode document = objectMapper.readTree(json);
NodeList<JsonNode> books = JsonPath.compile("$.store.book[?@.price < 10]")
        .query(document, Jackson2Model.INSTANCE);
```

### Safe with untrusted queries

Regular expressions in `match()` and `search()` follow [I-Regexp (RFC 9485)](https://www.rfc-editor.org/rfc/rfc9485) and run on Treetrail's own automaton engine without backtracking, in linear time. The pattern above that costs `java.util.regex` 0.4 seconds takes Treetrail less than a tenth of a microsecond. On top of that, every run has limits: a budget of visited nodes, a maximum depth and a cap on the result size. Even if a document brings thousands of different regular expressions along, the caches hold about 10 MB at most.

```java
JsonPath path = JsonPath.compile(untrustedExpression)
        .withLimits(EvaluationLimits.DEFAULT.withMaxVisitedNodes(1_000_000).withMaxResultSize(10_000));
```

### Fast

Conformance doesn't cost speed. In the JMH benchmarks, Treetrail is at least on par with Jayway JsonPath in every query; on Jackson trees, the most common setup in practice, it is 1.2 to 2.2 times faster, and 1.7 times faster at compiling an expression. The measurements and their caveats are in [docs/benchmarks.md](https://github.com/treetrail/treetrail/blob/main/docs/benchmarks.md).

### Made for tests

Most JSONPath code in Java projects lives in tests. Two modules bring the standard there: AssertJ assertions and a replacement for Spring's `jsonPath(...)` matchers in MockMvc and WebTestClient.

```java
mockMvc.perform(get("/store"))
        .andExpect(jsonPath("$.store.book[?@.price < 10].title").values("Sayings of the Century", "Moby Dick"));
```

Values compare as JSON values: `399`, `399L` and `399.0` all match the JSON number `399`. A failing assertion names the expression and shows the values it found, with their paths.

### An orderly way off Jayway

Nobody likes to migrate on a hunch. That's why Treetrail comes with two tools:

- **`jsonpath-migration`** runs your expressions with Jayway JsonPath and with Treetrail against sample documents and reports every difference – with a rewrite hint for Jayway-specific syntax. It uses the Jayway version your project already depends on and takes your Jayway configuration into account.
- **`jsonpath-rewrite`** contains an [OpenRewrite](https://docs.openrewrite.org) recipe that finds every JSONPath expression in a code base that is passed to Jayway or to Spring's matchers, and assesses it: valid RFC 9535, Jayway-only, write API, or computed at runtime.

The README also has a [table of Jayway idioms and their equivalents](https://github.com/treetrail/treetrail#jayway-idioms-and-their-equivalents).

## How Treetrail compares

### Compared with Jayway JsonPath

| | Treetrail | Jayway JsonPath |
| --- | --- | --- |
| Standard | RFC 9535, all 706 CTS cases | its own dialect, older than the standard |
| Result of `$.a.b` | always a node list with paths | a single value or a list, depending on path and configuration |
| Filters | `[?@.price < 10]` (parentheses optional) | `[?(@.price < 10)]` |
| Regular expressions | I-Regexp, linear time | `java.util.regex` with backtracking |
| Limits for untrusted queries | node budget, depth, result size, regex memory | – |
| JSON libraries | Java objects, Jackson 2/3, Gson, JSON-P | json-smart, Jackson, Gson and others via providers |
| Spring test matchers | separate module | built into Spring |
| Write API (`set`, `delete`) | no, queries only | yes |
| Type mapping (`read(…, Integer.class)`) | no, via your own JSON library | yes |
| Aggregate functions (`sum()`, `avg()`, …) | no; standard functions `length()`, `count()`, `match()`, `search()`, `value()` | yes |

The table also shows where Jayway offers more: the write API, type mapping and aggregate functions are convenient and deliberately not part of the standard. If you rely on them heavily, the README shows how to do the same with Treetrail and your own JSON library – or you keep Jayway for those places. The two libraries can live side by side without trouble.

### Compared with other RFC 9535 implementations in Java

Treetrail is not the only Java library that implements the standard, and that's a good thing. Christoph Burgmer's [JSONPath Comparison](https://github.com/cburgmer/json-path-comparison) has compared dozens of implementations across all languages for years. I have submitted a [pull request](https://github.com/cburgmer/json-path-comparison/pull/170) for Treetrail there; in a local run over 258 queries, the picture for Java looks like this (agreement with the cross-language consensus on 175 queries):

| Implementation | Consensus matched |
| --- | --- |
| Treetrail | 173 |
| ajp (based on XSLT/ixml) | 173 |
| SJF4J | 173 |
| Jayway JsonPath 3.0.0 | 143 |
| JSurfer | 133 |

The two remaining queries are shorthand forms that are invalid under RFC 9535 – there the standard deliberately departs from the old consensus. What I find remarkable is that Treetrail and ajp, two entirely independent implementations, answer all 258 queries identically. That is exactly what a standard is supposed to achieve.

So the differences lie less in conformance than in everything around it:

- **SJF4J** is more lenient and accepts considerably more expressions that the standard rejects – handy when switching, but less strict if queries are meant to stay portable.
- **[jsonlens](https://github.com/MarcusDunn/jsonlens)** combines JSONPath with JSON Pointer (RFC 6901) and JSON Patch (RFC 6902) – features Treetrail doesn't have.
- **Treetrail** focuses on operational safety with untrusted queries, direct adapters for the common JSON libraries, test integration for AssertJ and Spring, and migration tools for existing Jayway code.

## How Treetrail is tested

The Compliance Test Suite checks grammar and semantics, but not what happens with inputs nobody thought of. So on top of it:

- **Fuzzing** with [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer) in every CI build and every night: compiling, querying, regex matching and JSON parsing may only throw the documented exceptions and must finish each input within five seconds. The fuzzer did find a bug before 0.2.0: a regular expression that repeated an empty group more than a billion times took 46 seconds to compile.
- **Property tests** with [jqwik](https://jqwik.net), for example that every normalized path selects exactly its node.
- **Differential tests:** 20,000 random regular expressions against `java.util.regex`, and 2,000 random queries against [jsonpath-rfc9535](https://github.com/jg-rp/python-jsonpath-rfc9535), a careful Python implementation of the standard.
- **Concurrency:** 16 threads share compiled queries while the regex automata are being built.

The supply chain is part of quality too: every release is signed and ships a CycloneDX SBOM and a build provenance attestation per module, and the jars are reproducible. Recently, the build has also started checking API compatibility with the last release, test coverage per module, and the code itself with Error Prone and NullAway; the next release brings [JSpecify](https://jspecify.dev) annotations, so Kotlin sees which values can be `null`.

## What's next

The road to 1.0 is planned [in the open on GitHub](https://github.com/treetrail/treetrail/milestones): a stable API with a compatibility guarantee, more static analysis and mutation testing. Before 1.0 the API may still change – which makes now the best time for feedback.

Trying it takes one line:

```kotlin
dependencies {
    implementation("io.github.treetrail:jsonpath-core:0.2.0")
}
```

Treetrail runs on Java 17 and later and is licensed under the Apache License 2.0. If something is missing or doesn't fit your use case, please [open an issue](https://github.com/treetrail/treetrail/issues). And if your team is wondering how to move JSONPath expressions in a grown code base safely to the standard: [get in touch](mailto:contact@christoph-sens.com).
