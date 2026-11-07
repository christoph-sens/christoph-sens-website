---
title: 'La mayoría de las pruebas de integración son pruebas unitarias disfrazadas'
description: 'Un @SpringBootTest se escribe rápido y sale caro al ejecutarse. Quien comprueba la lógica de negocio con pruebas de integración lo paga con reinicios de contexto, arranques de Testcontainers y pipelines largos. Cómo la arquitectura hexagonal vuelve a poner en pie la pirámide de pruebas – y qué palancas de Spring llevan un pipeline de 40 a 20 minutos.'
date: 2026-11-07
key: verkleidete-unit-tests
category: article
tags: [Kotlin, Spring Boot, Testing, Pirámide de pruebas, Arquitectura hexagonal, Testcontainers, CI/CD]
---

Hay un error en producción. La corrección es una línea y está escrita en cinco minutos. Después, el equipo espera 40 minutos al pipeline. Si una prueba falla por otro motivo, son otros 40 minutos. Quien quiere poder publicar en cualquier momento tiene aquí un problema, y ese problema no está en la lógica de negocio, sino en la suite de pruebas.

En un proyecto redujimos el pipeline de 40 a 20 minutos. No compramos runners más rápidos ni borramos pruebas. Preguntamos a cada prueba de integración qué comprueba en realidad. La respuesta fue, sorprendentemente a menudo: lógica de negocio. Mi tesis tras esa experiencia es tajante, pero la considero correcta: **la mayoría de las pruebas de integración son pruebas unitarias disfrazadas.**

## Por qué las pruebas de integración resultan tan tentadoras

En el mundo Spring, una prueba de integración es cómoda. `@SpringBootTest` en la clase, los beans necesarios con `@Autowired`, y listo. No hay que pensar en las dependencias de una clase, no hay que construir fakes, y la prueba se siente «real». Con Testcontainers incluso funciona una base de datos Postgres de verdad.

La factura llega después, y llega con cada build. Una prueba unitaria se ejecuta en milisegundos. Un contexto de Spring tarda, según la aplicación, desde unos segundos hasta medio minuto en arrancar. Un contenedor también tarda segundos, a menudo más. Mientras todas las pruebas comparten el mismo contexto, apenas se nota, porque Spring guarda el contexto en caché y lo arranca una sola vez. Se encarece cuando la caché no acierta:

- `@DirtiesContext` descarta el contexto después de la prueba. La siguiente prueba lo vuelve a arrancar.
- Cada clase de prueba con su propio `@MockitoBean`, su propio perfil o sus propias propiedades obtiene un contexto propio.
- Los contenedores que se arrancan por clase de prueba se vuelven a arrancar en cada clase.

Cada una de estas decisiones es inofensiva por sí sola. En conjunto, el pipeline arranca y detiene la aplicación con su infraestructura decenas de veces. El tiempo de ejecución no crece con el número de pruebas, sino con el número de contextos y contenedores distintos. En nuestro caso, esa era la partida más grande.

## Qué debe comprobar una prueba de integración – y qué no

Integración significa: comprobamos si los componentes encajan entre sí. ¿Llega el mensaje de la cola al caso de uso? ¿Termina el resultado en la base de datos? ¿Son correctos el mapeo, el SQL y la transacción? Son preguntas que solo una infraestructura real o simulada de forma realista puede responder.

Lo que una prueba de integración no necesita comprobar:

- **Rangos de valores.** Si un cálculo es correcto con 0, 1.200 y 3.500 kWh es una cuestión de lógica de negocio. No hace falta una base de datos.
- **Criterios de salida.** Si un caso de uso no llega a guardar con ciertas entradas es una decisión de la lógica de negocio. Una prueba de integración que comprueba que un componente *no* se llama no prueba ninguna integración.
- **Redondeos, límites, casos especiales.** Todo lo que define una regla pertenece a la regla – y por tanto a una prueba unitaria.

Así que una prueba de integración de un adaptador pregunta: ¿se escribe, y al leer se obtiene lo mismo? Si antes se calculó lo correcto no es tarea suya.

Esa es la pirámide de pruebas tal como fue pensada: muchas pruebas unitarias rápidas abajo, pocas pruebas de integración en el medio, muy pocas pruebas end-to-end arriba. En muchos proyectos Spring la pirámide está invertida, porque la prueba más cómoda es también la más cara.

## La arquitectura hexagonal hace visible la separación

Darle la vuelta a la pirámide es laborioso en una arquitectura clásica por capas. Si el servicio conoce directamente el repositorio JPA, el `RestTemplate` y el `KafkaTemplate`, una prueba unitaria sin Spring solo es posible con muchos mocks – y al final se vuelve a recurrir a `@SpringBootTest`.

