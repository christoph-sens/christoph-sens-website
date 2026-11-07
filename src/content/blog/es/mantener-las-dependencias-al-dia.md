---
title: 'Mantener las dependencias al día: por qué Renovate y Dependabot deben estar en todo código'
description: 'El software envejece aunque nadie lo toque. Por qué muchas actualizaciones pequeñas cuestan menos que pocas migraciones grandes, cómo Renovate y Dependabot alivian el día a día de los desarrolladores – y cuándo el proceso se puede automatizar por completo con una cobertura de pruebas suficiente.'
date: 2026-11-07
key: abhaengigkeiten-aktuell-halten
category: article
tags: [Dependabot, Renovate, Seguridad, CI/CD, Testing]
---

Casi ningún equipo de desarrollo decide a propósito operar software desactualizado. Y, sin embargo, ocurre. Un proyecto sale a producción, el equipo pasa a la siguiente funcionalidad y el `package.json`, el `pom.xml` o el `build.gradle.kts` se queda como estaba el día del lanzamiento. Dos años después toca actualizar un framework saltando tres versiones mayores. Nadie se atreve del todo, y una vulnerabilidad crítica en una biblioteca transitiva convierte una tarea de mantenimiento en una emergencia.

Veo este patrón una y otra vez en los proyectos. Casi nunca se debe a falta de competencia. Se debe a que el mantenimiento de dependencias se considera algo que se hace «cuando haya tiempo». Herramientas como Renovate y Dependabot cambian justo eso: una obligación molesta que se aplaza constantemente pasa a ser un proceso continuo y en gran parte automático.

## El software envejece aunque nadie lo toque

Para hablar de estar al día, primero hay que entender el ciclo de vida del software. Hoy, la mayor parte de una aplicación es código ajeno: frameworks, bibliotecas, entornos de ejecución, imágenes base de contenedores, plugins de compilación, acciones de CI. La parte escrita por el propio equipo suele ser la menor. Cada uno de estos componentes tiene su propio ciclo de vida. Se publica, se mantiene, se sustituye por versiones posteriores y en algún momento llega a su fin de vida (end of life), el punto a partir del cual ya no recibe actualizaciones de seguridad.

Entornos de ejecución como Java, Node.js o Python publican abiertamente sus periodos de soporte, igual que frameworks como Spring Boot o Angular. La consecuencia: incluso una aplicación funcionalmente terminada, en la que nadie cambia nada, se vuelve más arriesgada cada mes. El código propio sigue igual, pero los cimientos sobre los que se apoya van perdiendo su mantenimiento.

Para la dirección, esto supone un cambio de perspectiva importante. El software no es un bien de inversión que se adquiere una vez y luego se amortiza. Se parece más a un inmueble: sin mantenimiento continuo pierde valor, y las reparaciones pendientes no se abaratan con el tiempo, sino que se encarecen.

## Por qué «siempre al día» es la estrategia más barata

### Seguridad: lo que decide es el margen de tiempo

Dos casos se han convertido, con razón, en ejemplos de manual en el sector. En el incidente de Equifax de 2017 se explotó una vulnerabilidad del framework web Apache Struts para la que existía un parche desde hacía meses. Con Log4Shell, a finales de 2021, empresas de todo el mundo tuvieron que averiguar en pocos días en qué lugares se usaba una determinada biblioteca de logging, a menudo de forma transitiva y en lo más profundo del árbol de dependencias.

Ambos casos muestran el mismo patrón. Lo decisivo no es si aparece una vulnerabilidad, sino con qué rapidez un equipo puede desplegar la corrección. Un equipo cuyas dependencias ya están al día solo tiene que subir una versión de parche cuando surge una nueva vulnerabilidad. Un equipo que va tres versiones mayores por detrás primero tiene que ponerse al día antes de poder siquiera aplicar el parche, y además bajo presión de tiempo.

### Regulación: la buena práctica se convierte en obligación

Con la Ley de Ciberresiliencia de la UE (Cyber Resilience Act), la gestión de vulnerabilidades se está convirtiendo paso a paso en un requisito legal para los fabricantes de productos con elementos digitales. Las obligaciones de notificación se aplican desde septiembre de 2026 y las demás obligaciones desde diciembre de 2027. Quien tenga que demostrar que corrige con prontitud las vulnerabilidades conocidas necesita un proceso de actualización trazable y repetible. Un proceso automático que documenta cada paso en el control de versiones aporta esa prueba prácticamente de paso.

### Rentabilidad: los pasos pequeños son más baratos que los grandes saltos

En mi opinión, el argumento más importante es el económico. El esfuerzo de una actualización no crece de forma lineal con la distancia respecto a la versión actual, sino mucho más rápido. Una única actualización menor suele implicar pocos cambios, bien documentados y que se pueden comprobar de forma aislada. Diez actualizaciones acumuladas a la vez, en cambio, significan que los breaking changes de varias versiones se superponen, que las dependencias entre ellas imponen un orden concreto y que las guías de migración presuponen estados intermedios que se han saltado. Si después algo se rompe, apenas se puede saber qué cambio tuvo la culpa.

