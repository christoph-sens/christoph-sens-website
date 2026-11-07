---
title: 'Cuando el sistema de destino ya no puede más: el circuit breaker como protección para backends legados'
description: 'Por qué el batching y el rate limiting no bastan por sí solos, cómo un circuit breaker acoplado al procesamiento de colas mantiene vacía la dead letter queue y cómo una configuración basada en la latencia devolvió a un sistema legado sobrecargado una disponibilidad del 99,9 %.'
date: 2026-11-07
key: circuit-breaker-fuer-legacy-backends
category: article
tags: [Resilience, Circuit Breaker, Spring Boot, Resilience4j, Messaging]
---

La alerta salta a las dos de la madrugada. La dead letter queue se está llenando: varios miles de mensajes en pocos minutos. La persona de guardia revisa nuestro sistema: todos los pods funcionan, los health checks están en verde, las colas siguen aceptando datos. Y, sin embargo, nada llega al sistema de destino. El problema no es nuestro, pero somos nosotros quienes cargamos con él. A la mañana siguiente espera medio día de trabajo: revisar la DLQ, reenviar los mensajes uno a uno o por lotes y aclarar con el área de negocio qué faltó mientras tanto.

Muchos equipos que preparan datos para un sistema legado y se los transmiten conocen este patrón. En este artículo describo cómo lo resolvimos con un circuit breaker, qué ocurre a nivel técnico y qué conviene tener en cuenta al introducirlo.

## El punto de partida: procesamiento previo, entrega síncrona

Nuestro sistema trabaja por delante de otro sistema. Recibe datos de distintas fuentes, los valida, los enriquece, los transforma y entrega el resultado al sistema de destino a través de REST. Internamente, el procesamiento está desacoplado de forma asíncrona mediante colas; el último tramo es una llamada HTTP síncrona.

El sistema de destino es un sistema legado que ha crecido durante años: central para el negocio, pero técnicamente al límite. Apenas escala horizontalmente, comparte base de datos y recursos con otras funciones y reacciona con sensibilidad a los picos de carga. Además, no somos su único proveedor. Varios sistemas previos le envían datos, cada uno a su propio ritmo.

La solución más obvia sería hacer asíncrona la propia entrega: el sistema de destino recoge los datos de una cola cuando tiene capacidad y marca su propio ritmo. Lamentablemente, eso es justo lo que aquí no es posible. El sistema legado solo ofrece su interfaz REST síncrona, y pasarlo a un modo de trabajo asíncrono exigiría cambios profundos en una aplicación que apenas se sigue desarrollando. En entornos así, esto es más la regla que la excepción. Teníamos que convivir con la interfaz síncrona y controlar la carga desde nuestro lado.

## Lo que probamos antes y por qué solo ayudó en parte

Antes de recurrir a un circuit breaker hay una serie de medidas evidentes. Implementamos la mayoría:

- **Batching**: en lugar de transmitir cada mensaje por separado, agrupamos varios. Eso ahorra sobrecarga de conexión y de protocolo, pero solo desplaza la carga. Los lotes grandes provocan transacciones largas y picos propios en el otro lado.
- **Rate limiting**: limitamos las llamadas por unidad de tiempo a un valor que, según lo acordado, el sistema de destino soporta. El problema: ese valor es estático; la capacidad del sistema legado no lo es. Si allí se está ejecutando un proceso batch, o si otro sistema previo envía datos al mismo tiempo, el valor acordado de repente es demasiado alto.
- **Reintentos con backoff exponencial**: las llamadas fallidas se repiten con intervalos crecientes. Contra interrupciones breves, ayuda. Con una sobrecarga real empeora la situación, porque cada reintento genera carga adicional. Es lo que se conoce como retry storm.
- **Timeouts**: los timeouts cortos protegen nuestros propios hilos de quedarse bloqueados. Pero en el otro lado la petición a menudo ya se está procesando y sigue consumiendo recursos.
- **Concurrencia limitada (bulkhead)**: limitamos el número de consumidores simultáneos y de conexiones abiertas. Eso hace la carga más predecible, pero también aquí el límite no sabe nada del estado del sistema de destino.
- **Distribución en el tiempo**: trasladamos las entregas de datos no urgentes a horas de menor actividad.