En una [arquitectura hexagonal](/es/blog/arquitectura-hexagonal-en-la-practica/) la separación ya está en el código. El negocio vive en model y application y no conoce Spring. La técnica vive en los adaptadores. El reparto de las pruebas sale casi solo:

| Nivel | Qué se comprueba | Cómo |
|---|---|---|
| Model | Reglas, cálculos, límites | Pruebas unitarias, Kotlin puro |
| Application | Flujo del caso de uso, criterios de salida | Pruebas unitarias con fakes para los puertos |
| Adapter | Mapeo, SQL, serialización, infraestructura | Pruebas de integración con test slice y contenedor |
| Bootstrap | Cableado, configuración | una o dos smoke tests |

Los puertos son la costura. Todo lo que ocurre delante del puerto se prueba sin infraestructura. Todo lo que ocurre detrás, con infraestructura, pero sin lógica de negocio.

## Un ejemplo: el cálculo de la cuota mensual

Un contrato tiene una cuota mensual. A partir del consumo anual previsto y de la tarifa se obtiene una nueva cuota. Se redondea al euro entero hacia arriba, es como mínimo de 15 euros y solo se guarda si difiere de la actual en al menos 5 euros.

Así es una prueba tal como surge en muchos proyectos:

```kotlin
@SpringBootTest
@Testcontainers
class AdjustInstallmentIT {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }

    @Autowired lateinit var adjustInstallment: AdjustInstallment
    @Autowired lateinit var installments: InstallmentRepository
    @MockitoBean lateinit var consumption: ConsumptionSource

    @ParameterizedTest
    @CsvSource("0, 15", "1200, 40", "3500, 98")
    fun `calculates monthly installment`(kwh: BigDecimal, expected: BigDecimal) {
        whenever(consumption.annualForecast(CONTRACT)).thenReturn(kwh)

        adjustInstallment.adjust(CONTRACT, TARIFF)

        assertThat(installments.current(CONTRACT)!!.monthly).isEqualByComparingTo(expected)
    }

    @Test
    @DirtiesContext
    fun `does not save small deviations`() {
        // crear una cuota existente, cambiar ligeramente el consumo, comprobar que no se guardó nada
    }
}
```

La prueba es correcta y está bien intencionada. Aun así, tiene tres propiedades caras: el contenedor vuelve a arrancar para esta clase. El `@MockitoBean` obliga a un contexto propio que ninguna otra clase de prueba comparte. Y `@DirtiesContext` descarta ese contexto después de la última prueba. Pero, sobre todo, en el fondo comprueba lógica de negocio: redondeo, importe mínimo y umbral. La base de datos es solo decorado.

### La regla pertenece al model

El cálculo es una regla de negocio. Está en el model, sin ninguna dependencia:

```kotlin
// model
data class Installment(val contractId: ContractId, val monthly: BigDecimal) {

    fun deviatesSignificantlyFrom(other: Installment): Boolean =
        (monthly - other.monthly).abs() >= SIGNIFICANT_DEVIATION

    companion object {
        private val MINIMUM = BigDecimal("15")
        private val SIGNIFICANT_DEVIATION = BigDecimal("5")

        fun calculate(contractId: ContractId, forecastKwh: BigDecimal, tariff: Tariff): Installment {
            val yearly = tariff.basePricePerYear + forecastKwh * tariff.pricePerKwh
            val monthly = yearly.divide(BigDecimal(12), 0, RoundingMode.CEILING)
            return Installment(contractId, maxOf(monthly, MINIMUM))
        }
    }
}
```

Su prueba no necesita ni Spring ni base de datos. Puede cubrir tantos rangos de valores como exija la regla y aun así se ejecuta en milisegundos:

```kotlin
class InstallmentTest {

    private val tariff = Tariff(basePricePerYear = BigDecimal("120"), pricePerKwh = BigDecimal("0.30"))

    @ParameterizedTest
    @CsvSource("0, 15", "100, 15", "1200, 40", "3500, 98")
    fun `rounds up to full euro and applies minimum`(kwh: BigDecimal, expected: BigDecimal) {
        val installment = Installment.calculate(CONTRACT, kwh, tariff)

        assertThat(installment.monthly).isEqualByComparingTo(expected)
    }

    @ParameterizedTest
    @CsvSource("40, 44, false", "40, 45, true", "40, 35, true")
    fun `detects significant deviation`(old: BigDecimal, new: BigDecimal, expected: Boolean) {
        val result = Installment(CONTRACT, new).deviatesSignificantlyFrom(Installment(CONTRACT, old))

        assertThat(result).isEqualTo(expected)
    }
}
```