A esto se suman los costes indirectos. Quien se queda atascado en versiones antiguas no puede aprovechar las nuevas funcionalidades ni las mejoras de rendimiento de los frameworks, encuentra cada vez menos respuestas en la documentación y la comunidad para versiones obsoletas y lo tiene más difícil para contratar. Pocos desarrolladores se incorporan con gusto a un proyecto cuya tecnología tiene cinco años.

La cuenta, por tanto, es sencilla: muchas actualizaciones pequeñas y regulares cuestan menos en total que pocos grandes proyectos de migración. El único problema era que nadie quería encargarse de todas esas pequeñas actualizaciones. Justo ahí entran las herramientas.

## Qué hacen exactamente Renovate y Dependabot

Ambas herramientas siguen el mismo principio básico. Analizan el repositorio en busca de definiciones de dependencias, las comparan con los registros de paquetes y abren un pull request por cada actualización disponible. Este contiene el cambio de versión, las notas de la versión y extractos del changelog, y pasa por el pipeline de CI habitual. Así, el equipo no ve «hay una versión nueva en algún sitio», sino un cambio concreto y probado que solo hay que fusionar.

**Dependabot** está integrado directamente en GitHub. Además de las actualizaciones de versión normales, ofrece actualizaciones de seguridad alimentadas por la GitHub Advisory Database. Se configura mediante un `dependabot.yml`. Dependabot ya permite también agrupar actualizaciones y definir periodos de espera tras una publicación:

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

**Renovate** procede de Mend, es de código abierto y, además de en GitHub, funciona en GitLab, Bitbucket y Azure DevOps. Admite una gran cantidad de gestores de paquetes y formatos de archivo y se puede configurar con mucho más detalle: reglas por paquete o tipo de actualización, franjas horarias, un Dependency Dashboard como vista central de las actualizaciones abiertas y aplazadas, presets compartidos entre muchos repositorios y automerge integrado.

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

Mi valoración desde la práctica: para proyectos individuales en GitHub, Dependabot es un muy buen punto de partida sin infraestructura adicional. Quien quiera gestionar muchos repositorios de forma homogénea, trabaje fuera de GitHub o necesite reglas complejas acabará tarde o temprano en Renovate. En cualquier caso, más importante que la elección de la herramienta es usar una de forma consecuente.

## Cómo cambia el día a día de los desarrolladores

Sin automatización, el mantenimiento de dependencias es una tarea de investigación. Alguien tiene que comprobar con regularidad qué versiones existen, leer changelogs, ajustar números de versión, compilar y probar en local y escribir un pull request. Es un trabajo monótono, que no aporta avances funcionales y que, por eso, se aplaza de forma sistemática.

Con Renovate o Dependabot solo queda la decisión en sí: ¿esta actualización está bien? Y la decisión llega bien preparada, con las notas de la versión en el pull request y un resultado de CI en verde o en rojo. Una hora de investigación se convierte en un minuto de revisión.

A esto se suman algunos efectos menos evidentes:

- **Los fallos se pueden atribuir con claridad.** Si se rompe una compilación, está claro qué actualización tiene la culpa, porque cada pull request contiene exactamente un cambio (o un grupo de cambios agrupado a propósito).
- **El conocimiento se reparte en el equipo.** Los breaking changes se hacen visibles cuando aparecen, y no años después, agrupados en un proyecto de migración que tiene que sacar adelante una sola persona.
- **La planificación es más fiable.** En lugar de proyectos de actualización imprevisibles, surge un esfuerzo base pequeño y constante que cabe en cualquier planificación de sprint.
- **Bajan los costes de cambiar de contexto.** Con calendarios (por ejemplo, «actualizaciones los lunes a primera hora») y agrupación, las actualizaciones se tratan en bloque en lugar de ir llegando a lo largo de todo el día.

Un consejo fruto de la experiencia: quien activa las herramientas sin configurarlas recibe, en un proyecto con historia, docenas de pull requests el primer día. Eso frustra, y los bots se vuelven a desactivar enseguida. Es más sensato empezar con agrupación, un límite de pull requests abiertos a la vez y un calendario fijo, e ir reduciendo el atraso de forma deliberada.

## El siguiente paso: la automatización completa

Si cada pull request de actualización pasa de todos modos por todo el pipeline, la pregunta es evidente: ¿por qué tiene que seguir haciendo clic una persona en «Merge»? La respuesta depende de una sola pregunta: ¿cuánta confianza merece la propia suite de pruebas?