Todo esto ayudó, pero no lo suficiente. Todas estas medidas comparten un punto ciego: no reaccionan a cómo está el sistema de destino *en este momento*. Siguen enviando aunque el otro lado lleve tiempo indicando que ya no puede más. El resultado era un cuadro conocido: las latencias pasaban de milisegundos a muchos segundos, luego llegaban los timeouts y los errores HTTP 5xx y, al final, el sistema dejaba de estar accesible. En nuestro lado se agotaban los reintentos y los mensajes acababan en la DLQ.

## El principio del circuit breaker

El circuit breaker toma su nombre del interruptor automático eléctrico y se popularizó sobre todo gracias al libro *Release It!* de Michael Nygard. La idea: cuando un sistema del que dependemos tiene problemas evidentes, dejamos de cargarlo. Fallamos de inmediato y de forma controlada, en lugar de dejar que cada llamada agote primero su timeout.

Técnicamente, el circuit breaker es una máquina de estados con tres estados:

**Closed (cerrado)**: el funcionamiento normal. Todas las llamadas pasan. Mientras tanto, el circuit breaker observa los resultados en una ventana deslizante, por ejemplo las últimas 100 llamadas o los últimos 60 segundos. Cuenta cuántas fallaron y cuántas fueron más lentas que un umbral definido.

**Open (abierto)**: si la tasa de fallos o la tasa de llamadas lentas supera un umbral, por ejemplo el 50 %, el circuit breaker se abre. A partir de ese momento las llamadas ni siquiera se envían, sino que se rechazan al instante con una excepción. El sistema de destino obtiene un respiro, y el nuestro no desperdicia hilos ni conexiones en llamadas que fallarían de todos modos.

**Half-open (semiabierto)**: tras un tiempo de espera definido, el circuit breaker pasa a un modo de prueba. Deja pasar un número pequeño y limitado de llamadas, por ejemplo cinco o diez. Si tienen éxito y son lo bastante rápidas, se cierra de nuevo y se reanuda el funcionamiento normal. Si fallan, vuelve a abrirse y el tiempo de espera empieza de nuevo.

La diferencia decisiva frente a los reintentos y el rate limiting: el circuit breaker decide en función del *comportamiento observado*. No necesita un límite de carga acordado de antemano, sino que reacciona a lo que el sistema de destino devuelve realmente.

## Circuit breaker y colas: detener el procesamiento en lugar de quemar mensajes

Un circuit breaker por sí solo todavía no resuelve nuestro problema con la DLQ. Si se abre y el consumidor de la cola sigue funcionando, cada mensaje se rechaza al instante, más rápido que antes, y acaba en la DLQ igual de rápido. Se ha construido entonces un sistema muy eficiente para llenar la dead letter queue.

La verdadera solución está en el acoplamiento: **cuando el circuit breaker se abre, detenemos el procesamiento de la cola.** Los mensajes se quedan donde deben estar, en la cola de entrada. No se pierden ni son erróneos; simplemente esperan. Así, la cola asume el papel de búfer para el que está hecha.

En concreto, el flujo es este:

1. El circuit breaker pasa a *open*. Un listener sobre el evento de estado pausa los consumidores afectados.
2. Tras el tiempo de espera, el circuit breaker pasa automáticamente a *half-open*. El consumidor se reactiva, pero solo lo justo para que mensajes individuales pasen como transacciones de prueba.
3. Si las llamadas de prueba tienen éxito, el circuit breaker se cierra y los consumidores procesan el atraso acumulado, idealmente con una concurrencia reducida para que no surja de inmediato el siguiente pico de carga.
4. Si fallan, el circuit breaker se abre de nuevo y los consumidores vuelven a pausarse.

Un detalle importante en la práctica: los mensajes rechazados por el circuit breaker no deben contar como errores de procesamiento. Tienen que volver a la cola (sin confirmar, restableciendo la visibilidad, requeue, según el broker) sin aumentar el contador que en algún momento provoca el reenvío a la DLQ. De lo contrario, acabarán allí de todos modos. Así la DLQ queda reservada para lo que está pensada: mensajes que no se pueden procesar por su *contenido*, no los que simplemente llegaron en mal momento.