### El flujo pertenece a la application

El caso de uso une consumo, cálculo y almacenamiento. Aquí está también el criterio de salida:

```kotlin
// application
interface InstallmentRepository {
    fun current(contractId: ContractId): Installment?
    fun save(installment: Installment)
}

class AdjustInstallment(
    private val consumption: ConsumptionSource,
    private val installments: InstallmentRepository,
) {
    fun adjust(contractId: ContractId, tariff: Tariff) {
        val forecast = consumption.annualForecast(contractId)
        val new = Installment.calculate(contractId, forecast, tariff)
        val current = installments.current(contractId)

        if (current != null && !new.deviatesSignificantlyFrom(current)) return

        installments.save(new)
    }
}
```

Si se guarda ante una desviación pequeña lo comprueba una prueba unitaria con un fake sencillo. Un fake es aquí una pequeña implementación del puerto en memoria, más legible que cualquier configuración de mocks:

```kotlin
class InMemoryInstallments : InstallmentRepository {
    val saved = mutableListOf<Installment>()
    private val current = mutableMapOf<ContractId, Installment>()

    fun given(installment: Installment) { current[installment.contractId] = installment }
    override fun current(contractId: ContractId) = current[contractId]
    override fun save(installment: Installment) { saved += installment }
}

class AdjustInstallmentTest {

    private val installments = InMemoryInstallments()

    @Test
    fun `does not save small deviations`() {
        installments.given(Installment(CONTRACT, BigDecimal("40")))
        val adjust = AdjustInstallment({ BigDecimal("1300") }, installments)

        adjust.adjust(CONTRACT, TARIFF)

        assertThat(installments.saved).isEmpty()
    }
}
```

La lambda funciona si `ConsumptionSource` está declarada como `fun interface`. Con 1.300 kWh la cuota sale a 43 euros, la desviación es inferior a 5 euros y, por tanto, no se guarda nada. Sin contexto, sin contenedor, sin `@DirtiesContext`.

### El adaptador recibe su prueba de integración

Queda la pregunta que sí necesita infraestructura: ¿escribe el adaptador correctamente en Postgres y vuelve a leer lo mismo? Para eso basta un test slice. `@JdbcTest` arranca solo la infraestructura JDBC, no toda la aplicación:

```kotlin
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JdbcInstallmentRepository::class)
class JdbcInstallmentRepositoryIT(
    @Autowired private val repository: JdbcInstallmentRepository,
) : PostgresTest() {

    @Test
    fun `saves and reads installment`() {
        repository.save(Installment(CONTRACT, BigDecimal("40")))

        assertThat(repository.current(CONTRACT)!!.monthly).isEqualByComparingTo("40")
    }
}
```

`PostgresTest` proporciona el contenedor; cómo lo hace lo muestra la sección sobre los remedios. Por cierto, comparar con `isEqualByComparingTo` no es un detalle: una columna `numeric(10,2)` devuelve `40.00`, y `BigDecimal("40") == BigDecimal("40.00")` es `false` en Kotlin igual que en Java. Justo ese tipo de errores encuentra la prueba del adaptador, y justo para eso está.

Un caso, un recorrido de ida y vuelta por la base de datos. Los rangos de valores ya no importan aquí. La única responsabilidad del adaptador es guardar una cuota sin pérdidas y volver a leerla.

En la cima de la pirámide queda entonces un único `@SpringBootTest` que comprueba que la aplicación arranca y que un caso de uso se recorre de fuera hacia dentro. Uno, no treinta.

## Los remedios en Spring

La arquitectura hace que se necesiten menos pruebas de integración. Las que quedan deberían ser lo más baratas posible. Estas palancas son las que más efecto tienen en la práctica.

### 1. Test slices en lugar de `@SpringBootTest`

Spring Boot trae un slice adecuado para la mayoría de los adaptadores: `@JdbcTest` y `@DataJdbcTest` para JDBC, `@DataJpaTest` para JPA, `@WebMvcTest` para controladores, `@JsonTest` para la serialización. Un slice carga solo las autoconfiguraciones necesarias para esa parte. El contexto es más pequeño, arranca más rápido, y la anotación ya indica qué comprueba la prueba.

Un escollo: por defecto, los slices de base de datos sustituyen el data source por una base de datos embebida. Quien quiera probar contra Postgres en un contenedor pone `@AutoConfigureTestDatabase(replace = Replace.NONE)`.

### 2. Dejar trabajar a la caché de contextos

Spring guarda los contextos en caché según su configuración: clases de configuración, perfiles, propiedades, mock beans. Dos clases de prueba con configuración idéntica comparten un contexto. Basta una propiedad distinta para crear un segundo.

