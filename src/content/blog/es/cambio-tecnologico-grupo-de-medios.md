---
title: 'Un cambio tecnológico exitoso: cómo un grupo de medios transformó su desarrollo de apps'
description: 'Cómo un gran grupo de medios unificó el desarrollo de sus apps sobre una base tecnológica común con Flutter y lo llevó a su propia casa.'
date: 2024-04-19
updated: 2024-04-22
key: technologiewechsel-medienkonzern
category: success-story
tags: [Flutter, Desarrollo de apps, Migración, Estrategia de migración]
---

Un gran grupo de medios cuenta con una oferta de más de 10 apps móviles. Cada una de ellas se desarrolló con una tecnología diferente y por un proveedor externo distinto. Esto genera complejidad, y el conocimiento tecnológico queda fuera de la empresa. Por eso se decidió llevar el desarrollo de apps a la propia casa.

## Objetivo: crear una base tecnológica común

El objetivo no es trasladar todas las apps a una misma plataforma tecnológica al mismo tiempo. Por el esfuerzo que supondría, sencillamente no sería posible. Lo que sí se puede hacer es construir todos los nuevos desarrollos sobre la plataforma tecnológica. Esto incluye también los relanzamientos de apps existentes, p. ej., Super News App V2. Así, el funcionamiento de las apps más antiguas sigue en manos de los proveedores externos.

Para alcanzar este objetivo hay que llevar a cabo estas dos tareas:

- **Definir una base tecnológica común.** La tecnología debe elegirse con la perspectiva más a largo plazo posible.
- **Identificar lo que las apps tienen en común.** El objetivo es un núcleo tecnológico unificado. La funcionalidad compartida debe implementarse una sola vez.

## Elección de la tecnología: Flutter como la opción correcta

Elaboré una visión general del mercado de las tecnologías utilizadas para el desarrollo de apps a lo largo de varios años. Tres tecnologías destacaban especialmente: Flutter, React Native y Cordova.

Cordova quedó descartada de inmediato. Su cuota de mercado (<10 %) había caído con fuerza en los últimos años. Nunca es buena idea empezar un nuevo desarrollo con una tecnología que ya está desapareciendo.

El resto de la cuota de mercado, alrededor del 80 %, se repartía entre Flutter y React Native. Llamaba la atención, además, que la adopción de Flutter había crecido con fuerza en los últimos años, mientras que la cuota de React Native se había estancado en torno al 40 %.

Se desarrollaron prototipos con ambas tecnologías. Las dos son excelentes y existen numerosos ejemplos de apps conocidas creadas con cada una de ellas. Aun así, al final recomendé Flutter.

Con Flutter y Dart, simplemente me sentía más productivo. La configuración del proyecto tuvo menos complicaciones y la información que faltaba era más fácil de encontrar en su buena documentación. Precisamente eso es importante cuando se incorporan nuevos desarrolladores al proyecto.

## Identificar lo común: un núcleo tecnológico unificado

Toda la oferta de contenidos del grupo (p. ej., artículos de noticias) se gestiona en un sistema de gestión de contenidos (CMS). Desde él también se sirven los contenidos de las apps. De ello se deduce que cada app necesita acceso al CMS.

El acceso mediante REST se implementó una sola vez, en una librería. Así, cada app puede usar la librería y no tiene que implementar por sí misma la conexión con el CMS. La ventaja: ante cambios o correcciones de errores, solo hay que mantenerla en un lugar.

![Distintas apps se comunican con el mismo CMS.](../../../assets/blog/cms-apps.jpg)

## Balance: dos apps de éxito y mayor eficiencia

El proyecto resultó un éxito rotundo. El grupo de medios publicó con éxito dos nuevas apps en el App Store y en Play Store, con Flutter como plataforma tecnológica. La decisión de apostar por una base tecnológica común llevó el conocimiento necesario al propio departamento. Identificar lo que las apps tenían en común aumentó la eficiencia y la productividad en el desarrollo. El uso de una interfaz central redujo el esfuerzo de mantenimiento y desarrollo. En conjunto, el grupo de medios revolucionó su desarrollo de apps y ahora está mejor preparado para los retos futuros.
