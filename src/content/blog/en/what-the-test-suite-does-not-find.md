---
title: 'What the test suite does not find: how I harden a JSONPath library'
description: 'Passing all 715 cases of the official test suite is not enough. Fuzzing, differential tests, mutation testing and a close reading of the specification found bugs in Treetrail and Eclipse Parsson that no test suite shows – and a bug in the test suite itself.'
date: 2026-11-02
key: was-die-testsuite-nicht-findet
category: article
tags: [Java, JSONPath, RFC 9535, Testing, Fuzzing, Open Source]
---

[Treetrail](https://github.com/treetrail/treetrail), my JSONPath library for Java, passes all 715 cases of the official [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) for RFC 9535. On Java 17, 21 and 25, with every supported JSON model, in every build. That sounds like "done". It isn't.

A test suite checks whether an implementation gives the right answer to known questions. It does not check what happens when someone asks a question nobody thought of while writing the suite. And it can be wrong itself. This post describes the methods I use to harden Treetrail beyond the suite – and what they found.

## Why it matters

More and more often, JSONPath expressions don't come from your own code. Tenants configure which fields of a webhook they care about. Overlays for OpenAPI specifications use JSONPath to select what they change. In those cases both the query and the document are untrusted input. Then it is not enough for the library to compute correctly. It must not hang, crash or hold unbounded memory on malicious or simply broken input either.

This is not specific to JSONPath. Every parser, rule engine and template system in a backend has the same problem. The methods carry over.

## Fuzzing: what happens with nonsense?

A fuzzer generates millions of random, slightly mutated inputs and watches whether the program crashes or hangs. For Treetrail I use [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer). The rules are simple: compiling, querying, regular expressions and JSON parsing may only throw the documented exceptions and must finish each input within five seconds. Every CI build fuzzes each target for 15 seconds, a nightly run for ten minutes.

The five-second limit is the more important part. A crash gets noticed. A query that keeps the server busy for hours gets noticed in production.

Fuzzing found exactly such a case – not in Treetrail itself, but in a streaming variant for JSON-P that I am working on. The query `$..[?@..*]..[-5]..a.a` over 999 nested arrays – a 2 KB document, within the default limits – ran for hours. The limit on visited nodes did not kick in, because part of the work was never counted as a visit: run time grew with the fifth power of the depth, the counted visits only with its square. Since the fix, all work is counted, and the same input fails after a few seconds with a clear error message.

A limit only protects you if it measures what actually costs time.

### A bug known since 2020

The same fuzzing turned up a second problem, this time in [Eclipse Parsson](https://github.com/eclipse-ee4j/parsson), the reference implementation of Jakarta JSON Processing. `skipObject()` and `skipArray()` loop forever on truncated JSON such as `{` or `[1,` instead of reporting an error. Anyone reading JSON from the network gets truncated data sooner or later.

The bug has been reported as [issue #23](https://github.com/eclipse-ee4j/parsson/issues/23) since 2020, and the current version 1.1.9 is still affected. My fix is open as [pull request #174](https://github.com/eclipse-ee4j/parsson/pull/174). It is small: the loop checks whether the input has ended.

The example shows why fuzzing pays off even when you only use an established library. Your own tests cover your own assumptions. The fuzzer has none.

## Differential tests: two implementations, one answer

If there is a second, independent implementation of the same thing, you can feed both the same random inputs and compare. Every difference is a bug on one of the two sides. You don't need an oracle that knows the right answer – it is enough that two independent teams rarely make the same mistake.

Treetrail runs two such comparisons:

- **Regular expressions:** 20,000 random expressions against `java.util.regex`, each with `match()` and `search()` on random inputs. Treetrail evaluates regular expressions with its own automaton, without backtracking, so that patterns from untrusted documents cannot cause exponential run time. An automaton of your own is a source of bugs of your own; the comparison keeps it honest.
- **Whole queries:** 2,000 random queries on random documents against an independent RFC 9535 implementation in Python. About one query in seven is damaged on purpose, so that rejecting invalid queries is compared as well.

For the JSON-P variant I scaled this up: 14.4 million generated queries, comparing Treetrail with the implementations for Parsson and Apache Johnzon. The three are not independent – both JSON-P versions descend from Treetrail. Still, there was one difference: an `ArithmeticException` in Johnzon for the number `1e1000000` – a valid JSON number that nobody had thought of.

## Mutation testing: who tests the tests?

High coverage only says that code was executed, not that a bug would be noticed. Mutation testing turns the question around: the tool, here [PIT](https://pitest.org), deliberately plants small bugs in the compiled code – a `<` becomes `<=`, a condition is negated, a return value is dropped – and checks whether the tests notice.

In Treetrail's core, PIT creates 1,399 such mutations. The tests detect 87 percent of them; below 85, the nightly run fails. The remaining 13 percent are not all gaps – some mutations don't change the behaviour at all. But every surviving mutation is a concrete question: would I notice this bug? Often the answer is no, and then a test is missing.

## Read the specification – even against the test suite

The most instructive question needed no tool. RFC 9535 refers to I-Regexp, [RFC 9485](https://www.rfc-editor.org/rfc/rfc9485), for regular expressions. Its grammar lists `^` and `$` as ordinary characters. The test suite, however, expected them to act as anchors in two cases, as in most regex dialects. If you followed the grammar, you failed the suite. If you followed the suite, you deviated from the RFC.

Treetrail followed the suite at first. Glyn Normington, co-editor of RFC 9535, pointed out the contradiction in an [issue](https://github.com/treetrail/treetrail/issues/46), and Tim Bray, one of the authors of RFC 9485, made clear there that I-Regexp has no anchors – expressions are always anchored anyway. I then [reported it to the test suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/issues/122) and submitted the correction as [pull request #125](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/125). Treetrail will follow the RFC as soon as it is merged.

A test suite is code, and code has bugs. If you implement a standard, read the standard, not just the tests.

## Memory: the question nobody asks

One last point, because it practically never appears in test suites: how much memory does a library hold on to? Treetrail initially cached compiled regex automata process-wide. That is fast as long as the patterns come from your own code. When they come from documents – `$[?match(@.v, @.p)]` reads the pattern from the document – every document can bring new patterns. 256 suitably crafted patterns held 392 MB that way.

Today each automaton has its own budget, all of them together share about 8 MiB, and patterns from documents cannot displace those of other queries. [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md#limits) lists all limits. The question behind it is simple and still rarely asked: what happens when an attacker writes the document?

## What I take away

None of these methods is new, and none is expensive. Together they cost a fraction of the time it took to write the library. For projects I advise, the same order applies:

1. **Set limits for untrusted input** – time, memory, depth – and test them. Fuzzing with a time limit per input finds what unit tests miss.
2. **Compare against a second implementation** where there is one. For parsers, formats and protocols there almost always is.
3. **Measure the tests, not just the coverage.** Mutation testing shows which bugs would slip through unnoticed.
4. **Read the specification**, and resolve ambiguities where they originate. As a side effect, you get to know the people who wrote the standard.

The tools, configurations and results for Treetrail are public in the [repository](https://github.com/treetrail/treetrail#testing). If you want to use these methods in a project of your own, feel free to get in touch.