- Coloque los mocks que necesitan muchas pruebas en una clase base común o en una configuración de prueba compartida, en lugar de declararlos de forma ligeramente distinta en cada clase.
- Evite `@TestPropertySource` y perfiles por clase de prueba si no son realmente necesarios.
- Mírelo: con `logging.level.org.springframework.test.context.cache=DEBUG`, Spring muestra la estadística de la caché, es decir, cuántos contextos se crearon y cuántas veces se reutilizaron. Esa cifra dice más que cualquier suposición.

### 3. Evitar `@DirtiesContext`

`@DirtiesContext` es casi siempre un atajo para otro problema: una prueba deja datos que molestan a la siguiente. Eso se resuelve de forma más barata. Los slices de JDBC y JPA son transaccionales por defecto y hacen rollback tras cada prueba. Donde eso no encaja, un script `@Sql` o un `TRUNCATE` limpia antes de la prueba. Ambos cuestan milisegundos, no un reinicio de la aplicación.

### 4. Arrancar los contenedores una vez por JVM

Con `@Container` en un campo de la clase de prueba, Testcontainers arranca el contenedor por clase. Es correcto, pero caro. Un contenedor que arranca una vez por ejecución de pruebas y que comparten todas las pruebas basta en la gran mayoría de los casos:

```kotlin
abstract class PostgresTest {
    companion object {
        @JvmStatic
        @ServiceConnection
        val postgres = PostgreSQLContainer("postgres:17-alpine").apply { start() }
    }
}
```

`@ServiceConnection` (desde Spring Boot 3.1) lee URL, usuario y contraseña directamente del contenedor, sin `@DynamicPropertySource`. El campo estático se inicializa exactamente una vez, cuando la JVM carga la clase, y todas las clases de prueba que heredan de `PostgresTest` usan el mismo contenedor. Testcontainers lo detiene por sí mismo al terminar la JVM.

Lo decisivo es lo que falta: la anotación `@Container` y `@Testcontainers` en la clase. Con ellas, la extensión de JUnit asume el ciclo de vida y detiene el contenedor después de cada clase de prueba. Para tener un contenedor por ejecución, se arranca uno mismo.

### 5. Dividir el pipeline en etapas

Las pruebas unitarias y las de integración van en tareas de Gradle separadas, por ejemplo con las JVM Test Suites y una suite propia `integrationTest`. Las pruebas unitarias se ejecutan primero y fallan en segundos si la lógica de negocio está rota. Las de integración se ejecutan después o en paralelo. Esto no acorta el tiempo total, pero sí el tiempo hasta el primer resultado, y eso es lo que más cuenta en un hotfix.

## Qué significa esto para la capacidad de entrega

Continuous delivery no significa que nunca llegue un error a producción. Significa que un error vuelve a salir rápido. La cifra clave es el tiempo desde la corrección hasta el despliegue. Un pipeline de 40 minutos convierte una corrección de cinco minutos en tres cuartos de hora. Con 20 minutos es la mitad. Con dos intentos fallidos, la diferencia ya es de una hora.

Los pipelines lentos tienen además un efecto secundario que no se mide en minutos: los desarrolladores acumulan cambios en lugar de entregarlos uno a uno. Cambios más grandes significan más riesgo y una búsqueda de errores más difícil. Una suite de pruebas rápida no es, por tanto, una cuestión de comodidad, sino la condición para que los releases pequeños y frecuentes se hagan realidad.

## En qué fijarse

- **Hágale una pregunta a cada prueba de integración:** ¿qué saldría mal si no existiera la infraestructura? Si la respuesta es «nada, el cálculo sería el mismo», es una prueba unitaria disfrazada.
- **Pruebe las reglas en el model.** Rangos de valores, redondeos, límites: tantos casos como necesite la regla, sin Spring.
- **Pruebe los flujos en la application** con pequeños fakes para los puertos. Los criterios de salida van aquí.
- **Dé a cada adaptador exactamente las pruebas de integración que comprueban su técnica.** Un recorrido de ida y vuelta por operación suele bastar.
- **Use test slices** en lugar de `@SpringBootTest`, y reserve el contexto completo para una o dos smoke tests.
- **Mida la caché de contextos** y evite `@DirtiesContext`.
- **Arranque los contenedores una vez por JVM** en un campo estático, sin `@Container`.
- **Divida el pipeline en etapas** para que el resultado rápido llegue primero.

Una prueba de integración es una buena herramienta cuando prueba integración. Quien la usa para la lógica de negocio lo paga en cada build – y, como muy tarde en el siguiente hotfix, todo el equipo nota cuánto.
