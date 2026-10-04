---
title: 'El papel de los Signals'
description: 'Por qué Angular introdujo los Signals y en qué se diferencian de los Observables.'
date: 2024-04-19
updated: 2024-12-21
key: die-rolle-von-signals
category: article
tags: [Angular, Signals]
---

La introducción de los Signals ha generado inquietud en la comunidad de Angular. A muchos, la nueva funcionalidad les parece compleja, el motivo de su introducción no está claro y la diferencia con los Observables no resulta evidente. Este artículo explica concretamente por qué se introdujeron los Signals y analiza las diferencias con los Observables.

## ¿Por qué Signals en Angular? Una alternativa a la detección de cambios basada en Zone.js

La detección automática de cambios es un aspecto importante de Angular: se encarga de que la interfaz de usuario (UI) reaccione a los cambios en los datos. Hasta ahora, esto se hacía con la librería Zone.js. Zone.js actúa como puente entre los eventos y cambios del navegador y el framework Angular. Sin embargo, Zone.js tiene algunos inconvenientes:

- **Complejidad y esfuerzo de mantenimiento**
  - Zone.js es complejo y requiere un mantenimiento y una evolución cuidadosos.
  - Interviene profundamente en los objetos estándar de JavaScript, p. ej., HtmlInputElement y Document, lo que puede provocar problemas.
- **Tamaño del bundle**
  - Con más de 100 KB, el bundle de Zone.js es relativamente grande, sobre todo para aplicaciones pequeñas.
- **Detección de cambios lenta**
  - Zone.js informa a Angular de que algo ha cambiado, pero sin indicar qué.
  - Por eso hay que recorrer todo el árbol de componentes en busca de cambios.
  - Identificar directamente el componente afectado sería más eficiente.

## La introducción de los Signals

Los Signals se introdujeron como alternativa a Zone.js. Los Signals son un concepto reactivo en el que un contenedor (productor) guarda un valor. Cuando el valor cambia, se notifica el cambio a todos los interesados (consumidores). Zone.js deja de ser necesario, y el componente afectado puede identificarse y actualizarse directamente.

## ¿Por qué Signals en lugar de Observables?

Los Signals y los Observables son dos enfoques distintos. El punto fuerte de los Signals es sincronizar estados dentro del view model. Estos estados también pueden calcularse con Observables, pero la implementación es más compleja y menos eficiente.

## El futuro de los Observables en el framework Angular

En la capa de servicios, los Observables muestran toda su fuerza. Ofrecen funcionalidades adicionales que no pueden reproducirse directamente con Signals, por ejemplo la combinación (merge) de flujos de datos.

No obstante, el equipo de Angular planea que los Observables sean opcionales en futuras versiones del framework. El motivo es que muchos usuarios no necesitan el grado de complejidad que conllevan los Observables. Además, se pretende seguir reduciendo el tamaño de las aplicaciones.
