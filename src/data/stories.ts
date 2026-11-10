import type { Lang } from '../i18n/ui';

/**
 * Rich-text strings (`html`) are authored here and rendered with `set:html`.
 * Only put trusted, hand-written markup in this file.
 */
export type Block =
  | { type: 'p'; html: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; file: string; html: string }
  | { type: 'split'; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { type: 'chips'; items: string[] }
  | { type: 'buttons'; items: { label: string; href: string }[] };

export interface StorySection {
  eyebrow: string;
  title: string;
  blocks: Block[];
}

export interface Story {
  tags: string;
  title: string;
  /** Short text for the card on the home page. */
  teaser: string;
  metaDescription: string;
  lead: string;
  glance: [label: string, text: string][];
  facts?: [value: string, label: string][];
  sections: StorySection[];
}

export type StoryKey = 'storyMonolith' | 'storyTariff' | 'storyKotlin' | 'storyPdf';

const kotlinClass = (comment1: string, comment2: string) => `<span class="tok-kw">class</span> SqsExtendedClient(
    <span class="tok-kw">private val</span> sqsClient: SqsClient,
    <span class="tok-kw">private val</span> clientConfig: SqsExtendedClientConfig,
) : SqsClient <span class="tok-kw">by</span> sqsClient {
    <span class="tok-kw">override suspend fun</span> sendMessage(input: SendMessageRequest): SendMessageResponse { <span class="tok-com">/* ... */</span> }
    <span class="tok-com">${comment1}</span>
    <span class="tok-com">${comment2}</span>
}`;

const gradleLine = 'implementation(<span class="tok-str">"com.christoph-sens:sqsoverflow:1.1.0"</span>)';

const repoButtons: Block = {
  type: 'buttons',
  items: ['s3overflow', 'sqsoverflow', 'snsoverflow'].map((name) => ({
    label: name,
    href: `https://github.com/christoph-sens/${name}`,
  })),
};

const englishPost = 'https://christoph-sens.github.io/2026/09/large-sqs-sns-messages-in-kotlin/';

const pdfStack: Block = {
  type: 'chips',
  items: ['Java 21', 'Kotlin', 'Spring Boot', 'Spring Data', 'Hibernate', 'PostgreSQL', 'Docker', 'Docker Compose', 'Testcontainers', 'Rest Assured', 'JUnit', 'Maven'],
};

const pdfRepo = 'https://github.com/christoph-sens/pdf-generator';

const monolithStack: Block = {
  type: 'chips',
  items: ['Kotlin', 'Java 25', 'Spring Boot 4', 'AWS S3', 'SQS', 'SNS', 'EKS', 'Aurora PostgreSQL', 'Terraform', 'Kubernetes', 'Flyway', 'Testcontainers', 'WireMock', 'LocalStack'],
};

const tariffStack: Block = {
  type: 'chips',
  items: ['Java', 'Quarkus', 'AWS ECS', 'ECR', 'Aurora', 'Route 53', 'WAF', 'Terraform', 'GitLab CI', 'PostgreSQL', 'Hibernate', 'OpenAPI'],
};

export const stories: Record<StoryKey, Record<Lang, Story>> = {
  storyMonolith: {
    de: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'Einen Monolithen ablösen, ohne den Betrieb zu gefährden',
      teaser:
        'Ein Energieversorger löst einen nicht mehr wartbaren PHP-Monolithen für die Marktkommunikation schrittweise ab. Die neue Aggregation verarbeitet im Lasttest 70.000 Marktdaten in unter einer Minute.',
      metaDescription:
        'Success Story: schrittweise Ablösung eines PHP-Monolithen in der Energiewirtschaft mit Kotlin, Spring Boot und AWS – hexagonale Architektur, 70.000 Marktdaten im Lasttest in unter einer Minute aggregiert.',
      lead: 'Bei einem Energieversorger läuft die Marktkommunikation – An- und Abmeldungen, Zählerstände – über einen PHP-Monolithen, der als nicht mehr wartbar gilt. Er muss abgelöst werden, ohne dass der Betrieb stockt.',
      glance: [
        ['Aufgabe', 'Versand und Aufbereitung von Marktdaten aus dem Monolithen herauslösen – Schritt für Schritt und im laufenden Betrieb.'],
        ['Lösung', 'Neue Anwendungen und Bibliotheken in Kotlin und Java mit Spring Boot auf AWS, aufgebaut nach hexagonaler Architektur.'],
        ['Ergebnis', 'Der gesamte Versand von Marktdaten läuft über die neuen Anwendungen. Die Aggregation verarbeitet im Lasttest 70.000 Marktdaten in unter einer Minute, und der Monolith läuft stabiler.'],
      ],
      facts: [
        ['70.000', 'Marktdaten im Lasttest in unter einer Minute aggregiert'],
        ['100 %', 'des Marktdatenversands laufen über die neuen Anwendungen'],
        ['6', 'Bibliotheken und Anwendungen gebaut'],
      ],
      sections: [
        {
          eyebrow: 'Ausgangslage',
          title: 'Ein System, das niemand mehr anfassen will',
          blocks: [
            { type: 'p', html: 'Der Monolith verschickt Marktnachrichten an andere Marktteilnehmer und fasst Marktdaten zusammen. Er gilt als nicht mehr wartbar, und große Datenmengen zu aggregieren war für ihn eine fast unlösbare Aufgabe.' },
            { type: 'p', html: 'Ihn in einem Schritt zu ersetzen, wäre zu riskant gewesen. Deshalb wird er Stück für Stück abgelöst: Jede neue Anwendung übernimmt einen klar abgegrenzten Teil.' },
          ],
        },
        {
          eyebrow: 'Architektur',
          title: 'Hexagonal – und eine Vorlage für die Abteilung',
          blocks: [
            { type: 'p', html: 'Ich habe die neuen Anwendungen nach hexagonaler Architektur aufgebaut: Die Fachlogik kennt weder Datenbank noch Messaging. Adapter für AWS, PostgreSQL und Schnittstellen sind austauschbar und einzeln testbar.' },
            { type: 'p', html: 'Dieser Aufbau dient in der Abteilung inzwischen als Vorlage für weitere Anwendungen.' },
            {
              type: 'list',
              items: [
                '6 Bibliotheken und Anwendungen in Kotlin und Java',
                'Messaging über SQS und SNS, Daten in S3 und Aurora PostgreSQL',
                'Tests mit Testcontainers, WireMock und LocalStack',
              ],
            },
          ],
        },
        {
          eyebrow: 'Ergebnis',
          title: 'Schneller und stabiler',
          blocks: [
            { type: 'p', html: 'Der gesamte Versand von Marktdaten läuft heute über die neuen Anwendungen, ebenso ihre Aggregation und Zusammenfassung. Rund 10 % des Monolithen sind abgelöst, und der verbleibende Teil läuft seitdem stabiler.' },
            { type: 'p', html: 'Im ersten Lasttest hat die neue Aggregation 70.000 Marktdaten in unter einer Minute verarbeitet. Für das Altsystem war das praktisch nicht zu leisten.' },
          ],
        },
        {
          eyebrow: 'Wartbarkeit',
          title: 'Damit das Neue nicht das nächste Altsystem wird',
          blocks: [
            { type: 'p', html: 'Ich habe die neuen Anwendungen von Java 21 auf Java 25 und von Spring Boot 3 auf Spring Boot 4 gehoben und Renovate eingeführt. Abhängigkeiten werden seitdem automatisch aktuell gehalten.' },
            monolithStack,
          ],
        },
      ],
    },
    en: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'Replacing a monolith without putting operations at risk',
      teaser:
        'An energy supplier is replacing an unmaintainable PHP monolith for market communication step by step. In a load test, the new aggregation processed 70,000 market data records in under a minute.',
      metaDescription:
        'Success story: step-by-step replacement of a PHP monolith in the energy sector with Kotlin, Spring Boot and AWS – hexagonal architecture, 70,000 market data records aggregated in under a minute in a load test.',
      lead: 'At an energy supplier, market communication – registrations, deregistrations, meter readings – runs through a PHP monolith that is considered unmaintainable. It has to be replaced without operations grinding to a halt.',
      glance: [
        ['Task', 'Move the sending and processing of market data out of the monolith – step by step, while the system keeps running.'],
        ['Solution', 'New applications and libraries in Kotlin and Java with Spring Boot on AWS, built on a hexagonal architecture.'],
        ['Result', 'All market data is now sent through the new applications. In a load test, the aggregation processed 70,000 records in under a minute, and the monolith runs more stably.'],
      ],
      facts: [
        ['70,000', 'market data records aggregated in under a minute in a load test'],
        ['100%', 'of market data sending runs through the new applications'],
        ['6', 'libraries and applications built'],
      ],
      sections: [
        {
          eyebrow: 'Starting point',
          title: 'A system nobody wants to touch',
          blocks: [
            { type: 'p', html: 'The monolith sends market messages to other market participants and aggregates market data. It is considered unmaintainable, and aggregating large volumes of data was an almost impossible task for it.' },
            { type: 'p', html: 'Replacing it in one go would have been too risky. So it is being replaced piece by piece: each new application takes over a clearly defined part.' },
          ],
        },
        {
          eyebrow: 'Architecture',
          title: 'Hexagonal – and a template for the department',
          blocks: [
            { type: 'p', html: 'I built the new applications on a hexagonal architecture: the domain logic knows nothing about databases or messaging. Adapters for AWS, PostgreSQL and interfaces are interchangeable and can be tested on their own.' },
            { type: 'p', html: 'The department now uses this structure as a template for further applications.' },
            {
              type: 'list',
              items: [
                '6 libraries and applications in Kotlin and Java',
                'Messaging via SQS and SNS, data in S3 and Aurora PostgreSQL',
                'Tests with Testcontainers, WireMock and LocalStack',
              ],
            },
          ],
        },
        {
          eyebrow: 'Result',
          title: 'Faster and more stable',
          blocks: [
            { type: 'p', html: 'All market data is now sent through the new applications, and they also handle its aggregation and summarization. About 10% of the monolith has been replaced, and the remaining part has been running more stably since.' },
            { type: 'p', html: 'In the first load test, the new aggregation processed 70,000 market data records in under a minute. For the legacy system, that was practically out of reach.' },
          ],
        },
        {
          eyebrow: 'Maintainability',
          title: 'So the new system does not become the next legacy system',
          blocks: [
            { type: 'p', html: 'I upgraded the new applications from Java 21 to Java 25 and from Spring Boot 3 to Spring Boot 4, and introduced Renovate. Dependencies have been kept up to date automatically ever since.' },
            monolithStack,
          ],
        },
      ],
    },
    es: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'Sustituir un monolito sin poner en riesgo la operación',
      teaser:
        'Una empresa energética sustituye paso a paso un monolito PHP ya imposible de mantener para la comunicación de mercado. En la prueba de carga, la nueva agregación procesó 70.000 datos de mercado en menos de un minuto.',
      metaDescription:
        'Caso de éxito: sustitución gradual de un monolito PHP en el sector energético con Kotlin, Spring Boot y AWS – arquitectura hexagonal, 70.000 datos de mercado agregados en menos de un minuto en la prueba de carga.',
      lead: 'En una empresa energética, la comunicación de mercado – altas, bajas, lecturas de contadores – pasa por un monolito PHP que se considera imposible de mantener. Hay que sustituirlo sin que la operación se detenga.',
      glance: [
        ['Tarea', 'Sacar del monolito el envío y el procesamiento de los datos de mercado – paso a paso y con el sistema en marcha.'],
        ['Solución', 'Nuevas aplicaciones y librerías en Kotlin y Java con Spring Boot sobre AWS, construidas con arquitectura hexagonal.'],
        ['Resultado', 'Todo el envío de datos de mercado pasa ya por las nuevas aplicaciones. En la prueba de carga, la agregación procesó 70.000 datos en menos de un minuto, y el monolito funciona de forma más estable.'],
      ],
      facts: [
        ['70.000', 'datos de mercado agregados en menos de un minuto en la prueba de carga'],
        ['100 %', 'del envío de datos de mercado pasa por las nuevas aplicaciones'],
        ['6', 'librerías y aplicaciones construidas'],
      ],
      sections: [
        {
          eyebrow: 'Punto de partida',
          title: 'Un sistema que nadie quiere tocar',
          blocks: [
            { type: 'p', html: 'El monolito envía mensajes de mercado a otros participantes del mercado y agrega datos de mercado. Se considera imposible de mantener, y agregar grandes volúmenes de datos era para él una tarea casi imposible.' },
            { type: 'p', html: 'Sustituirlo de una sola vez habría sido demasiado arriesgado. Por eso se sustituye pieza a pieza: cada nueva aplicación asume una parte claramente delimitada.' },
          ],
        },
        {
          eyebrow: 'Arquitectura',
          title: 'Hexagonal – y una plantilla para el departamento',
          blocks: [
            { type: 'p', html: 'Construí las nuevas aplicaciones con arquitectura hexagonal: la lógica de negocio no sabe nada de bases de datos ni de mensajería. Los adaptadores para AWS, PostgreSQL e interfaces son intercambiables y se pueden probar por separado.' },
            { type: 'p', html: 'Hoy el departamento usa esta estructura como plantilla para otras aplicaciones.' },
            {
              type: 'list',
              items: [
                '6 librerías y aplicaciones en Kotlin y Java',
                'Mensajería con SQS y SNS, datos en S3 y Aurora PostgreSQL',
                'Tests con Testcontainers, WireMock y LocalStack',
              ],
            },
          ],
        },
        {
          eyebrow: 'Resultado',
          title: 'Más rápido y más estable',
          blocks: [
            { type: 'p', html: 'Todo el envío de datos de mercado pasa hoy por las nuevas aplicaciones, que también se encargan de su agregación y resumen. Alrededor del 10 % del monolito está sustituido, y la parte restante funciona desde entonces de forma más estable.' },
            { type: 'p', html: 'En la primera prueba de carga, la nueva agregación procesó 70.000 datos de mercado en menos de un minuto. Para el sistema antiguo, eso era prácticamente inalcanzable.' },
          ],
        },
        {
          eyebrow: 'Mantenibilidad',
          title: 'Para que lo nuevo no se convierta en el próximo sistema heredado',
          blocks: [
            { type: 'p', html: 'Actualicé las nuevas aplicaciones de Java 21 a Java 25 y de Spring Boot 3 a Spring Boot 4, e introduje Renovate. Desde entonces, las dependencias se mantienen al día de forma automática.' },
            monolithStack,
          ],
        },
      ],
    },
  },
  storyTariff: {
    de: {
      tags: 'Java · Quarkus · AWS · E-Mobilität',
      title: 'Tarifwechsel in der E-Mobilität – pünktlich zum Jahreswechsel',
      teaser:
        'Zum Jahreswechsel ändern sich die Ladetarife eines Automobilherstellers. Die Umstellung im Abrechnungs-Backend wollte kaum jemand anfassen – ich habe sie als neues Teammitglied übernommen.',
      metaDescription:
        'Success Story: Tarifwechsel im Backend für Abrechnung und Zahlung beim Laden von Elektrofahrzeugen – Java, Quarkus und AWS bei einem Automobilhersteller.',
      lead: 'Ein Automobilhersteller bietet seinen Kunden das Laden von Elektrofahrzeugen an – an Ladestationen und mit einer Lade-App auch zu Hause. Zum Jahreswechsel ändern sich die Tarife, und das Backend für Abrechnung und Zahlung muss pünktlich mitziehen.',
      glance: [
        ['Aufgabe', 'Die neuen Tarife zum Jahreswechsel im Backend für Abrechnung und Zahlung umsetzen.'],
        ['Lösung', 'Umsetzung im Quarkus-Backend, abgesichert durch automatisierte Tests und ausgerollt über GitLab CI, Terraform und AWS.'],
        ['Ergebnis', 'Die neuen Tarife waren zum Jahreswechsel umgesetzt. Nach drei Monaten verantwortete ich die neuen Schnittstellen für neue Funktionen.'],
      ],
      sections: [
        {
          eyebrow: 'Ausgangslage',
          title: 'Eine Aufgabe, die keiner wollte',
          blocks: [
            { type: 'p', html: 'Ein Tarifwechsel betrifft direkt das Geld der Kunden: Jeder Ladevorgang muss zum richtigen Tarif abgerechnet werden, und der Stichtag steht fest. Entsprechend groß war im Team der Respekt vor der Aufgabe.' },
            { type: 'p', html: 'Ich war gerade neu im Team und habe sie direkt übernommen.' },
          ],
        },
        {
          eyebrow: 'Umsetzung',
          title: 'Im Backend für Abrechnung und Zahlung',
          blocks: [
            {
              type: 'list',
              items: [
                'Backend-Services mit Java und Quarkus',
                'Anbindung interner und externer Systeme per REST und OpenAPI',
                'Automatisierte Tests ausgebaut',
                'CI/CD mit GitLab CI, Terraform und AWS',
              ],
            },
          ],
        },
        {
          eyebrow: 'Ergebnis',
          title: 'Vertrauen, das bleibt',
          blocks: [
            { type: 'p', html: 'Die neuen Tarife waren zum Jahreswechsel umgesetzt. Nach drei Monaten verantwortete ich im Scrum-Team mit 8 Personen die neuen Schnittstellen für neue Funktionen.' },
            { type: 'p', html: 'Parallel haben die Teams eine Lade-App für das Laden zu Hause auf die Beine gestellt.' },
            tariffStack,
          ],
        },
      ],
    },
    en: {
      tags: 'Java · Quarkus · AWS · E-mobility',
      title: 'A tariff change in e-mobility – on time for the new year',
      teaser:
        'At the turn of the year, a car maker’s charging tariffs change. Hardly anyone wanted to take on the change in the billing backend – I took it on as a new team member.',
      metaDescription:
        'Success story: tariff change in the billing and payment backend for electric vehicle charging – Java, Quarkus and AWS at a car maker.',
      lead: 'A car maker offers its customers charging for electric vehicles – at charging stations and, with a charging app, at home. At the turn of the year the tariffs change, and the billing and payment backend has to follow on time.',
      glance: [
        ['Task', 'Implement the new tariffs in the billing and payment backend in time for the new year.'],
        ['Solution', 'Implemented in the Quarkus backend, covered by automated tests and rolled out with GitLab CI, Terraform and AWS.'],
        ['Result', 'The new tariffs were in place for the new year. After three months, I was responsible for the new interfaces for new features.'],
      ],
      sections: [
        {
          eyebrow: 'Starting point',
          title: 'A task nobody wanted',
          blocks: [
            { type: 'p', html: 'A tariff change touches customers’ money directly: every charging session has to be billed at the right tariff, and the deadline is fixed. Accordingly, the team had a lot of respect for the task.' },
            { type: 'p', html: 'I had just joined the team and took it on straight away.' },
          ],
        },
        {
          eyebrow: 'Implementation',
          title: 'In the billing and payment backend',
          blocks: [
            {
              type: 'list',
              items: [
                'Backend services with Java and Quarkus',
                'Internal and external systems connected via REST and OpenAPI',
                'Automated tests extended',
                'CI/CD with GitLab CI, Terraform and AWS',
              ],
            },
          ],
        },
        {
          eyebrow: 'Result',
          title: 'Trust that lasts',
          blocks: [
            { type: 'p', html: 'The new tariffs were in place for the new year. After three months, I was responsible for the new interfaces for new features in the eight-person Scrum team.' },
            { type: 'p', html: 'In parallel, the teams built a charging app for charging at home.' },
            tariffStack,
          ],
        },
      ],
    },
    es: {
      tags: 'Java · Quarkus · AWS · Movilidad eléctrica',
      title: 'Cambio de tarifas en la movilidad eléctrica – a tiempo para el año nuevo',
      teaser:
        'Con el cambio de año cambian las tarifas de carga de un fabricante de automóviles. Casi nadie quería encargarse del cambio en el backend de facturación – yo lo asumí como nuevo miembro del equipo.',
      metaDescription:
        'Caso de éxito: cambio de tarifas en el backend de facturación y pago para la carga de vehículos eléctricos – Java, Quarkus y AWS en un fabricante de automóviles.',
      lead: 'Un fabricante de automóviles ofrece a sus clientes la carga de vehículos eléctricos – en estaciones de carga y, con una app de carga, también en casa. Con el cambio de año cambian las tarifas, y el backend de facturación y pago tiene que adaptarse a tiempo.',
      glance: [
        ['Tarea', 'Implementar las nuevas tarifas en el backend de facturación y pago para el cambio de año.'],
        ['Solución', 'Implementación en el backend con Quarkus, asegurada con tests automatizados y desplegada con GitLab CI, Terraform y AWS.'],
        ['Resultado', 'Las nuevas tarifas estaban implementadas para el cambio de año. A los tres meses asumí la responsabilidad de las nuevas interfaces para nuevas funciones.'],
      ],
      sections: [
        {
          eyebrow: 'Punto de partida',
          title: 'Una tarea que nadie quería',
          blocks: [
            { type: 'p', html: 'Un cambio de tarifas afecta directamente al dinero de los clientes: cada carga debe facturarse con la tarifa correcta, y la fecha es fija. Por eso el equipo tenía mucho respeto a la tarea.' },
            { type: 'p', html: 'Yo acababa de incorporarme al equipo y la asumí de inmediato.' },
          ],
        },
        {
          eyebrow: 'Implementación',
          title: 'En el backend de facturación y pago',
          blocks: [
            {
              type: 'list',
              items: [
                'Servicios backend con Java y Quarkus',
                'Integración de sistemas internos y externos mediante REST y OpenAPI',
                'Ampliación de los tests automatizados',
                'CI/CD con GitLab CI, Terraform y AWS',
              ],
            },
          ],
        },
        {
          eyebrow: 'Resultado',
          title: 'Una confianza que perdura',
          blocks: [
            { type: 'p', html: 'Las nuevas tarifas estaban implementadas para el cambio de año. A los tres meses asumí, en el equipo Scrum de 8 personas, la responsabilidad de las nuevas interfaces para nuevas funciones.' },
            { type: 'p', html: 'En paralelo, los equipos pusieron en marcha una app para cargar en casa.' },
            tariffStack,
          ],
        },
      ],
    },
  },
  storyKotlin: {
    de: {
      tags: 'Kotlin · AWS · Open Source',
      title: 'Extended Clients für Kotlin – eine Lücke im AWS-Ökosystem geschlossen',
      teaser:
        'AWS bietet Extended Clients für große SQS- und SNS-Nachrichten nur für Java. Das Kotlin-Gegenstück: rund 730 Zeilen statt Tausender, ohne Jackson, getestet und auf Maven Central.',
      metaDescription:
        'Success Story: Extended Clients für große SQS- und SNS-Nachrichten in Kotlin – KI-gestützt entwickelt, ohne Jackson, lizenzrechtlich geprüft und auf Maven Central.',
      lead: 'AWS bietet Extended Clients für große SQS- und SNS-Nachrichten nur für Java. Ich habe das Gegenstück für Kotlin gebaut: KI-gestützt, idiomatisch, ohne Jackson, lizenzrechtlich geprüft und auf Maven Central veröffentlicht.',
      glance: [
        ['Problem', 'Für große SQS- und SNS-Nachrichten gibt es Bibliotheken von AWS, aber nur für Java. Kotlin-Teams auf dem aws-sdk-kotlin haben kein Gegenstück.'],
        ['Lösung', 'Drei neue Bibliotheken, die für Kotlin entworfen sind: s3overflow, sqsoverflow und snsoverflow.'],
        ['Ergebnis', 'Etwa 730 Zeilen Kotlin statt Tausender Zeilen Java, keine Jackson-Abhängigkeit, lizenzrechtlich geprüft, getestet und auf Maven Central veröffentlicht.'],
      ],
      facts: [
        ['~730', 'Zeilen Kotlin für alle drei Bibliotheken'],
        ['1 Zeile', 'Interface-Delegation statt rund 1150 Zeilen Durchreich-Code'],
        ['8 + 2', 'Methoden mit echter Fachlogik bei SQS und SNS'],
        ['0', 'Jackson-Abhängigkeiten'],
      ],
      sections: [
        {
          eyebrow: 'Ausgangslage',
          title: 'Bewährtes Muster – aber nur für Java',
          blocks: [
            { type: 'p', html: 'Amazon SQS und SNS begrenzen die Größe einer Nachricht. Für größere Nutzlasten gibt es das Claim-Check-Muster: Die Nutzlast liegt in S3, über die Queue läuft nur ein kleiner Verweis darauf. AWS liefert das als fertige Bibliotheken – allerdings nur für das AWS SDK for Java.' },
            { type: 'p', html: 'Kotlin-Teams auf dem aws-sdk-kotlin müssen deshalb entweder ein zweites SDK samt Abhängigkeiten parallel betreiben oder das Muster selbst nachbauen. Dazu kommt: Die Java-Bibliotheken bringen ältere Jackson-Versionen mit, zu denen die GitHub Advisory Database sieben Sicherheitshinweise führt, drei davon als hoch eingestuft.' },
          ],
        },
        {
          eyebrow: 'Entwurf',
          title: 'Übersetzen reicht nicht',
          blocks: [
            { type: 'p', html: 'Den Java-Code Zeile für Zeile zu übersetzen hätte funktioniert, wäre aber schlechtes Kotlin gewesen. Mein Ziel war ein Client, wie man ihn in Kotlin von Anfang an entworfen hätte.' },
            {
              type: 'list',
              items: [
                '<strong>Eine Klasse statt zwei.</strong> Das aws-sdk-kotlin arbeitet mit Coroutines – getrennte Klassen für synchrone und asynchrone Aufrufe sind überflüssig.',
                '<strong>1150 Zeilen Durchreich-Code entfallen.</strong> In Kotlin erledigt das die Interface-Delegation in einer einzigen Zeile.',
                '<strong>Kein Jackson mehr.</strong> Den Verweis auf S3 serialisiert kotlinx.serialization – die Jackson-Hinweise betreffen diesen Code nicht.',
              ],
            },
            {
              type: 'code',
              file: 'SqsExtendedClient.kt',
              html: kotlinClass('// + 7 weitere Methoden mit echter Fachlogik – der Rest des Interfaces', '//   wird von "by sqsClient" automatisch durchgereicht'),
            },
            { type: 'p', html: 'SqsExtendedClient und SnsExtendedClient sind vollwertige Clients des aws-sdk-kotlin und funktionieren überall, wo ein normaler Client erwartet wird.' },
          ],
        },
        {
          eyebrow: 'Arbeitsteilung',
          title: 'KI und Entwickler – klar verteilt',
          blocks: [
            {
              type: 'split',
              left: { title: 'Die KI hat …', items: ['Code nach meinen Vorgaben geschrieben', 'Tests und Boilerplate erzeugt', 'Dokumentation vorformuliert'] },
              right: {
                title: 'Ich habe …',
                items: ['die Architektur festgelegt', 'Jackson durch kotlinx.serialization ersetzt', 'jedes Projekt lizenzrechtlich bewertet', 'Grenzen festgelegt und offen dokumentiert', 'Tests, Build und Veröffentlichung abgesichert'],
              },
            },
            { type: 'p', html: 'Der Kern der drei Bibliotheken entstand an einem Nachmittag. Tests, Lizenzprüfung und Veröffentlichung kamen danach – und genau darin steckt der eigentliche Wert.' },
          ],
        },
        {
          eyebrow: 'Qualität',
          title: 'Lizenzen, Grenzen, Tests',
          blocks: [
            {
              type: 'list',
              items: [
                '<strong>Lizenzen:</strong> s3overflow ist eine unabhängige Neuentwicklung. sqsoverflow und snsoverflow sind als abgeleitete Werke der AWS-Bibliotheken deklariert, mit Attribution in jeder Datei, wie es die Apache-2.0-Lizenz verlangt.',
                '<strong>Grenzen:</strong> Die Kotlin-Clients sind nicht nachrichtenkompatibel mit den Java-Bibliotheken. Das steht offen in der Dokumentation.',
                '<strong>Tests:</strong> Integrationstests prüfen das Verhalten gegen einen lokalen AWS-Emulator. Jede Veröffentlichung trägt einen signierten Herkunftsnachweis.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Ergebnis',
          title: 'Veröffentlicht und einsatzbereit',
          blocks: [
            { type: 'p', html: 'Alle drei Bibliotheken sind quelloffen und auf Maven Central veröffentlicht. Einbinden lassen sie sich mit einer Zeile Gradle:' },
            { type: 'code', file: 'build.gradle.kts', html: gradleLine },
            { type: 'p', html: 'Die Java-Bibliotheken von AWS werden weiter gepflegt und bleiben für Java-Services die richtige Wahl. Die neuen Clients ersetzen sie nicht, sondern schließen eine Lücke für Kotlin.' },
            repoButtons,
            { type: 'p', html: `Technische Details: <a href="${englishPost}" hreflang="en">Large SQS and SNS messages in Kotlin</a> (englisch).` },
          ],
        },
        {
          eyebrow: 'Für Ihr Projekt',
          title: 'Was das für Sie bedeutet',
          blocks: [
            {
              type: 'list',
              items: [
                'Die eigentliche Lücke erkennen, statt Symptome zu verwalten.',
                'Eine Lösung für die Zielplattform entwerfen, statt fremden Code mechanisch zu übertragen.',
                'KI schnell einsetzen und das Ergebnis verantworten – mit Lizenzprüfung, Tests und nachvollziehbarer Veröffentlichung.',
              ],
            },
            { type: 'p', html: 'Fehlt Ihrem Team ein Baustein, den es bisher nur für eine andere Plattform gibt? Sprechen Sie mich an.' },
          ],
        },
      ],
    },
    en: {
      tags: 'Kotlin · AWS · Open Source',
      title: 'Extended clients for Kotlin – closing a gap in the AWS ecosystem',
      teaser:
        'AWS offers extended clients for large SQS and SNS messages for Java only. The Kotlin counterpart: around 730 lines instead of thousands, no Jackson, tested and on Maven Central.',
      metaDescription:
        'Success story: extended clients for large SQS and SNS messages in Kotlin – built with AI assistance, Jackson-free, license-reviewed and published on Maven Central.',
      lead: 'AWS offers extended clients for large SQS and SNS messages for Java only. I built the Kotlin counterpart: AI-assisted, idiomatic, Jackson-free, license-reviewed and published on Maven Central.',
      glance: [
        ['Problem', 'AWS provides libraries for large SQS and SNS messages, but only for Java. Kotlin teams on aws-sdk-kotlin have no counterpart.'],
        ['Solution', 'Three new libraries designed for Kotlin: s3overflow, sqsoverflow and snsoverflow.'],
        ['Result', 'About 730 lines of Kotlin instead of thousands of lines of Java, no Jackson dependency, license-reviewed, tested and published on Maven Central.'],
      ],
      facts: [
        ['~730', 'lines of Kotlin for all three libraries'],
        ['1 line', 'of interface delegation instead of ~1150 lines of pass-through code'],
        ['8 + 2', 'methods with real logic in SQS and SNS'],
        ['0', 'Jackson dependencies'],
      ],
      sections: [
        {
          eyebrow: 'Background',
          title: 'A proven pattern – but only for Java',
          blocks: [
            { type: 'p', html: 'Amazon SQS and SNS limit the size of a message. For larger payloads there is the claim-check pattern: the payload lives in S3 and only a small pointer to it travels through the queue. AWS ships this as ready-made libraries – but only for the AWS SDK for Java.' },
            { type: 'p', html: 'Kotlin teams on aws-sdk-kotlin therefore either run a second SDK with all its dependencies side by side, or rebuild the pattern themselves. On top of that, the Java libraries pull in older Jackson versions for which the GitHub Advisory Database lists seven advisories, three of them rated high.' },
          ],
        },
        {
          eyebrow: 'Design',
          title: 'Translating is not enough',
          blocks: [
            { type: 'p', html: 'Translating the Java code line by line would have worked, but it would have been bad Kotlin. My goal was a client designed the way you would design it in Kotlin from the start.' },
            {
              type: 'list',
              items: [
                '<strong>One class instead of two.</strong> aws-sdk-kotlin is built on coroutines – separate classes for synchronous and asynchronous calls are unnecessary.',
                '<strong>1150 lines of pass-through code disappear.</strong> In Kotlin, interface delegation handles this in a single line.',
                '<strong>No more Jackson.</strong> kotlinx.serialization serializes the S3 pointer – the Jackson advisories do not affect this code.',
              ],
            },
            {
              type: 'code',
              file: 'SqsExtendedClient.kt',
              html: kotlinClass('// + 7 more methods with real logic – the rest of the interface', '//   is forwarded automatically by "by sqsClient"'),
            },
            { type: 'p', html: 'SqsExtendedClient and SnsExtendedClient are full aws-sdk-kotlin clients and work anywhere a regular client is expected.' },
          ],
        },
        {
          eyebrow: 'Division of labor',
          title: 'AI and engineer – clearly divided',
          blocks: [
            {
              type: 'split',
              left: { title: 'The AI …', items: ['wrote code to my specifications', 'generated tests and boilerplate', 'drafted the documentation'] },
              right: {
                title: 'I …',
                items: ['defined the architecture', 'replaced Jackson with kotlinx.serialization', 'reviewed the licensing of each project', 'set limits and documented them openly', 'secured tests, build and release'],
              },
            },
            { type: 'p', html: 'The core of the three libraries was written in one afternoon. Tests, license review and release came afterwards – and that is where the real value lies.' },
          ],
        },
        {
          eyebrow: 'Quality',
          title: 'Licenses, limits, tests',
          blocks: [
            {
              type: 'list',
              items: [
                '<strong>Licenses:</strong> s3overflow is an independent new implementation. sqsoverflow and snsoverflow are declared as derivative works of the AWS libraries, with attribution in every file as the Apache 2.0 license requires.',
                '<strong>Limits:</strong> The Kotlin clients are not wire-compatible with the Java libraries. The documentation states this openly.',
                '<strong>Tests:</strong> Integration tests verify the behavior against a local AWS emulator. Every release carries signed provenance.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Result',
          title: 'Published and ready to use',
          blocks: [
            { type: 'p', html: 'All three libraries are open source and published on Maven Central. Adding one takes a single line of Gradle:' },
            { type: 'code', file: 'build.gradle.kts', html: gradleLine },
            { type: 'p', html: 'The AWS Java libraries are still maintained and remain the right choice for Java services. The new clients do not replace them – they close a gap for Kotlin.' },
            repoButtons,
            { type: 'p', html: `Technical deep dive: <a href="${englishPost}">Large SQS and SNS messages in Kotlin</a>.` },
          ],
        },
        {
          eyebrow: 'For your project',
          title: 'What this means for you',
          blocks: [
            {
              type: 'list',
              items: [
                'Identify the actual gap instead of managing symptoms.',
                'Design a solution for the target platform instead of mechanically porting someone else’s code.',
                'Use AI for speed and own the result – with license review, tests and a traceable release.',
              ],
            },
            { type: 'p', html: 'Is your team missing a building block that so far only exists for another platform? Get in touch.' },
          ],
        },
      ],
    },
    es: {
      tags: 'Kotlin · AWS · Open Source',
      title: 'Extended clients para Kotlin – cerrando un hueco en el ecosistema de AWS',
      teaser:
        'AWS ofrece extended clients para mensajes grandes de SQS y SNS solo para Java. La contraparte en Kotlin: unas 730 líneas en lugar de miles, sin Jackson, con tests y en Maven Central.',
      metaDescription:
        'Caso de éxito: extended clients para mensajes grandes de SQS y SNS en Kotlin – desarrollados con apoyo de IA, sin Jackson, con licencias revisadas y publicados en Maven Central.',
      lead: 'AWS ofrece extended clients para mensajes grandes de SQS y SNS solo para Java. Construí la contraparte para Kotlin: con apoyo de IA, idiomática, sin Jackson, con licencias revisadas y publicada en Maven Central.',
      glance: [
        ['Problema', 'AWS ofrece librerías para mensajes grandes de SQS y SNS, pero solo para Java. Los equipos de Kotlin que usan aws-sdk-kotlin no tienen equivalente.'],
        ['Solución', 'Tres nuevas librerías diseñadas para Kotlin: s3overflow, sqsoverflow y snsoverflow.'],
        ['Resultado', 'Unas 730 líneas de Kotlin en lugar de miles de líneas de Java, sin dependencia de Jackson, con licencias revisadas, con tests y publicadas en Maven Central.'],
      ],
      facts: [
        ['~730', 'líneas de Kotlin para las tres librerías'],
        ['1 línea', 'de delegación de interfaz en lugar de ~1150 líneas de código de reenvío'],
        ['8 + 2', 'métodos con lógica real en SQS y SNS'],
        ['0', 'dependencias de Jackson'],
      ],
      sections: [
        {
          eyebrow: 'Contexto',
          title: 'Un patrón probado – pero solo para Java',
          blocks: [
            { type: 'p', html: 'Amazon SQS y SNS limitan el tamaño de un mensaje. Para payloads más grandes existe el patrón claim-check: el payload se guarda en S3 y por la cola solo viaja una pequeña referencia. AWS lo ofrece como librerías listas para usar – pero solo para el AWS SDK for Java.' },
            { type: 'p', html: 'Por eso, los equipos de Kotlin que usan aws-sdk-kotlin o bien mantienen en paralelo un segundo SDK con todas sus dependencias, o bien reconstruyen el patrón por su cuenta. Además, las librerías Java arrastran versiones antiguas de Jackson para las que la GitHub Advisory Database registra siete avisos de seguridad, tres de ellos de gravedad alta.' },
          ],
        },
        {
          eyebrow: 'Diseño',
          title: 'Traducir no basta',
          blocks: [
            { type: 'p', html: 'Traducir el código Java línea por línea habría funcionado, pero habría sido mal Kotlin. Mi objetivo era un cliente diseñado como se diseñaría en Kotlin desde el principio.' },
            {
              type: 'list',
              items: [
                '<strong>Una clase en lugar de dos.</strong> aws-sdk-kotlin se basa en corrutinas – no hacen falta clases separadas para llamadas síncronas y asíncronas.',
                '<strong>Desaparecen 1150 líneas de código de reenvío.</strong> En Kotlin, la delegación de interfaces lo resuelve en una sola línea.',
                '<strong>Adiós a Jackson.</strong> kotlinx.serialization serializa la referencia a S3 – los avisos de seguridad de Jackson no afectan a este código.',
              ],
            },
            {
              type: 'code',
              file: 'SqsExtendedClient.kt',
              html: kotlinClass('// + 7 métodos más con lógica real – el resto de la interfaz', '//   se reenvía automáticamente con "by sqsClient"'),
            },
            { type: 'p', html: 'SqsExtendedClient y SnsExtendedClient son clientes completos de aws-sdk-kotlin y funcionan en cualquier lugar donde se espere un cliente normal.' },
          ],
        },
        {
          eyebrow: 'Reparto del trabajo',
          title: 'IA e ingeniero – con roles claros',
          blocks: [
            {
              type: 'split',
              left: { title: 'La IA …', items: ['escribió código según mis especificaciones', 'generó tests y boilerplate', 'redactó un primer borrador de la documentación'] },
              right: {
                title: 'Yo …',
                items: ['definí la arquitectura', 'sustituí Jackson por kotlinx.serialization', 'revisé las licencias de cada proyecto', 'fijé los límites y los documenté abiertamente', 'aseguré los tests, el build y la publicación'],
              },
            },
            { type: 'p', html: 'El núcleo de las tres librerías se escribió en una tarde. Los tests, la revisión de licencias y la publicación vinieron después – y ahí está el verdadero valor.' },
          ],
        },
        {
          eyebrow: 'Calidad',
          title: 'Licencias, límites, tests',
          blocks: [
            {
              type: 'list',
              items: [
                '<strong>Licencias:</strong> s3overflow es una implementación nueva e independiente. sqsoverflow y snsoverflow se declaran como obras derivadas de las librerías de AWS, con la atribución en cada archivo que exige la licencia Apache 2.0.',
                '<strong>Límites:</strong> Los clientes de Kotlin no son compatibles a nivel de formato de mensaje con las librerías Java. La documentación lo indica abiertamente.',
                '<strong>Tests:</strong> Los tests de integración verifican el comportamiento contra un emulador local de AWS. Cada versión incluye una procedencia firmada.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Resultado',
          title: 'Publicado y listo para usar',
          blocks: [
            { type: 'p', html: 'Las tres librerías son open source y están publicadas en Maven Central. Para añadirlas basta una línea de Gradle:' },
            { type: 'code', file: 'build.gradle.kts', html: gradleLine },
            { type: 'p', html: 'Las librerías Java de AWS siguen manteniéndose y siguen siendo la opción correcta para servicios Java. Los nuevos clientes no las sustituyen, sino que cierran un hueco para Kotlin.' },
            repoButtons,
            { type: 'p', html: `Detalles técnicos: <a href="${englishPost}" hreflang="en">Large SQS and SNS messages in Kotlin</a> (en inglés).` },
          ],
        },
        {
          eyebrow: 'Para su proyecto',
          title: 'Qué significa esto para usted',
          blocks: [
            {
              type: 'list',
              items: [
                'Identificar el hueco real en lugar de gestionar síntomas.',
                'Diseñar una solución para la plataforma de destino en lugar de portar mecánicamente código ajeno.',
                'Usar la IA para ganar velocidad y responsabilizarse del resultado – con revisión de licencias, tests y una publicación trazable.',
              ],
            },
            { type: 'p', html: '¿A su equipo le falta una pieza que hasta ahora solo existe para otra plataforma? Póngase en contacto conmigo.' },
          ],
        },
      ],
    },
  },
  storyPdf: {
    de: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'PDF-Generierung in Microservice-Landschaften',
      teaser:
        'Ein Microservice erzeugt mehrsprachige PDFs aus HTML-Templates. Templates und Übersetzungen lassen sich ohne Deployment austauschen – mit lizenzfreien Bausteinen wie OpenPDF und Noto.',
      metaDescription:
        'Success Story: mehrsprachige PDF-Generierung als Microservice mit Thymeleaf, Flying Saucer und OpenPDF – Templates und Übersetzungen austauschbar ohne Deployment.',
      lead: 'Ein Kunde wollte seine Microservice-Landschaft um die Erzeugung und Verteilung von PDF-Dokumenten erweitern – mehrsprachig, ohne aufwändige Deployments und ohne Lizenzfallen.',
      glance: [
        ['Aufgabe', 'PDF-Dokumente erzeugen und verteilen – integriert in die bestehende AWS-Systemlandschaft des Kunden.'],
        ['Lösung', 'Ein eigener Microservice erzeugt PDFs aus HTML-Templates mit Thymeleaf, Flying Saucer und OpenPDF und ist per REST angebunden.'],
        ['Ergebnis', 'Templates und Übersetzungen lassen sich ohne Deployment austauschen – mit lizenzfreien Bausteinen für den kommerziellen Einsatz.'],
      ],
      sections: [
        {
          eyebrow: 'Technologie',
          title: 'HTML rein, PDF raus',
          blocks: [
            { type: 'p', html: 'Für die Erzeugung von PDFs aus HTML nutzt das Projekt Flying Saucer. Als PDF-Bibliothek darunter stehen iText 5 oder OpenPDF zur Wahl – die erzeugten Dokumente sind in Größe und Aussehen identisch.' },
            { type: 'p', html: 'Die Empfehlung fiel auf OpenPDF: Es steht unter der LGPL und lässt sich auch in kommerziellen Umgebungen problemlos einsetzen. Zudem hat das Flying-Saucer-Team die Unterstützung für iText 5 im Mai 2024 eingestellt.' },
          ],
        },
        {
          eyebrow: 'Integration',
          title: 'Austauschen ohne Deployment',
          blocks: [
            { type: 'p', html: 'Ein zentraler Wunsch des Kunden: PDF-Vorlagen und Übersetzungen ändern können, ohne jedes Mal neu auszurollen.' },
            {
              type: 'list',
              items: [
                'Ein eigener Microservice übernimmt die PDF-Erzeugung.',
                'Er ist über REST-Schnittstellen an die bestehende AWS-Systemlandschaft angebunden.',
                'HTML-Templates und Übersetzungen liegen in einer Datenbank und werden dynamisch geladen.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Schriftarten',
          title: 'Die unterschätzte Lizenzfrage',
          blocks: [
            { type: 'p', html: 'Besondere Aufmerksamkeit braucht die Schriftart, die in die PDFs eingebettet wird – vor allem bei anderen Alphabeten wie Kyrillisch. Beliebte Schriften wie Arial sind lizenzpflichtig und können erhebliche Kosten verursachen.' },
            { type: 'p', html: 'Die Lösung: die lizenzfreie Schriftfamilie Noto. Sie unterstützt über 800 Sprachen und darf unter der SIL Open Font License frei verteilt werden.' },
          ],
        },
        {
          eyebrow: 'Prototyp',
          title: 'Lauffähig auf GitHub',
          blocks: [
            { type: 'p', html: 'Ein funktionsfähiger Prototyp liegt öffentlich auf GitHub. Er liefert PDFs synchron aus und lässt sich leicht auf eine asynchrone Verteilung umstellen.' },
            pdfStack,
            { type: 'buttons', items: [{ label: 'Prototyp auf GitHub', href: pdfRepo }] },
          ],
        },
      ],
    },
    en: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'PDF generation in microservice landscapes',
      teaser:
        'A microservice renders multilingual PDFs from HTML templates. Templates and translations can be swapped without a deployment – using license-friendly building blocks such as OpenPDF and Noto.',
      metaDescription:
        'Success story: multilingual PDF generation as a microservice with Thymeleaf, Flying Saucer and OpenPDF – templates and translations swappable without a deployment.',
      lead: 'A client wanted to extend their microservice landscape with PDF generation and distribution – multilingual, without costly deployments and without licensing pitfalls.',
      glance: [
        ['Challenge', 'Generate and distribute PDF documents – integrated into the client’s existing AWS landscape.'],
        ['Solution', 'A dedicated microservice renders PDFs from HTML templates with Thymeleaf, Flying Saucer and OpenPDF and is connected via REST.'],
        ['Result', 'Templates and translations can be swapped without a deployment – with building blocks licensed for commercial use.'],
      ],
      sections: [
        {
          eyebrow: 'Technology',
          title: 'HTML in, PDF out',
          blocks: [
            { type: 'p', html: 'The project uses Flying Saucer to turn HTML into PDF. Underneath, either iText 5 or OpenPDF can serve as the PDF library – the resulting documents are identical in size and appearance.' },
            { type: 'p', html: 'The recommendation was OpenPDF: it is licensed under the LGPL and can be used in commercial environments without issues. In addition, the Flying Saucer team ended support for iText 5 in May 2024.' },
          ],
        },
        {
          eyebrow: 'Integration',
          title: 'Swap without deploying',
          blocks: [
            { type: 'p', html: 'A key requirement: change PDF templates and translations without redeploying every time.' },
            {
              type: 'list',
              items: [
                'A dedicated microservice handles PDF generation.',
                'It connects to the existing AWS landscape via REST interfaces.',
                'HTML templates and translations live in a database and are loaded dynamically.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Fonts',
          title: 'The underestimated licensing question',
          blocks: [
            { type: 'p', html: 'The font embedded in the PDFs needs special attention – especially for other scripts such as Cyrillic. Popular fonts like Arial require a license and can cause considerable costs.' },
            { type: 'p', html: 'The solution: the free Noto font family. It supports more than 800 languages and may be redistributed freely under the SIL Open Font License.' },
          ],
        },
        {
          eyebrow: 'Prototype',
          title: 'Up and running on GitHub',
          blocks: [
            { type: 'p', html: 'A working prototype is publicly available on GitHub. It delivers PDFs synchronously and can easily be adapted for asynchronous distribution.' },
            pdfStack,
            { type: 'buttons', items: [{ label: 'Prototype on GitHub', href: pdfRepo }] },
          ],
        },
      ],
    },
    es: {
      tags: 'Kotlin · Java · Spring Boot · AWS',
      title: 'Generación de PDF en entornos de microservicios',
      teaser:
        'Un microservicio genera PDF multilingües a partir de plantillas HTML. Las plantillas y las traducciones se pueden cambiar sin despliegue – con componentes de licencia libre como OpenPDF y Noto.',
      metaDescription:
        'Caso de éxito: generación de PDF multilingüe como microservicio con Thymeleaf, Flying Saucer y OpenPDF – plantillas y traducciones intercambiables sin despliegue.',
      lead: 'Un cliente quería ampliar su entorno de microservicios con la generación y distribución de documentos PDF – en varios idiomas, sin despliegues costosos y sin trampas de licencias.',
      glance: [
        ['Reto', 'Generar y distribuir documentos PDF – integrados en el entorno AWS existente del cliente.'],
        ['Solución', 'Un microservicio propio genera los PDF a partir de plantillas HTML con Thymeleaf, Flying Saucer y OpenPDF y se conecta mediante REST.'],
        ['Resultado', 'Las plantillas y las traducciones se pueden cambiar sin despliegue – con componentes cuya licencia permite el uso comercial.'],
      ],
      sections: [
        {
          eyebrow: 'Tecnología',
          title: 'Entra HTML, sale PDF',
          blocks: [
            { type: 'p', html: 'El proyecto utiliza Flying Saucer para convertir HTML en PDF. Por debajo puede usarse como librería PDF iText 5 u OpenPDF – los documentos resultantes son idénticos en tamaño y aspecto.' },
            { type: 'p', html: 'La recomendación fue OpenPDF: tiene licencia LGPL y puede usarse sin problemas en entornos comerciales. Además, el equipo de Flying Saucer dejó de dar soporte a iText 5 en mayo de 2024.' },
          ],
        },
        {
          eyebrow: 'Integración',
          title: 'Cambiar sin desplegar',
          blocks: [
            { type: 'p', html: 'Un requisito clave: modificar plantillas PDF y traducciones sin tener que desplegar cada vez.' },
            {
              type: 'list',
              items: [
                'Un microservicio propio se encarga de generar los PDF.',
                'Se conecta al entorno AWS existente mediante interfaces REST.',
                'Las plantillas HTML y las traducciones se guardan en una base de datos y se cargan de forma dinámica.',
              ],
            },
          ],
        },
        {
          eyebrow: 'Fuentes',
          title: 'La cuestión de licencias que se subestima',
          blocks: [
            { type: 'p', html: 'La fuente incrustada en los PDF requiere especial atención – sobre todo para otros alfabetos como el cirílico. Fuentes populares como Arial requieren licencia y pueden generar costes considerables.' },
            { type: 'p', html: 'La solución: la familia de fuentes gratuita Noto. Admite más de 800 idiomas y puede redistribuirse libremente bajo la SIL Open Font License.' },
          ],
        },
        {
          eyebrow: 'Prototipo',
          title: 'Funcionando en GitHub',
          blocks: [
            { type: 'p', html: 'Hay un prototipo funcional disponible públicamente en GitHub. Entrega los PDF de forma síncrona y se puede adaptar fácilmente a una distribución asíncrona.' },
            pdfStack,
            { type: 'buttons', items: [{ label: 'Prototipo en GitHub', href: pdfRepo }] },
          ],
        },
      ],
    },
  },
};

export const nextStory: Record<StoryKey, StoryKey> = {
  storyMonolith: 'storyTariff',
  storyTariff: 'storyKotlin',
  storyKotlin: 'storyPdf',
  storyPdf: 'storyMonolith',
};
