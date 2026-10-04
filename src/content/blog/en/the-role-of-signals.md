---
title: 'The role of Signals'
description: 'Why Angular introduced Signals and how they differ from Observables.'
date: 2024-04-19
updated: 2024-12-21
translation: die-rolle-von-signals
category: article
tags: [Angular, Signals]
---

The introduction of Signals has caused some unrest in the Angular community. To many, the new feature seems complex, the reason for introducing Signals is unclear, and how they differ from Observables is not obvious. This article looks specifically at why Signals were introduced and highlights the differences from Observables.

## Why Signals in Angular? An alternative to Zone.js-based change detection

Automatic change detection is an important part of Angular: it makes sure the user interface (UI) reacts to changes in the data. Until now, this was handled by the Zone.js library. Zone.js acts as a bridge between browser events/changes and the Angular framework. However, Zone.js has a few drawbacks:

- **Complexity and maintenance effort**
  - Zone.js is complex and needs careful maintenance and further development.
  - It hooks deeply into standard JavaScript objects such as HtmlInputElement and Document, which can lead to problems.
- **Bundle size**
  - At more than 100 KB, the Zone.js bundle is relatively large, especially for smaller apps.
- **Slow change detection**
  - Zone.js tells Angular that something changed, but not what.
  - As a result, the entire component tree has to be traversed to look for changes.
  - Identifying the affected component directly would perform better.

## The introduction of Signals

Signals were introduced as an alternative to Zone.js. Signals are a reactive concept in which a container (producer) holds a value. When the value changes, everyone interested (consumers) is notified of the change. Zone.js is no longer needed, and the affected component can be identified and updated directly.

## Why Signals instead of Observables?

Signals and Observables are two different approaches. The strength of Signals lies in synchronizing state within the view model. This state can also be computed with Observables, but the implementation is more complex and performs worse.

## The future of Observables in the Angular framework

At the service level, Observables play to their full strength. They offer additional capabilities that Signals cannot provide directly, for example merging data streams.

Nevertheless, the Angular team plans to make Observables optional in future versions of the framework. The reasoning is that many users don’t need the level of complexity Observables bring. In addition, application size is to be reduced further.