Ambas herramientas permiten la fusión automática. Renovate la trae integrada; con Dependabot se suele resolver mediante la función de auto-merge de GitHub combinada con un pequeño workflow. Técnicamente es trivial. El verdadero requisito es organizativo y de calidad: un auto-merge es exactamente tan seguro como los checks que deben superarse antes. Por eso, la protección de ramas y los status checks obligatorios son imprescindibles. Sin ellos, el bot puede llegar a fusionar una compilación en rojo.

Además, la cobertura de pruebas es más que un porcentaje. Una alta cobertura de líneas a base de pruebas unitarias que simulan todas las dependencias dice poco sobre si un nuevo driver de base de datos o una nueva versión del cliente HTTP funciona en conjunto. Para la automatización completa cuentan sobre todo:

- **pruebas de integración contra componentes reales**, por ejemplo con Testcontainers para bases de datos, brokers de mensajería o emuladores de la nube,
- **pruebas de contrato o de API**, que protegen el comportamiento visible desde fuera,
- **pruebas de serialización y configuración**, porque, según mi experiencia, es ahí donde las actualizaciones de frameworks cambian algo en silencio con más frecuencia,
- y, opcionalmente, **mutation testing**, para comprobar si las pruebas detectan realmente los fallos y no se limitan a ejecutar código.

Ha dado buen resultado un enfoque por etapas:

1. **Etapa 1:** las actualizaciones de parche y las de herramientas de desarrollo (linters, frameworks de pruebas, acciones de CI) se fusionan automáticamente. El riesgo es bajo y el alivio se nota de inmediato.
2. **Etapa 2:** se añaden las actualizaciones menores de bibliotecas estables (versión ≥ 1.0) en cuanto la suite de pruebas ha demostrado su valía.
3. **Etapa 3:** las actualizaciones mayores siguen siendo manuales. A menudo requieren adaptar el código de forma consciente, y está bien que así sea.

Hay un aspecto de la automatización que a menudo se pasa por alto: la cadena de suministro del software. En los últimos años se han dado repetidamente casos en los que atacantes publicaron versiones comprometidas de paquetes populares. Quien adopta automáticamente y de inmediato cada nueva versión puede, en el peor de los casos, introducir una de ellas en el código en cuestión de minutos. La contramedida es sencilla y eficaz: un periodo mínimo de espera tras la publicación (`minimumReleaseAge` en Renovate, `cooldown` en Dependabot). Las versiones comprometidas suelen descubrirse y retirarse rápidamente. Unos pocos días de retraso no cuestan casi nada, pero eliminan gran parte de este riesgo. En Dependabot, las actualizaciones de seguridad para vulnerabilidades conocidas quedan exentas automáticamente del periodo de espera; en Renovate se pueden controlar por separado mediante `vulnerabilityAlerts`.

Quien quiera ir más allá complementa la automatización con salvaguardas en operación: despliegues canary, una monitorización significativa y una vía de rollback rápida. Así, una actualización que causa un problema a pesar de que las pruebas estaban en verde no es un drama, sino un suceso normal y reversible.

## Recomendaciones

A los equipos y responsables que quieran abordar el tema les recomiendo estos pasos:

1. **Hacer inventario.** ¿Qué entornos de ejecución y frameworks se usan y cuándo termina el soporte de cada uno? Según mi experiencia, esta visión de conjunto por sí sola ya cambia las prioridades.
2. **Introducir una herramienta, y en todas partes.** Dependabot para entornos centrados en GitHub con una complejidad manejable, Renovate para plataformas heterogéneas o muchos repositorios con configuración centralizada. Las imágenes de Docker, las acciones de CI y el código de infraestructura también entran, no solo las bibliotecas de la aplicación.
3. **Configurar con sentido antes de activar.** Definir desde el principio la agrupación, un calendario, un límite de pull requests abiertos y un periodo mínimo de espera tras las publicaciones.
4. **Configurar la protección de ramas y los checks obligatorios.** Sin ellos, cualquier automatización es un riesgo.
5. **Invertir en las pruebas que realmente cuentan en las actualizaciones.** Las pruebas de integración y de contrato son la palanca que hace responsable la automatización completa.
6. **Ampliar el automerge por etapas.** Empezar con parches y herramientas de desarrollo, observar los resultados, generar confianza y después ampliar.
7. **Anclar el mantenimiento de dependencias como parte fija del trabajo.** No como un proyecto especial, sino como un esfuerzo base pequeño y planificable que la dirección asume de forma consciente.

Para quienes deciden, lo esencial cabe en una frase: las dependencias desactualizadas son deuda técnica con interés compuesto, y Renovate o Dependabot son la herramienta para amortizarla en cuotas pequeñas y planificables, en lugar de tener que saldarla de golpe algún día. Quien además invierte en una suite de pruebas sólida puede dejar este proceso en gran medida en manos de la máquina, y el equipo gana tiempo para aquello para lo que realmente está: aportar valor al negocio.
