---
title: 'Lo que la suite de pruebas no encuentra: cómo blindo una biblioteca JSONPath'
description: 'Superar los 715 casos de la suite oficial no basta. El fuzzing, las pruebas diferenciales, las pruebas de mutación y una lectura atenta de la especificación encontraron en Treetrail y Eclipse Parsson errores que ninguna suite muestra, y un error en la propia suite.'
date: 2026-11-02
key: was-die-testsuite-nicht-findet
category: article
tags: [Java, JSONPath, RFC 9535, Testing, Fuzzing, Open Source]
---

[Treetrail](https://github.com/treetrail/treetrail), mi biblioteca JSONPath para Java, supera los 715 casos de la [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) oficial de RFC 9535. En Java 17, 21 y 25, con cada modelo JSON soportado, en cada build. Suena a «terminado». No lo está.

Una suite de pruebas comprueba si una implementación da la respuesta correcta a preguntas conocidas. No comprueba qué pasa cuando alguien hace una pregunta en la que nadie pensó al escribirla. Y puede estar equivocada. Este artículo describe los métodos con los que blindo Treetrail más allá de la suite, y lo que han encontrado.

## Por qué importa

Cada vez más, las expresiones JSONPath no vienen del propio código. Los clientes configuran qué campos de un webhook les interesan. Los overlays para especificaciones OpenAPI usan JSONPath para elegir qué cambian. En esos casos, tanto la consulta como el documento son entradas de terceros. Entonces no basta con que la biblioteca calcule bien. Tampoco puede colgarse, fallar ni ocupar memoria sin límite ante entradas maliciosas o simplemente rotas.

Esto no es exclusivo de JSONPath. Cualquier parser, motor de reglas o sistema de plantillas en un backend tiene el mismo problema. Los métodos se pueden trasladar.

## Fuzzing: ¿qué pasa con entradas sin sentido?

Un fuzzer genera millones de entradas aleatorias, ligeramente modificadas, y observa si el programa falla o se cuelga. Para Treetrail uso [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer). Las reglas son sencillas: compilar, consultar, las expresiones regulares y el parseo de JSON solo pueden lanzar las excepciones documentadas y deben terminar cada entrada en cinco segundos como máximo. Cada build de CI hace fuzzing de cada objetivo durante 15 segundos; una ejecución nocturna, diez minutos.

El límite de cinco segundos es lo más importante. Un fallo se nota. Una consulta que mantiene ocupado el servidor durante horas se nota en producción.

El fuzzing encontró justo un caso así, no en Treetrail, sino en una variante de streaming para JSON-P en la que estoy trabajando. La consulta `$..[?@..*]..[-5]..a.a` sobre 999 arrays anidados (un documento de 2 KB, dentro de los límites por defecto) tardaba horas. El límite de nodos visitados no actuaba, porque parte del trabajo no se contaba como visita: el tiempo crecía con la quinta potencia de la profundidad, las visitas contadas solo con su cuadrado. Desde la corrección se cuenta todo el trabajo, y la misma entrada termina en pocos segundos con un mensaje de error claro.

Un límite solo protege si mide lo que de verdad cuesta tiempo.

### Un error conocido desde 2020

El mismo fuzzing sacó a la luz un segundo problema, esta vez en [Eclipse Parsson](https://github.com/eclipse-ee4j/parsson), la implementación de referencia de Jakarta JSON Processing. `skipObject()` y `skipArray()` entran en un bucle infinito con JSON truncado, como `{` o `[1,`, en lugar de informar de un error. Quien lee JSON de la red recibe datos truncados tarde o temprano.

El error está registrado desde 2020 como [issue #23](https://github.com/eclipse-ee4j/parsson/issues/23), y la versión actual 1.1.9 sigue afectada. Mi corrección está abierta como [pull request #174](https://github.com/eclipse-ee4j/parsson/pull/174). Es pequeña: el bucle comprueba si la entrada ha terminado.

El ejemplo muestra por qué el fuzzing compensa incluso cuando solo se usa una biblioteca consolidada. Las pruebas propias cubren las suposiciones propias. El fuzzer no tiene ninguna.

## Pruebas diferenciales: dos implementaciones, una respuesta

Si existe una segunda implementación independiente de lo mismo, se pueden alimentar ambas con las mismas entradas aleatorias y comparar. Cada diferencia es un error en uno de los dos lados. No hace falta un oráculo que conozca la respuesta correcta: basta con que dos equipos independientes rara vez cometan el mismo error.

Treetrail tiene dos comparaciones así:

- **Expresiones regulares:** 20 000 expresiones aleatorias contra `java.util.regex`, cada una con `match()` y `search()` sobre entradas aleatorias. Treetrail evalúa las expresiones regulares con un autómata propio, sin backtracking, para que los patrones de documentos de terceros no puedan provocar un tiempo de ejecución exponencial. Un autómata propio es una fuente de errores propia; la comparación lo mantiene honesto.
- **Consultas completas:** 2000 consultas aleatorias sobre documentos aleatorios contra una implementación independiente de RFC 9535 en Python. Aproximadamente una de cada siete consultas se daña a propósito, para comparar también el rechazo de consultas no válidas.

Para la variante JSON-P lo amplié: 14,4 millones de consultas generadas, comparando Treetrail con las implementaciones para Parsson y Apache Johnzon. Las tres no son independientes: las dos versiones JSON-P derivan de Treetrail. Aun así hubo una diferencia: una `ArithmeticException` en Johnzon con el número `1e1000000`, un número JSON válido en el que nadie había pensado.

## Pruebas de mutación: ¿quién prueba las pruebas?

Una cobertura alta solo dice que el código se ejecutó, no que un error se notaría. Las pruebas de mutación le dan la vuelta a la pregunta: la herramienta, aquí [PIT](https://pitest.org), introduce a propósito pequeños errores en el código compilado (un `<` se convierte en `<=`, una condición se invierte, un valor de retorno desaparece) y comprueba si las pruebas lo notan.

En el núcleo de Treetrail, PIT crea 1399 mutaciones de este tipo. Las pruebas detectan el 87 %; por debajo del 85 %, la ejecución nocturna falla. El 13 % restante no son todo huecos: algunas mutaciones no cambian el comportamiento. Pero cada mutación superviviente es una pregunta concreta: ¿notaría este error? A menudo la respuesta es no, y entonces falta una prueba.

## Leer la especificación, incluso frente a la suite

La pregunta más instructiva no necesitó ninguna herramienta. RFC 9535 remite para las expresiones regulares a I-Regexp, [RFC 9485](https://www.rfc-editor.org/rfc/rfc9485). Su gramática trata `^` y `$` como caracteres normales. La suite, sin embargo, esperaba en dos casos que actuaran como anclas, como en la mayoría de los dialectos de expresiones regulares. Quien seguía la gramática no superaba la suite. Quien seguía la suite se desviaba del RFC.

Treetrail siguió al principio la suite. Glyn Normington, coeditor de RFC 9535, señaló la contradicción en un [issue](https://github.com/treetrail/treetrail/issues/46), y Tim Bray, uno de los autores de RFC 9485, aclaró allí que I-Regexp no tiene anclas: las expresiones siempre están ancladas. Después lo [notifiqué a la suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/issues/122) y envié la corrección como [pull request #125](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/125). Treetrail seguirá el RFC en cuanto se acepte.

Una suite de pruebas es código, y el código tiene errores. Quien implementa un estándar debería leer el estándar, no solo las pruebas.

## Memoria: la pregunta que nadie hace

Un último punto, porque casi nunca aparece en las suites de pruebas: ¿cuánta memoria retiene una biblioteca? Al principio, Treetrail guardaba en caché los autómatas compilados de expresiones regulares para todo el proceso. Es rápido mientras los patrones vienen del propio código. Cuando vienen de documentos (`$[?match(@.v, @.p)]` lee el patrón del documento), cada documento puede traer patrones nuevos. 256 patrones construidos a propósito llegaron a ocupar 392 MB.

Hoy cada autómata tiene su propio presupuesto, todos juntos comparten unos 8 MiB, y los patrones de documentos no desplazan a los de otras consultas. [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md#limits) enumera todos los límites. La pregunta de fondo es sencilla y, aun así, rara vez se plantea: ¿qué pasa si un atacante escribe el documento?

## Lo que me llevo

Ninguno de estos métodos es nuevo ni costoso. Juntos suponen una fracción del tiempo que llevó escribir la biblioteca. En los proyectos que asesoro sigo el mismo orden:

1. **Fijar límites para las entradas de terceros** (tiempo, memoria, profundidad) y probarlos. El fuzzing con un límite de tiempo por entrada encuentra lo que las pruebas unitarias pasan por alto.
2. **Comparar con una segunda implementación** cuando la hay. Para parsers, formatos y protocolos casi siempre existe.
3. **Medir las pruebas, no solo la cobertura.** Las pruebas de mutación muestran qué errores pasarían desapercibidos.
4. **Leer la especificación** y aclarar las ambigüedades donde se originan. De paso, se conoce a quienes escribieron el estándar.

Las herramientas, configuraciones y resultados de Treetrail son públicos en el [repositorio](https://github.com/treetrail/treetrail#testing). Si quiere aplicar estos métodos en un proyecto propio, escríbame.
