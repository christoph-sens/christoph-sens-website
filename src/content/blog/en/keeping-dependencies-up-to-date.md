---
title: 'Keeping dependencies up to date: why Renovate and Dependabot belong in every codebase'
description: 'Software ages even when nobody touches it. Why many small updates cost less than rare big migrations, how Renovate and Dependabot take load off developers – and when the process can be fully automated, given good enough test coverage.'
date: 2026-11-07
key: abhaengigkeiten-aktuell-halten
category: article
tags: [Dependabot, Renovate, Security, CI/CD, Testing]
---

Hardly any development team decides to run outdated software on purpose. It happens anyway. A project goes live, the team moves on to the next feature, and the `package.json`, `pom.xml` or `build.gradle.kts` stays where it was on release day. Two years later a framework upgrade across three major versions is due. Nobody really wants to touch it, and then a critical vulnerability in a transitive library turns a maintenance task into an emergency.

I see this pattern in projects again and again. It is almost never a lack of skill. It happens because dependency maintenance counts as something you do "when there is time". Tools like Renovate and Dependabot change exactly that: a chore that keeps getting postponed becomes a continuous and largely automatic process.

## Software ages even when nobody touches it

To talk about staying current, you first have to understand the software lifecycle. Most of a modern application is other people's code: frameworks, libraries, runtimes, container base images, build plugins, CI actions. The part a team writes itself is often the smaller one. Each of these components has its own lifecycle. It is released, maintained, replaced by newer versions and at some point reaches its end of life, the moment it stops getting security updates.

Runtimes like Java, Node.js or Python publish their support periods openly, and so do frameworks like Spring Boot or Angular. The consequence: even an application that is functionally finished, where nobody changes anything, gets riskier every month. The team's own code stays the same, but the foundation underneath gradually loses its maintenance.

For management this is an important change of perspective. Software is not a capital good you buy once and then depreciate. It is more like a building: without ongoing upkeep it loses value, and the repair backlog does not get cheaper over time, it gets more expensive.

## Why "always current" is the cheapest strategy

### Security: the time window decides

Two cases have rightly become textbook examples in the industry. In the Equifax incident in 2017, attackers exploited a vulnerability in the Apache Struts web framework for which a patch had been available for months. With Log4Shell at the end of 2021, companies worldwide had a few days to find out everywhere a particular logging library was used, often transitively and deep in the dependency tree.

Both cases show the same pattern. What matters is not whether a vulnerability shows up, but how fast a team can ship the fix. A team whose dependencies are current anyway only has to bump a patch version when a new vulnerability appears. A team three major versions behind has to catch up first before it can patch at all, and it has to do that under time pressure.

### Regulation: good practice becomes an obligation

With the EU Cyber Resilience Act, vulnerability management is gradually becoming a legal requirement for manufacturers of products with digital elements. The reporting obligations apply from September 2026, the remaining obligations from December 2027. Anyone who has to prove that known vulnerabilities are fixed promptly needs a traceable and repeatable update process. An automated process that records every step in version control delivers that proof almost as a side effect.

### Economics: small steps are cheaper than big jumps

In my view the economic argument is the most important one. The effort of an update does not grow linearly with the distance to the current version, it grows much faster. A single minor update usually involves a few changes that are well documented and can be checked in isolation. Ten pent-up updates at once are a different story: breaking changes from several versions overlap, dependencies between them force a certain order, and migration guides assume intermediate states that were skipped. If something breaks afterwards, it is hard to say which change caused it.

Then there are the indirect costs. Teams stuck on old versions cannot use new features and performance improvements of their frameworks, find fewer and fewer answers in documentation and community for outdated versions, and have a harder time hiring. Few developers are keen to join a project whose technology is five years old.

So the math is simple: many small, regular updates cost less in total than rare big migration projects. The only problem was that nobody wanted to deal with all those small updates. This is exactly where the tools come in.

## What Renovate and Dependabot actually do

Both tools follow the same basic principle. They scan the repository for dependency definitions, compare them with the package registries and open a pull request for every available update. The pull request contains the version change, release notes and changelog excerpts, and it runs through the normal CI pipeline. So the team does not see "there is a new version somewhere", but a concrete, tested change that only needs to be merged.

**Dependabot** is built into GitHub. Besides regular version updates, it delivers security updates fed by the GitHub Advisory Database. It is configured with a `dependabot.yml`. Dependabot now also supports grouping updates and waiting periods after a release:

```yaml
version: 2
updates:
  - package-ecosystem: "gradle"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 3
    groups:
      minor-and-patch:
        update-types: ["minor", "patch"]
```

**Renovate** comes from Mend, is open source and runs on GitLab, Bitbucket and Azure DevOps as well as GitHub. It supports a very wide range of package managers and file formats and can be configured in much more detail: rules per package or update type, time windows, a Dependency Dashboard as a central overview of open and deferred updates, shared presets across many repositories, and built-in automerge.

```json
{
  "extends": ["config:recommended"],
  "minimumReleaseAge": "3 days",
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "matchCurrentVersion": "!/^0\\./",
      "automerge": true
    }
  ]
}
```

