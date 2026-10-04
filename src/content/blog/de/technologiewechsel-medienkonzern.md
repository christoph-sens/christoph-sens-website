---
title: 'Erfolgreicher Technologiewechsel: Wie ein Medienkonzern seine App-Entwicklung umstellte'
description: 'Wie ein großer Medienkonzern seine App-Entwicklung mit Flutter auf eine gemeinsame Technologiebasis stellte und ins Haus holte.'
date: 2024-04-19
updated: 2024-04-22
translation: media-group-technology-switch
category: success-story
tags: [Flutter, App-Entwicklung, Migration, Migrationsstrategie]
---

Ein großer Medienkonzern verfügt über ein mobiles App-Angebot von mehr als 10 Apps. Jede dieser Apps wurde mit einer anderen Technologie und von einem anderen externen Dienstleister umgesetzt. Das sorgt für Komplexität und das technologische Wissen liegt außer Haus. Deshalb wurde entschieden, die App-Entwicklung intern umzusetzen.

## Zielsetzung: Einheitliche Technologiebasis schaffen

Ziel ist es nicht, alle Apps gleichzeitig auf eine Technologieplattform zu heben. Das wäre aufgrund des Aufwandes schlichtweg nicht möglich. Was man jedoch tun kann ist, Neuentwicklungen der Technologieplattform unterzuordnen. Dazu zählen auch Relaunches von bestehenden Apps, z. B. Super News-App V2. Der Betrieb des älteren App-Bestandes wird somit auch weiterhin durch die externen Dienstleister durchgeführt.

Zum Erreichen dieser Zielstellung sind diese zwei Aufgaben durchzuführen:

- **Definition einer gemeinsamen Technologiebasis.** Die Technologie sollte mit einer möglichst langfristigen Perspektive gewählt werden.
- **Gemeinsamkeiten des App-Angebots identifizieren.** Ziel soll ein einheitlicher Technologiekern sein. Gemeinsam genutzte Funktionalität soll nur einmal umgesetzt werden.

## Technologieauswahl: Flutter als richtige Wahl

Ich verschaffte mir eine Marktübersicht der eingesetzten Technologien zur App-Entwicklung über einen Zeitraum von mehreren Jahren. Drei Technologien stachen besonders hervor: Flutter, React Native und Cordova.

Cordova schied als eingesetzte Technologie direkt aus. Der Marktanteil (<10 %) war innerhalb der letzten Jahre stark rückläufig. Es ist immer schlecht, eine Neuentwicklung mit bereits sterbenden Technologien zu starten.

Der übrige Marktanteil von ca. 80 % teilte sich zwischen Flutter und React Native auf. Zudem fiel auf, dass die Verbreitung von Flutter in den letzten Jahren stark zugenommen hatte. Der Marktanteil von React Native stagnierte über die Jahre bei ca. 40 %.

Es erfolgte die Anfertigung von Prototypen auf Basis von beiden Technologien. Beide Technologien sind großartig und es gibt zahlreiche Beispiele für prominente Apps unter Einsatz beider Technologien. Dennoch plädierte ich am Ende für Flutter.

Mit Flutter und Dart fühlte ich mich einfach produktiver. Das Aufsetzen des Projektes erfolgte mit weniger Komplikationen und fehlende Informationen ließen sich einfacher in der guten Dokumentation auffinden. Gerade das ist wichtig, wenn neue Entwickler zum Projekt hinzustoßen.

## Gemeinsamkeiten identifizieren: Einheitlicher Technologiekern

Das gesamte Inhaltsangebot (z. B. News-Artikel) des Konzerns wird durch ein Content Management System (CMS) verwaltet. Aus diesem werden auch die Inhalte für das App-Angebot ausgespielt. Daraus folgt, dass jede App Zugriff auf das CMS benötigt.

Der Zugriff via REST wurde einmal in einer Bibliothek bereitgestellt. Somit kann jede App die Bibliothek nutzen und muss die Anbindung ans CMS nicht selbst implementieren. Das hat den Vorteil, dass diese bei Änderungen oder Bugfixes nur einmal gewartet werden muss.

![Verschiedene Apps kommunizieren mit demselben CMS.](../../../assets/blog/cms-apps.jpg)

## Erfolgsbilanz: Zwei erfolgreiche Apps und gesteigerte Effizienz

Das Projekt erwies sich als voller Erfolg. Der Medienkonzern konnte zwei neue Apps erfolgreich im App- und Play Store veröffentlichen, wobei Flutter als Technologieplattform gewählt wurde. Die Entscheidung für eine einheitliche Technologiebasis holte das notwendige Wissen in den Fachbereich. Die Identifizierung von Gemeinsamkeiten im App-Angebot führte zu einer gesteigerten Effizienz und Produktivität in der Entwicklung. Durch die Nutzung einer zentralen Schnittstelle konnte der Wartungs- und Entwicklungsaufwand reduziert werden. Insgesamt hat der Medienkonzern seine App-Entwicklung revolutioniert und ist nun besser für zukünftige Herausforderungen gerüstet.