## Alertas: ¿quién es el responsable?

Un efecto secundario que habíamos subestimado afecta a la operación. Antes del circuit breaker, solía pasar lo siguiente: la alerta saltaba porque la DLQ crecía. Se contactaba con soporte, que revisaba nuestro sistema y no encontraba nada, porque nuestro sistema estaba accesible y funcionaba. Simplemente no podíamos reenviar los datos. Hasta que quedaba claro que la causa estaba en el sistema de destino pasaba un tiempo valioso, a menudo con varias personas en una llamada.

El circuit breaker ofrece aquí una señal precisa. Una alerta del tipo «circuit breaker hacia el sistema de destino X abierto» indica de inmediato dónde está el problema y quién puede resolverlo. Exportamos los cambios de estado como métrica y configuramos la alerta para que llegue directamente al equipo de operación del sistema de destino y para nosotros sea solo informativa. Nuestra guardia ya no tiene que levantarse de noche para descubrir que no puede hacer nada. Y después de la incidencia nadie tiene que reenviar la DLQ a mano: el procesamiento se reanuda solo en cuanto el sistema de destino responde.

## La verdadera palanca: reaccionar a la latencia antes de que el sistema caiga

Hasta aquí, el circuit breaker nos protege sobre todo a *nosotros*: de inundaciones de la DLQ, de llamadas inútiles y de falsas alarmas. Su mayor efecto aparece cuando se le permite reaccionar no solo a los errores, sino ya al **aumento de la latencia**.

Un sistema sobrecargado rara vez cae de golpe. Primero se vuelve lento, luego muy lento, luego inaccesible. El aumento del tiempo de respuesta es la señal de alerta temprana. Quien la ignora y sigue enviando a plena carga empuja al sistema de destino hacia la caída que en realidad quiere evitar. Esa caída es entonces, en buena parte, provocada por uno mismo.

Por eso, las implementaciones modernas de circuit breaker permiten configurar, además de la tasa de fallos, una **slow call rate**: una llamada se considera «lenta» si tarda más que un umbral definido, por ejemplo dos segundos en lugar de los 200 milisegundos habituales. Si la proporción de llamadas lentas supera un umbral, el circuit breaker se abre, aunque todavía no haya fallado ninguna llamada.

El resultado es un ritmo que dosifica la carga sobre el sistema de destino: pausas cortas, luego unas pocas llamadas de prueba en el estado half-open y, de nuevo, plena carga en cuanto los tiempos de respuesta vuelven a ser normales. En conjunto, durante una fase de carga llegan bastantes menos mensajes al sistema de destino, y este tiene la oportunidad de procesar su atraso antes de colapsar.

Siendo honestos: el circuit breaker es un instrumento binario; está abierto o cerrado. No permite una regulación gradual. Quien quiera un control más fino lo combina con una concurrencia limitada que se reduce cuando sube la latencia, o con límites de concurrencia adaptativos. En nuestro caso, sin embargo, la configuración del circuit breaker basada en la latencia fue el paso decisivo.

## El resultado: solo la suma marca la diferencia

Primero introdujimos el circuit breaker en nuestro propio sistema. Las incidencias de la DLQ desaparecieron casi por completo, y también las alarmas nocturnas en nuestro lado. En el sistema de destino, sin embargo, al principio cambió menos de lo que esperábamos. La razón es evidente: solo éramos uno de varios proveedores. Si nosotros nos contenemos pero los demás siguen enviando a plena carga, el sistema de destino sigue sobrecargado.

El avance llegó con la introducción del mismo patrón en *todos* los sistemas previos. Solo cuando cada proveedor reaccionó al aumento de la latencia conteniéndose surgió un sistema que se estabiliza por sí mismo. Desde entonces, el sistema legado vuelve a cumplir su SLA del 99,9 % de disponibilidad, sin que haya hecho falta modificar nada en él.

Para quienes toman decisiones, esta conclusión es quizá la más importante: la resiliencia en sistemas distribuidos no es una propiedad de componentes individuales, sino de su interacción. Un solo equipo puede protegerse a sí mismo. Al sistema de destino común solo lo protegen todos juntos. Es también una tarea organizativa: alguien tiene que imponer el patrón como estándar para todas las interfaces con este sistema.

