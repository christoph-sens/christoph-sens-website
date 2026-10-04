---
title: 'Die Rolle von Signals'
description: 'Warum Angular Signals eingeführt hat und wie sie sich von Observables unterscheiden.'
date: 2024-04-19
updated: 2024-12-21
translation: the-role-of-signals
category: article
tags: [Angular, Signals]
---

Die Einführung von Signals sorgt für Unruhe in der Angular-Community. Auf viele wirkt das neue Feature komplex, der Grund für die Einführung von Signals ist unklar und die Abgrenzung zu Observables nicht klar erkenntlich. Dieser Artikel geht speziell darauf ein, warum Signals eingeführt worden sind, und beleuchtet die Unterschiede zu Observables.

## Warum Signals in Angular? Eine Alternative zur Zone.js-basierten Change Detection

Die automatische Change Detection in Angular ist ein wichtiger Aspekt, der dafür sorgt, dass die Benutzeroberfläche (UI) auf Änderungen in den Daten reagiert. Bisher wurde dies durch die Bibliothek Zone.js realisiert. Zone.js fungiert als Brücke zwischen den Browser-Events/Änderungen und dem Angular-Framework. Allerdings hat Zone.js einige Nachteile:

- **Komplexität und Wartungsaufwand**
  - Zone.js ist komplex und erfordert eine sorgfältige Wartung und Weiterentwicklung.
  - Es greift tief in die Standard-JavaScript-Objekte ein, z. B. HtmlInputElement und Document, was zu potenziellen Problemen führen kann.
- **Größe des Bundles**
  - Mit mehr als 100 KB ist das Zone.js-Bundle relativ groß, insbesondere für kleinere Apps.
- **Langsame Change Detection**
  - Zone.js informiert Angular über Änderungen, ohne jedoch spezifische Details zu übermitteln.
  - Dadurch muss der gesamte Komponentenbaum durchlaufen werden, um nach Änderungen zu suchen.
  - Eine direkte Identifikation der betroffenen Komponente wäre performanter.

## Die Einführung von Signals

Als Alternative zu Zone.js wurden Signals eingeführt. Signals sind ein reaktives Konzept, bei dem ein Container (Producer) einen Wert enthält. Wenn sich der Wert ändert, werden alle Interessenten (Consumer) über diese Änderung benachrichtigt. Zone.js wird nicht mehr benötigt, und die betroffene Komponente kann direkt identifiziert und aktualisiert werden.

## Warum Signals statt Observables?

Signals und Observables sind zwei unterschiedliche Ansätze. Die Stärke von Signals liegt im Synchronisieren von Zuständen innerhalb des View Models. Diese Zustände können auch mithilfe von Observables berechnet werden, aber die Implementierung ist komplexer und weniger performant.

## Die Zukunft von Observables im Angular-Framework

Auf Service-Ebene spielen Observables ihre volle Stärke aus. Sie bieten zusätzliche Funktionalitäten, die mit Signals nicht direkt abgebildet werden können. Ein Beispiel dafür ist das Mergen von Datenströmen.

Nichtsdestotrotz plant das Angular-Team, Observables in zukünftigen Versionen des Frameworks optional zu gestalten. Der Hintergrund dafür ist, dass viele Anwender nicht den Grad an Komplexität benötigen, den Observables mit sich bringen. Zudem soll die Größe der Anwendungen weiter reduziert werden.
