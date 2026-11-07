---
title: 'Arquitectura hexagonal en la práctica: separar con limpieza el negocio y la técnica'
description: 'Mientras sustituyo paso a paso un monolito en el sector energético, construyo cada nueva aplicación de forma hexagonal: model, application, adapter y bootstrap como módulos de Gradle propios, asegurados con ArchUnit. Qué aporta a quienes deciden, a arquitectos y a desarrolladores – y dónde duele.'
date: 2026-11-07
key: hexagonale-architektur-in-der-praxis
category: article
tags: [Kotlin, Spring Boot, Arquitectura, Arquitectura hexagonal, ArchUnit]
---

Una lectura de contador no llega al participante del mercado. ¿Está el error en la lógica de negocio, en la regla que decide qué lectura va a quién? ¿O en la técnica: en la cola, en el mapeo, en la consulta a la base de datos, en un timeout? En un monolito que ha crecido durante años, ambas cosas suelen estar en el mismo método. Quien busca el error lee las dos a la vez – y no entiende bien ninguna.

Precisamente por eso construyo los backends de forma hexagonal. Actualmente sustituyo paso a paso, en una empresa energética, un monolito PHP para la comunicación de mercado ([ver el caso de éxito](/es/casos-de-exito/sustitucion-de-un-monolito/)). Cada nueva aplicación sigue la misma estructura, y el departamento la utiliza ya como plantilla para otras aplicaciones. Este artículo muestra cómo es esa estructura, qué aporta y dónde da trabajo – para quienes deciden, para arquitectos y para desarrolladores.

## La idea central en una frase

La arquitectura hexagonal, también llamada «ports and adapters», separa la lógica de negocio de una aplicación de todo lo técnico. El negocio define qué necesita del exterior y qué ofrece – los puertos. La técnica aporta las implementaciones – los adaptadores. El negocio no sabe nada de Spring, de AWS ni de la base de datos.

El principio no es nuevo. Lo nuevo es lo mucho que compensa hoy: los frameworks dan grandes saltos de versión en intervalos cortos, los sistemas funcionan en la nube con colas, topics y almacenamiento de objetos, y las aplicaciones deben seguir siendo mantenibles durante años aunque la técnica que tienen debajo cambie varias veces.

## Cómo lo estructuro: cuatro módulos de Gradle

Divido cada aplicación en cuatro módulos de Gradle:

- **Model**: los conceptos y las reglas del negocio. Kotlin puro, sin dependencias.
- **Application**: los casos de uso y los puertos, es decir, las interfaces hacia el exterior. Solo depende del model.
- **Adapter**: todo lo técnico. Aquí, y solo aquí, aparece Spring.
- **Bootstrap**: arranca la aplicación y lo conecta todo.

En la aplicación de comunicación de mercado se ve así: los adaptadores de entrada reciben mensajes de SQS, ofrecen interfaces REST y lanzan procesos programados mediante un scheduler. Los adaptadores de salida escriben en SNS, SQS, S3 y Postgres y se comunican con participantes externos del mercado. Para el negocio, todo esto es invisible. Solo sabe que hay «algo» que entrega lecturas de contador y «algo» que envía mensajes a los participantes del mercado.

## Para desarrolladores: cómo se ve en el código

Un ejemplo simplificado. El model contiene el negocio:

```kotlin
// model
data class MeterReading(
    val meteringPointId: MeteringPointId,
    val value: BigDecimal,
    val readAt: Instant,
)
```

El módulo application contiene el caso de uso y los puertos que necesita:

```kotlin
// application
interface MeterReadingSource {
    fun readingsOf(day: LocalDate): List<MeterReading>
}

interface MarketPartnerNotifier {
    fun send(messages: List<MarketMessage>)
}

class ForwardMeterReadings(
    private val source: MeterReadingSource,
    private val notifier: MarketPartnerNotifier,
) {
    fun forward(day: LocalDate) {
        val messages = source.readingsOf(day).map(MarketMessage::from)
        notifier.send(messages)
    }
}
```

El adaptador se encarga de la técnica. Aquí se ve una ventaja que valoro mucho en el día a día: el batching es una cuestión técnica, no de negocio. SNS acepta como máximo diez mensajes por llamada. Eso pertenece al adaptador, no al caso de uso:

```kotlin
// adapter
@Component
class SnsMarketPartnerNotifier(
    private val sns: SnsClient,
    private val topic: TopicProperties,
) : MarketPartnerNotifier {

    override fun send(messages: List<MarketMessage>) {
        messages.chunked(10).forEach { batch ->
            sns.publishBatch(batchRequest(topic.arn, batch))
        }
    }
}
```

La capa bootstrap conecta ambas partes. El caso de uso sigue siendo una clase sencilla sin anotaciones:

```kotlin
// bootstrap
@SpringBootApplication
class MarketCommunicationApplication {

    @Bean
    fun forwardMeterReadings(source: MeterReadingSource, notifier: MarketPartnerNotifier) =
        ForwardMeterReadings(source, notifier)
}
```

Así, el caso de uso se puede probar con dos pequeños fakes, sin contexto de Spring, sin Testcontainers, en milisegundos. Los adaptadores los pruebo por separado contra infraestructura real, por ejemplo con Testcontainers y LocalStack.

## Para arquitectos: reglas que se comprueban solas

Una arquitectura que solo existe en la wiki no dura mucho. Por eso la aseguro en dos niveles.

El primer nivel son los módulos de Gradle. El módulo application declara solo el model como dependencia. Un import de Spring ahí simplemente no compila. Es la regla más fuerte, porque ni siquiera se puede romper.

El segundo nivel es ArchUnit. Comprueba en el build lo que Gradle no ve – por ejemplo, que ningún framework se cuele en el negocio a través de una dependencia que otro módulo transmite:

```kotlin
@AnalyzeClasses(packages = ["com.example.marketcommunication"])
class ArchitectureTest {

    @ArchTest
    val domainIsFrameworkFree: ArchRule = noClasses()
        .that().resideInAnyPackage("..model..", "..application..")
        .should().dependOnClassesThat()
        .resideInAnyPackage("org.springframework..", "software.amazon..", "jakarta.persistence..")
}
```

Quien incumple la regla no obtiene un build en verde. Las discusiones en la revisión de código se acortan, porque las reglas básicas ya no se negocian.

Para arquitectos hay un segundo punto importante: una estructura uniforme en varias aplicaciones vale más que la estructura perfecta de una sola. Quien conoce una aplicación se orienta en la siguiente de inmediato. Precisamente por eso el departamento utiliza ya la estructura como plantilla.

## Para quienes deciden: lo que la separación significa en términos económicos

La arquitectura hexagonal no es una cuestión de gusto de los desarrolladores. Influye directamente en costes y riesgos:

- **Búsqueda de errores más rápida.** Un error se puede asignar con claridad: negocio o técnica. Eso acorta el tiempo hasta dar con la causa – sobre todo en incidencias en producción.
- **El negocio se puede evaluar.** Las reglas están en un único lugar y se leen sin adornos técnicos. Negocio y desarrollo pueden comprobar juntos si el software hace lo que debe.
- **Menos dependencia de los frameworks.** Una actualización del framework, o incluso un cambio, afecta sobre todo a los adaptadores y al bootstrap, no al negocio. Eso hace más planificables los grandes saltos de versión.
- **Arranque más rápido de nuevas aplicaciones.** Con una plantilla probada, un equipo no empieza desde cero.

Frente a esto hay un esfuerzo que conviene planificar con honestidad.

## Dónde duele

La técnica no es el problema. El problema es la disciplina.

Muchos desarrolladores han pensado durante años en capas: controller, service, repository. La arquitectura hexagonal exige otra forma de pensar. ¿Dónde va una validación? ¿Un reintento es una cuestión de negocio o técnica? ¿Puede el caso de uso saber que existe una base de datos? Estas preguntas surgen continuamente en el día a día, y no todos los miembros del equipo entienden los principios de inmediato. Eso cuesta tiempo de formación, explicaciones y paciencia en las revisiones.

A ello se suma el conocido precio de los tipos adicionales: los objetos de negocio y las representaciones técnicas, como el JSON de un mensaje o una fila de la base de datos, están separados, y entre ellos hace falta código de mapeo.

Aun así, no veo ninguna razón para no construir un backend de forma hexagonal. El esfuerzo de aprendizaje se paga una vez. El beneficio crece con cada año que una aplicación está en producción y con cada actualización de framework que supera.

## En qué fijarse al introducirla

**Para quienes deciden:**
- Planifique la formación de forma consciente, en lugar de esperar que ocurra de paso.
- Pida una plantilla que valga para todas las aplicaciones nuevas – no soluciones aisladas por equipo.
- Exija que las reglas se comprueben en el build. La documentación por sí sola no basta.

**Para arquitectos:**
- Separe model, application, adapter y bootstrap en módulos propios, no solo en paquetes.
- Complemente los límites de los módulos con reglas de ArchUnit en la CI.
- Decida pronto dónde van los temas transversales: batching, reintentos, transacciones.

**Para desarrolladores:**
- Escriba primero el caso de uso y después los adaptadores.
- Pruebe el negocio sin Spring y los adaptadores contra infraestructura real.
- Si necesita una anotación de framework en el model o en la application, tómelo como una señal de alarma, no como una excepción.

La arquitectura hexagonal no hace que un backend sea bueno de forma automática. Pero deja ver dónde es bueno y dónde no – y en una aplicación que debe funcionar durante mucho tiempo, eso vale mucho.