## Implementación en Spring Boot con Resilience4j

En el entorno de Java y Spring, [Resilience4j](https://resilience4j.readme.io/) es la biblioteca habitual para circuit breakers. Sustituyó a Netflix Hystrix, que desde 2018 solo está en modo de mantenimiento. Resilience4j es ligera y modular, y además del circuit breaker incluye retry, rate limiter, bulkhead y time limiter, justo las piezas que se quieren combinar. Con `resilience4j-spring-boot3` existe una integración directa con Spring Boot; como alternativa, Spring Cloud Circuit Breaker ofrece una capa de abstracción bajo la que Resilience4j trabaja como implementación.

La configuración es declarativa, por ejemplo en `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      legacySystem:
        slidingWindowType: TIME_BASED
        slidingWindowSize: 60                  # segundos
        minimumNumberOfCalls: 20
        failureRateThreshold: 50               # porcentaje
        slowCallDurationThreshold: 2s
        slowCallRateThreshold: 50              # porcentaje
        waitDurationInOpenState: 30s
        automaticTransitionFromOpenToHalfOpenEnabled: true
        permittedNumberOfCallsInHalfOpenState: 5
        registerHealthIndicator: true
```

En el código basta con una anotación en el cliente:

```java
@CircuitBreaker(name = "legacySystem")
public void deliver(Payload payload) {
    restClient.post()
        .uri("/api/data")
        .body(payload)
        .retrieve()
        .toBodilessEntity();
}
```

El acoplamiento con el procesamiento de colas se hace a través de la API de eventos. Mediante el `CircuitBreakerRegistry` se registra un listener para los cambios de estado y con él se pausan o se arrancan los listener containers; en Spring Kafka, por ejemplo, a través del `KafkaListenerEndpointRegistry`, y en JMS mediante `stop()` y `start()` del contenedor. Los estados y las métricas llegan automáticamente a la monitorización a través de Micrometer, y el health indicator hace visible el estado en el endpoint de Actuator.

Conviene revisar con calma el orden de las piezas: los reintentos deben situarse *dentro* del circuit breaker o configurarse de modo que no actúen cuando el circuit breaker está abierto (`CallNotPermittedException`). De lo contrario, se repiten llamadas que el circuit breaker está evitando deliberadamente.

## Recomendaciones para la introducción

De nuestro proyecto se derivan algunos criterios que recomendaría a los equipos en una situación similar:

**Usar la latencia como primera señal.** No configure el circuit breaker solo para errores, sino también para llamadas lentas. El umbral debe basarse en los valores normales medidos, no en el timeout. Quien reacciona solo a los 30 segundos reacciona demasiado tarde.

**Acoplar el procesamiento de colas al circuit breaker.** Un circuit breaker delante de un consumidor que sigue funcionando solo desplaza el problema. Los mensajes rechazados deben volver a la cola, no a la DLQ.

**Calibrar los umbrales con datos reales.** El número mínimo de llamadas, el tamaño de la ventana y el tiempo de espera determinan lo nervioso o lo lento que reacciona el circuit breaker. Empiece con valores conservadores, observe los cambios de estado durante unas semanas y ajuste. Un circuit breaker que oscila constantemente es tan inútil como uno que nunca salta.

**Dirigir las alertas según la responsabilidad.** Un circuit breaker abierto es una señal para el equipo del sistema de destino. Envíe la alarma a donde alguien pueda actuar.

**Regular el rearranque.** Después de una incidencia espera un atraso. Si todos los consumidores arrancan a la vez con plena concurrencia, generan el siguiente pico de carga. Un arranque progresivo lo evita.

**Establecer el patrón para todos los proveedores.** Cuando varios sistemas alimentan el mismo backend, el circuit breaker solo despliega todo su efecto cuando todos lo utilizan. Eso requiere un acuerdo que traspase los límites de los equipos, idealmente como estándar obligatorio para la conexión con el sistema.

Un circuit breaker no hace más potente a un sistema legado. Se asegura de que todos los implicados respeten sus límites. A menudo basta con eso para volver a operar con fiabilidad un sistema que se daba por perdido, y gana el tiempo que necesita una verdadera modernización.