My take from practice: for individual projects on GitHub, Dependabot is a very good start without any extra infrastructure. Anyone who wants to manage many repositories consistently, works outside GitHub or needs complex rules will end up with Renovate sooner or later. What matters more than the choice of tool is that one is used consistently at all.

## How the day-to-day work of developers changes

Without automation, dependency maintenance is research work. Someone has to check regularly which versions exist, read changelogs, change version numbers, build and test locally and write a pull request. This work is monotonous, brings no functional progress and is therefore reliably postponed.

With Renovate or Dependabot, only the actual decision is left: is this update fine? And the decision arrives well prepared, with release notes in the pull request and a green or red CI result. An hour of research becomes a minute of review.

There are also some less obvious effects:

- **Failures are easy to attribute.** When a build breaks, it is clear which update caused it, because every pull request contains exactly one change (or a deliberately grouped set).
- **Knowledge spreads across the team.** Breaking changes become visible when they happen, not years later, bundled into a migration project that one person has to carry.
- **Planning becomes more reliable.** Instead of unpredictable upgrade projects, there is a steady, small base effort that fits into every sprint plan.
- **Context switching costs go down.** With schedules (for example "updates early on Monday") and grouping, updates are handled in batches instead of trickling in all day.

One piece of advice from experience: if you switch the tools on without configuration, a grown project gets dozens of pull requests on the first day. That is frustrating, and the bots get switched off again quickly. It is better to start with grouping, a limit for concurrently open pull requests and a fixed schedule, and to work through the backlog deliberately.

## The next step: full automation

If every update pull request runs through the full pipeline anyway, the obvious question is: why does a human still have to click "Merge"? The answer depends on a single question: how much trust does your test suite deserve?

Both tools support automatic merging. Renovate has it built in; with Dependabot it is usually done with GitHub's auto-merge feature combined with a small workflow. Technically this is trivial. The real prerequisite is organizational and about quality: an automerge is exactly as safe as the checks that have to pass first. That is why branch protection and required status checks are mandatory. Without them, the bot may well merge a red build.

And test coverage is more than a percentage. High line coverage from unit tests that mock away every dependency says little about whether a new database driver or a new HTTP client version works in combination. For full automation, these matter most:

- **Integration tests against real components**, for example with Testcontainers for databases, message brokers or cloud emulators,
- **Contract or API tests** that protect the externally visible behavior,
- **Tests for serialization and configuration**, because in my experience that is where framework updates most often change something silently,
- optionally **mutation testing**, to check whether the tests actually detect faults rather than just executing code.

A staged approach has proven itself:

1. **Stage 1:** Patch updates and updates of development tools (linters, test frameworks, CI actions) are merged automatically. The risk is low, and the relief is noticeable right away.
2. **Stage 2:** Minor updates of stable libraries (version ≥ 1.0) are added once the test suite has proven itself.
3. **Stage 3:** Major updates stay manual. They often require deliberate code changes, and that is a good thing.

One aspect of automation is often overlooked: the software supply chain. In recent years there have been repeated cases of attackers publishing compromised versions of popular packages. Whoever takes every new version automatically and immediately may, in the worst case, pull such a version into the codebase within minutes. The countermeasure is simple and effective: a minimum waiting period after a release (`minimumReleaseAge` in Renovate, `cooldown` in Dependabot). Compromised releases are usually discovered and pulled quickly. A few days of delay cost almost nothing but rule out a large part of this risk. In Dependabot, security updates for known vulnerabilities are automatically exempt from the waiting period; in Renovate they can be controlled separately via `vulnerabilityAlerts`.

Those who want to go further add safeguards in operations: canary deployments, meaningful monitoring and a fast rollback path. Then an update that causes a problem despite green tests is no drama, just a normal, reversible event.

## Recommendations

For teams and decision-makers who want to tackle the topic, I recommend these steps:

1. **Take stock.** Which runtimes and frameworks are in use, and when does support end for each of them? In my experience, this overview alone changes priorities.
2. **Introduce one tool, everywhere.** Dependabot for GitHub-centric environments of manageable complexity, Renovate for heterogeneous platforms or many repositories with central configuration. Docker images, CI actions and infrastructure code belong in scope too, not just application libraries.
3. **Configure sensibly before switching on.** Set grouping, a schedule, a limit for open pull requests and a minimum waiting period after releases from the start.
4. **Set up branch protection and required checks.** Without them, any automation is a risk.
5. **Invest in the tests that really matter for updates.** Integration and contract tests are the lever that makes full automation responsible in the first place.
6. **Extend automerge step by step.** Start with patches and dev tools, watch the results, build trust and then expand.
7. **Make dependency maintenance a fixed part of the work.** Not as a special project, but as a small, plannable base effort that management carries deliberately.

For decision-makers, the core fits in one sentence: outdated dependencies are technical debt with compound interest, and Renovate or Dependabot are the tool for paying it off in small, plannable installments instead of having to settle it all at once. Teams that also invest in a solid test suite can leave this process largely to the machine, and gain time for what they are actually there for: delivering business value.
