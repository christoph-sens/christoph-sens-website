---
title: 'Treetrail: por qué escribí una biblioteca JSONPath para Java'
description: 'Treetrail lleva a Java el estándar JSONPath RFC 9535: los mismos resultados que en otros lenguajes, seguridad ante consultas de terceros, adaptadores para Jackson, Gson y JSON-P, y un camino ordenado para dejar atrás Jayway JsonPath.'
date: 2026-10-09
key: treetrail-jsonpath-fuer-java
category: article
tags: [Java, JSONPath, RFC 9535, Open Source, Spring]
---

Quien trabaja con JSON en Java usa JSONPath, a menudo sin darse cuenta. En los tests de Spring se esconde detrás de `jsonPath("$.items[0].name")`, en API gateways y plataformas de integración selecciona campos de webhooks, y en archivos de configuración describe qué valor va adónde. Sorprende que, desde el artículo de Stefan Goessner de 2007, JSONPath pasara unos 17 años sin especificación. Cada biblioteca decidía por su cuenta qué debían devolver `$..book[-1:]` o `$[?(@.price < 10)]`.

Eso cambió en febrero de 2024: el IETF publicó [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535), un estándar para JSONPath, acompañado de una [Compliance Test Suite](https://github.com/jsonpath-standard/jsonpath-compliance-test-suite) con 706 casos de prueba. Pronto surgieron implementaciones conformes para Python, Rust y .NET. Para Java, probablemente la plataforma en la que más expresiones JSONPath se ejecutan, faltaba una respuesta madura.

[Treetrail](https://github.com/treetrail/treetrail) es mi intento de cerrar ese hueco. Este artículo cuenta por qué existe la biblioteca, qué puede hacer hoy y cómo se compara con las alternativas.

## La motivación

### Una consulta, varias respuestas

Todo empezó con una observación sencilla: la misma consulta JSONPath devuelve resultados distintos según la biblioteca. Sobre el array `[0, 1, …, 9]`, por ejemplo:

| Consulta | RFC 9535 | Jayway JsonPath 3.0.0 |
| --- | --- | --- |
| `$[1:6:2]` | `[1, 3, 5]` | `[1, 2, 3, 4, 5]` |
| `$[9:0:-1]` | `[9, 8, 7, 6, 5, 4, 3, 2, 1]` | `[]` |

Mientras una expresión vive en un único servicio Java, apenas se nota. Pero en cuanto la misma consulta se evalúa en el backend, en un script de Python para análisis de datos y en un frontend de TypeScript, la cosa se complica: tres componentes, tres interpretaciones, y el error solo aparece en producción. Para eso existen los estándares. Pero un estándar solo sirve si cada plataforma tiene una implementación que realmente lo cumple.

### Jayway JsonPath: un gran servicio, pero anterior al estándar

La biblioteca JSONPath más extendida en Java, con diferencia, es [Jayway JsonPath](https://github.com/json-path/JsonPath). Ha prestado un servicio excelente al ecosistema Java desde 2011, y Spring la utiliza para sus matchers `jsonPath(...)`. Pero nació mucho antes de que existiera un estándar y, por tanto, sin culpa alguna, no lo cumple. Medida contra la Compliance Test Suite, Jayway 3.0.0 devuelve el mismo resultado que el estándar en 86 de las 459 consultas válidas; si se ponen paréntesis en los filtros, como exige Jayway, son 176. A la inversa, Jayway acepta 132 de las 247 consultas que el estándar considera inválidas.

Una biblioteca tan utilizada no puede cambiar su comportamiento sin romper miles de proyectos. Por eso hace falta una biblioteca independiente y conforme al estándar, y una forma de migrar a ella sin riesgo.

### Consultas de terceros

El tercer motivo es la seguridad. Cada vez más, las expresiones JSONPath no provienen del propio código, sino de clientes, usuarios o configuraciones de terceros. En ese caso, una consulta no debe poder dejar fuera de servicio la aplicación. Las expresiones regulares con backtracking son el punto débil más conocido: el patrón `((a+)+)+b` contra 24 `a` y un `!` mantiene ocupado a `java.util.regex` unos 0,4 segundos en JDK 25, y cada `a` adicional duplica el tiempo.

### Y un motivo personal

Llevo más de 15 años construyendo backends con Java y Kotlin. Para mí, el código abierto es la forma más honesta de mostrar cómo trabajo: cada decisión, cada test y cada error son públicos. Treetrail está escrito en Java a propósito, no en Kotlin: depender de la biblioteca estándar de Kotlin dificultaría sin necesidad su adopción en proyectos como Spring, Apache Camel o Apache NiFi.

## Qué puede hacer Treetrail hoy

La versión 0.2.0 está en Maven Central desde el 8 de octubre de 2026. Sus características principales:

### Conforme al estándar, y comprobado en cada build

Treetrail supera los 706 casos de la Compliance Test Suite, en Java 17, 21 y 25 y con cada modelo JSON soportado. Si falla un solo caso, falla el build. Donde el estándar deja margen o la suite de pruebas se aparta del texto del RFC, la decisión está documentada en [docs/conformance.md](https://github.com/treetrail/treetrail/blob/main/docs/conformance.md).

### Un solo tipo de resultado

Cada consulta devuelve una lista de nodos, tanto si selecciona un valor como muchos. Cada nodo conoce su ruta normalizada. No hay ninguna opción de configuración que cambie lo que devuelve una consulta.

```java
JsonPath path = JsonPath.compile("$.store.book[?@.price < 10].title");

NodeList<Object> nodes = path.query(document);
nodes.values(); // ["Sayings of the Century", "Moby Dick"]
nodes.paths();  // ["$['store']['book'][0]['title']", "$['store']['book'][2]['title']"]
```

### El árbol JSON que ya tiene

El núcleo no tiene más dependencias que el JDK. Trabaja con maps y listas de Java o analiza el texto JSON por sí mismo con un parser pequeño y estricto. Los adaptadores consultan directamente los árboles de Jackson 2 y 3, Gson y Jakarta JSON-P, sin conversión, y devuelven los nodos de esa biblioteca, para que pueda seguir trabajando con ellos. Otros modelos se conectan a través de una interfaz pequeña.

```java
JsonNode document = objectMapper.readTree(json);
NodeList<JsonNode> books = JsonPath.compile("$.store.book[?@.price < 10]")
        .query(document, Jackson2Model.INSTANCE);
```

### Seguro ante consultas de terceros

Las expresiones regulares en `match()` y `search()` siguen [I-Regexp (RFC 9485)](https://www.rfc-editor.org/rfc/rfc9485) y se ejecutan en un motor de autómatas propio sin backtracking, en tiempo lineal. El patrón anterior, que a `java.util.regex` le cuesta 0,4 segundos, Treetrail lo resuelve en menos de una décima de microsegundo. Además, cada ejecución tiene límites: un presupuesto de nodos visitados, una profundidad máxima y un tope para el tamaño del resultado. Aunque un documento traiga miles de expresiones regulares distintas, las cachés ocupan como máximo unos 10 MB.

```java
JsonPath path = JsonPath.compile(untrustedExpression)
        .withLimits(EvaluationLimits.DEFAULT.withMaxVisitedNodes(1_000_000).withMaxResultSize(10_000));
```

### Rápido

Cumplir el estándar no cuesta velocidad. En los benchmarks con JMH, Treetrail está al menos a la par de Jayway JsonPath en cada consulta; sobre árboles de Jackson, el caso más habitual en la práctica, es entre 1,2 y 2,2 veces más rápido, y 1,7 veces más rápido al compilar una expresión. Las mediciones y sus limitaciones están en [docs/benchmarks.md](https://github.com/treetrail/treetrail/blob/main/docs/benchmarks.md).

### Pensado para los tests

La mayor parte del código JSONPath en proyectos Java está en los tests. Dos módulos llevan el estándar hasta allí: aserciones para AssertJ y un sustituto de los matchers `jsonPath(...)` de Spring para MockMvc y WebTestClient.

```java
mockMvc.perform(get("/store"))
        .andExpect(jsonPath("$.store.book[?@.price < 10].title").values("Sayings of the Century", "Moby Dick"));
```

Los valores se comparan como valores JSON: `399`, `399L` y `399.0` coinciden con el número JSON `399`. Si una aserción falla, indica la expresión y muestra los valores encontrados con sus rutas.

### Un camino ordenado para dejar Jayway

A nadie le gusta migrar a ciegas. Por eso Treetrail incluye dos herramientas:

- **`jsonpath-migration`** ejecuta sus expresiones con Jayway JsonPath y con Treetrail sobre documentos de ejemplo e informa de cada diferencia, con una sugerencia de reescritura para la sintaxis propia de Jayway. Utiliza la versión de Jayway de la que ya depende su proyecto y tiene en cuenta su configuración de Jayway.
- **`jsonpath-rewrite`** contiene una receta de [OpenRewrite](https://docs.openrewrite.org) que encuentra en un código fuente cada expresión JSONPath que se pasa a Jayway o a los matchers de Spring, y la evalúa: válida según RFC 9535, solo válida en Jayway, API de escritura o calculada en tiempo de ejecución.

Además, el README incluye una [tabla de modismos de Jayway y sus equivalentes](https://github.com/treetrail/treetrail#jayway-idioms-and-their-equivalents).

## Treetrail frente a las alternativas

### Frente a Jayway JsonPath

| | Treetrail | Jayway JsonPath |
| --- | --- | --- |
| Estándar | RFC 9535, los 706 casos de la CTS | dialecto propio, anterior al estándar |
| Resultado de `$.a.b` | siempre una lista de nodos con rutas | un valor o una lista, según la ruta y la configuración |
| Filtros | `[?@.price < 10]` (paréntesis opcionales) | `[?(@.price < 10)]` |
| Expresiones regulares | I-Regexp, tiempo lineal | `java.util.regex` con backtracking |
| Límites para consultas de terceros | presupuesto de nodos, profundidad, tamaño del resultado, memoria de regex | – |
| Bibliotecas JSON | objetos Java, Jackson 2/3, Gson, JSON-P | json-smart, Jackson, Gson y otras mediante providers |
| Matchers para tests de Spring | módulo propio | integrados en Spring |
| API de escritura (`set`, `delete`) | no, solo consultas | sí |
| Mapeo de tipos (`read(…, Integer.class)`) | no, mediante su propia biblioteca JSON | sí |
| Funciones de agregación (`sum()`, `avg()`, …) | no; funciones estándar `length()`, `count()`, `match()`, `search()`, `value()` | sí |

La tabla también muestra dónde Jayway ofrece más: la API de escritura, el mapeo de tipos y las funciones de agregación son cómodos y, a propósito, no forman parte del estándar. Si los usa mucho, el README muestra cómo resolver lo mismo con Treetrail y su propia biblioteca JSON, o puede mantener Jayway en esos puntos. Ambas bibliotecas pueden convivir sin problemas.

### Frente a otras implementaciones de RFC 9535 en Java

Treetrail no es la única biblioteca Java que implementa el estándar, y eso es bueno. El [JSONPath Comparison](https://github.com/cburgmer/json-path-comparison) de Christoph Burgmer compara desde hace años decenas de implementaciones en todos los lenguajes. He enviado allí un [pull request](https://github.com/cburgmer/json-path-comparison/pull/170) para Treetrail; en una ejecución local sobre 258 consultas, el panorama para Java es este (coincidencia con el consenso entre lenguajes en 175 consultas):

| Implementación | Consenso alcanzado |
| --- | --- |
| Treetrail | 173 |
| ajp (basada en XSLT/ixml) | 173 |
| SJF4J | 173 |
| Jayway JsonPath 3.0.0 | 143 |
| JSurfer | 133 |

Las dos consultas restantes son formas abreviadas que no son válidas según RFC 9535: ahí el estándar se aparta a propósito del antiguo consenso. Me parece notable que Treetrail y ajp, dos implementaciones surgidas de forma totalmente independiente, respondan de forma idéntica a las 258 consultas. Eso es justo lo que debe lograr un estándar.

Por eso las diferencias están menos en la conformidad que en todo lo demás:

- **SJF4J** es más permisiva y acepta bastantes más expresiones que el estándar rechaza: práctico al migrar, pero menos estricto si las consultas deben seguir siendo portables.
- **[jsonlens](https://github.com/MarcusDunn/jsonlens)** combina JSONPath con JSON Pointer (RFC 6901) y JSON Patch (RFC 6902), funciones que Treetrail no tiene.
- **Treetrail** se centra en la seguridad operativa ante consultas de terceros, adaptadores directos para las bibliotecas JSON más comunes, integración con AssertJ y Spring para los tests y herramientas de migración para el código Jayway existente.

## Cómo se prueba Treetrail

La Compliance Test Suite comprueba la gramática y la semántica, pero no lo que ocurre con entradas en las que nadie pensó. Por eso se añaden:

- **Fuzzing** con [Jazzer](https://github.com/CodeIntelligenceTesting/jazzer) en cada build de CI y cada noche: compilar, consultar, evaluar expresiones regulares y analizar JSON solo pueden lanzar las excepciones documentadas y deben terminar cada entrada en cinco segundos. Antes de la 0.2.0, el fuzzer encontró de hecho un error: una expresión regular que repetía un grupo vacío más de mil millones de veces tardaba 46 segundos en compilarse.
- **Tests de propiedades** con [jqwik](https://jqwik.net), por ejemplo que cada ruta normalizada seleccione exactamente su nodo.
- **Tests diferenciales:** 20 000 expresiones regulares aleatorias contra `java.util.regex` y 2000 consultas aleatorias contra [jsonpath-rfc9535](https://github.com/jg-rp/python-jsonpath-rfc9535), una cuidadosa implementación del estándar en Python.
- **Concurrencia:** 16 hilos comparten consultas compiladas mientras se construyen los autómatas de regex.

La cadena de suministro también forma parte de la calidad: cada release está firmada e incluye por módulo un SBOM CycloneDX y una atestación de procedencia del build, y los jars son reproducibles. Desde hace poco, el build también comprueba la compatibilidad de la API con la última release, la cobertura de tests por módulo y el propio código con Error Prone y NullAway; la próxima release incorpora anotaciones [JSpecify](https://jspecify.dev), para que también Kotlin sepa qué valores pueden ser `null`.

## Próximos pasos

El camino hacia la 1.0 se planifica [públicamente en GitHub](https://github.com/treetrail/treetrail/milestones): una API estable con garantía de compatibilidad, más análisis estático y tests de mutación. Antes de la 1.0, la API aún puede cambiar, por lo que ahora es el mejor momento para dar su opinión.

Probarlo cuesta una línea:

```kotlin
dependencies {
    implementation("io.github.treetrail:jsonpath-core:0.2.0")
}
```

Treetrail funciona con Java 17 o superior y se distribuye bajo la Apache License 2.0. Si le falta algo o no encaja en su caso de uso, [abra un issue](https://github.com/treetrail/treetrail/issues). Y si su equipo se pregunta cómo llevar de forma segura al estándar las expresiones JSONPath de un código fuente ya crecido: [póngase en contacto conmigo](mailto:contact@christoph-sens.com).
