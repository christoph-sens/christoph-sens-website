import type { Lang } from '../i18n/ui';

export type ServiceIcon = 'code' | 'cloud' | 'refresh' | 'spark';

export interface HomePage {
  metaTitle: string;
  metaDescription: string;
  hero: { eyebrow: string; title: string; lead: string; primary: string; secondary: string; codeComment: string };
  facts: [value: string, label: string][];
  services: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { icon: ServiceIcon; title: string; text: string; bullets: string[]; dark?: boolean }[];
    more: string;
  };
  process: { eyebrow: string; title: string; titleMuted: string; steps: { title: string; text: string }[] };
  openSource: { eyebrow: string; title: string; button: string; intro: string; libs: { group: string; name: string; text: string; href: string }[] };
  stories: { eyebrow: string; title: string; button: string; more: string };
}

export const homePage: Record<Lang, HomePage> = {
  de: {
    metaTitle: 'Christoph Sens – Kotlin, Java & Spring Boot auf AWS',
    metaDescription:
      'Freelance Backend Engineer für Kotlin, Java, Spring Boot und AWS. KI-gestützt im Tempo, menschlich in Architektur, Review und Verantwortung – mit über 10 Jahren Erfahrung.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends, die unter Last ruhig bleiben.',
      lead: 'Ich entwickle Kotlin- und Java-Backends mit Spring Boot auf AWS – KI-gestützt im Tempo, menschlich in Architektur, Review und Verantwortung. Mit über 10 Jahren Erfahrung.',
      primary: 'Erstgespräch vereinbaren',
      secondary: 'Success Stories ansehen',
      codeComment: '// Große Payloads? Landen automatisch in S3.',
    },
    facts: [
      ['10+', 'Jahre in der Softwareentwicklung'],
      ['70.000', 'Marktdaten im Lasttest in unter einer Minute aggregiert'],
      ['Kotlin & Java', 'mit Spring Boot auf AWS'],
      ['4 Libraries', 'Open Source auf Maven Central'],
    ],
    services: {
      eyebrow: '01 — Leistungen',
      title: 'Vom ersten Entwurf bis zum stabilen Betrieb.',
      intro: 'Ich steige dort ein, wo Ihr Team Verstärkung braucht – als Entwickler, Architekt oder beides.',
      items: [
        {
          icon: 'code',
          title: 'Backend-Entwicklung',
          text: 'Robuste Services in Kotlin und Java: saubere APIs, durchdachte Datenmodelle, Tests, die etwas absichern.',
          bullets: ['Spring-Boot-Services & REST-APIs', 'Kotlin und Java 25', 'Testautomatisierung'],
        },
        {
          icon: 'refresh',
          title: 'Modernisierung',
          text: 'Altsysteme schrittweise ablösen, ohne den Betrieb zu gefährden – zuletzt bei einem Monolithen in der Energiewirtschaft: Die neue Aggregation verarbeitet im Lasttest 70.000 Marktdaten in unter einer Minute.',
          bullets: ['Schrittweise Ablösung von Monolithen', 'Hexagonale Architektur', 'Java- und Spring-Boot-Upgrades'],
        },
        {
          icon: 'cloud',
          title: 'AWS-Architektur',
          text: 'Ereignisgetriebene Systeme, die skalieren und bezahlbar bleiben – mit Messaging, Storage und Infrastruktur als Code.',
          bullets: ['SQS, SNS & S3', 'Event-driven Architecture', 'Architektur-Reviews'],
        },
        {
          icon: 'spark',
          title: 'KI-gestützte Entwicklung',
          text: 'Ich nutze KI dort, wo sie Tempo bringt – und behalte Architektur, Code-Review und Verantwortung selbst in der Hand.',
          bullets: ['Schneller zum lauffähigen Stand', 'Jede Zeile menschlich geprüft', 'KI-Workflows fürs Team'],
          dark: true,
        },
      ],
      more: 'Alle Leistungen im Detail →',
    },
    process: {
      eyebrow: '03 — Arbeitsweise',
      title: 'KI für das Tempo.',
      titleMuted: 'Ein Mensch für die Verantwortung.',
      steps: [
        { title: 'Erstgespräch', text: 'Wir klären Ziel, Ausgangslage und Rahmen – unverbindlich und konkret.' },
        { title: 'Analyse & Architektur', text: 'Ich schaue mir Code und Infrastruktur an und schlage einen klaren Weg vor.' },
        { title: 'Umsetzung', text: 'In kurzen Iterationen, mit sichtbaren Ergebnissen und sauberem Review.' },
        { title: 'Übergabe', text: 'Dokumentiert und verständlich, damit Ihr Team selbstständig weitermacht.' },
      ],
    },
    openSource: {
      eyebrow: '02 — Open Source & Standards',
      title: 'Code und Standards, die Sie nachprüfen können.',
      button: 'Alle Projekte auf GitHub',
      intro:
        'Ich arbeite öffentlich: an eigenen Libraries auf Maven Central und an den Standards, auf denen sie aufbauen – von der offiziellen Testsuite für JSONPath (RFC 9535) bis zu Jakarta JSON Processing.',
      libs: [
        { group: 'Eclipse · Jakarta EE', name: 'parsson', text: 'Fix für einen seit 2020 offenen Fehler in Eclipse Parsson, einer Implementierung von Jakarta JSON Processing – gemergt.', href: 'https://github.com/eclipse-ee4j/parsson/pull/174' },
        { group: 'RFC 9535 · JSONPath', name: 'compliance test suite', text: 'Neue Testfälle für die offizielle Testsuite des JSONPath-Standards – gemergt.', href: 'https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/121' },
        { group: 'io.github.treetrail', name: 'treetrail', text: 'JSONPath nach RFC 9535 für Java. Version 1.0 besteht alle Fälle der offiziellen Testsuite.', href: 'https://github.com/treetrail/treetrail' },
        { group: 'Jakarta EE', name: 'jsonp-api', text: 'Vorschlag: JSONPath als Teil von Jakarta JSON Processing – mit Implementierungen und TCK.', href: 'https://github.com/jakartaee/jsonp-api/issues/448' },
        { group: 'com.christoph-sens', name: '*overflow', text: 's3overflow, sqsoverflow und snsoverflow – Extended Clients für aws-sdk-kotlin: Große SQS- und SNS-Nachrichten wandern automatisch nach S3.', href: 'https://github.com/christoph-sens' },
      ],
    },
    stories: {
      eyebrow: '04 — Success Stories',
      title: 'Ergebnisse aus echten Projekten.',
      button: 'Alle Success Stories',
      more: 'Weitere Fachartikel im Blog →',
    },
  },
  en: {
    metaTitle: 'Christoph Sens – Kotlin, Java & Spring Boot on AWS',
    metaDescription:
      'Freelance backend engineer for Kotlin, Java, Spring Boot and AWS. AI-assisted for speed, human for architecture, review and accountability – with more than 10 years of experience.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends that stay calm under load.',
      lead: 'I build Kotlin and Java backends with Spring Boot on AWS – AI-assisted for speed, human for architecture, review and accountability. With more than 10 years of experience.',
      primary: 'Book an intro call',
      secondary: 'See success stories',
      codeComment: '// Large payloads? They go to S3 automatically.',
    },
    facts: [
      ['10+', 'years in software development'],
      ['70,000', 'market data records aggregated in under a minute in a load test'],
      ['Kotlin & Java', 'with Spring Boot on AWS'],
      ['4 Libraries', 'open source on Maven Central'],
    ],
    services: {
      eyebrow: '01 — Services',
      title: 'From first draft to stable operation.',
      intro: 'I step in wherever your team needs support – as developer, architect or both.',
      items: [
        {
          icon: 'code',
          title: 'Backend development',
          text: 'Robust services in Kotlin and Java: clean APIs, well-designed data models, tests that actually protect something.',
          bullets: ['Spring Boot services & REST APIs', 'Kotlin and Java 25', 'Test automation'],
        },
        {
          icon: 'refresh',
          title: 'Modernization',
          text: 'Replacing legacy systems step by step without putting operations at risk – most recently a monolith in the energy sector: in a load test, the new aggregation processed 70,000 market data records in under a minute.',
          bullets: ['Step-by-step monolith replacement', 'Hexagonal architecture', 'Java and Spring Boot upgrades'],
        },
        {
          icon: 'cloud',
          title: 'AWS architecture',
          text: 'Event-driven systems that scale and stay affordable – with messaging, storage and infrastructure as code.',
          bullets: ['SQS, SNS & S3', 'Event-driven Architecture', 'Architecture reviews'],
        },
        {
          icon: 'spark',
          title: 'AI-assisted development',
          text: 'I use AI where it adds speed – and keep architecture, code review and accountability firmly in my own hands.',
          bullets: ['Faster to working software', 'Every line reviewed by a human', 'AI workflows for your team'],
          dark: true,
        },
      ],
      more: 'All services in detail →',
    },
    process: {
      eyebrow: '03 — How I work',
      title: 'AI for speed.',
      titleMuted: 'A human for accountability.',
      steps: [
        { title: 'Intro call', text: 'We clarify goals, starting point and scope – concrete and without obligation.' },
        { title: 'Analysis & architecture', text: 'I review code and infrastructure and propose a clear path forward.' },
        { title: 'Delivery', text: 'In short iterations, with visible results and thorough review.' },
        { title: 'Handover', text: 'Documented and easy to follow, so your team can carry on independently.' },
      ],
    },
    openSource: {
      eyebrow: '02 — Open Source & Standards',
      title: 'Code and standards you can check before you hire me.',
      button: 'All projects on GitHub',
      intro:
        'I work in the open: on my own libraries on Maven Central and on the standards they build on – from the official JSONPath test suite (RFC 9535) to Jakarta JSON Processing.',
      libs: [
        { group: 'Eclipse · Jakarta EE', name: 'parsson', text: 'Fix for a bug open since 2020 in Eclipse Parsson, an implementation of Jakarta JSON Processing – merged.', href: 'https://github.com/eclipse-ee4j/parsson/pull/174' },
        { group: 'RFC 9535 · JSONPath', name: 'compliance test suite', text: 'New test cases for the official test suite of the JSONPath standard – merged.', href: 'https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/121' },
        { group: 'io.github.treetrail', name: 'treetrail', text: 'RFC 9535 JSONPath for Java. Version 1.0 passes every case of the official test suite.', href: 'https://github.com/treetrail/treetrail' },
        { group: 'Jakarta EE', name: 'jsonp-api', text: 'Proposal: JSONPath as part of Jakarta JSON Processing – with implementations and a TCK.', href: 'https://github.com/jakartaee/jsonp-api/issues/448' },
        { group: 'com.christoph-sens', name: '*overflow', text: 's3overflow, sqsoverflow and snsoverflow – extended clients for aws-sdk-kotlin: large SQS and SNS messages move to S3 automatically.', href: 'https://github.com/christoph-sens' },
      ],
    },
    stories: {
      eyebrow: '04 — Success Stories',
      title: 'Results from real projects.',
      button: 'All success stories',
      more: 'More articles on the blog →',
    },
  },
  es: {
    metaTitle: 'Christoph Sens – Kotlin, Java y Spring Boot sobre AWS',
    metaDescription:
      'Ingeniero backend freelance para Kotlin, Java, Spring Boot y AWS. Con apoyo de IA para la velocidad, con criterio humano para la arquitectura, la revisión y la responsabilidad – con más de 10 años de experiencia.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends que mantienen la calma bajo carga.',
      lead: 'Desarrollo backends en Kotlin y Java con Spring Boot sobre AWS – con apoyo de IA para la velocidad, con criterio humano para la arquitectura, la revisión y la responsabilidad. Con más de 10 años de experiencia.',
      primary: 'Concertar una primera llamada',
      secondary: 'Ver casos de éxito',
      codeComment: '// ¿Payloads grandes? Van a S3 automáticamente.',
    },
    facts: [
      ['10+', 'años en desarrollo de software'],
      ['70.000', 'datos de mercado agregados en menos de un minuto en la prueba de carga'],
      ['Kotlin y Java', 'con Spring Boot sobre AWS'],
      ['4 librerías', 'open source en Maven Central'],
    ],
    services: {
      eyebrow: '01 — Servicios',
      title: 'Del primer borrador a una operación estable.',
      intro: 'Me incorporo allí donde su equipo necesita refuerzo – como desarrollador, como arquitecto o como ambos.',
      items: [
        {
          icon: 'code',
          title: 'Desarrollo backend',
          text: 'Servicios robustos en Kotlin y Java: APIs limpias, modelos de datos bien pensados y tests que realmente protegen algo.',
          bullets: ['Servicios Spring Boot y APIs REST', 'Kotlin y Java 25', 'Automatización de tests'],
        },
        {
          icon: 'refresh',
          title: 'Modernización',
          text: 'Sustituir sistemas heredados paso a paso sin poner en riesgo la operación – recientemente un monolito del sector energético: en la prueba de carga, la nueva agregación procesó 70.000 datos de mercado en menos de un minuto.',
          bullets: ['Sustitución gradual de monolitos', 'Arquitectura hexagonal', 'Actualizaciones de Java y Spring Boot'],
        },
        {
          icon: 'cloud',
          title: 'Arquitectura en AWS',
          text: 'Sistemas orientados a eventos que escalan y siguen siendo asequibles – con mensajería, almacenamiento e infraestructura como código.',
          bullets: ['SQS, SNS y S3', 'Arquitectura orientada a eventos', 'Revisiones de arquitectura'],
        },
        {
          icon: 'spark',
          title: 'Desarrollo con apoyo de IA',
          text: 'Uso la IA donde aporta velocidad – y mantengo en mis manos la arquitectura, la revisión del código y la responsabilidad.',
          bullets: ['Software funcionando antes', 'Cada línea revisada por una persona', 'Flujos de trabajo con IA para su equipo'],
          dark: true,
        },
      ],
      more: 'Todos los servicios en detalle →',
    },
    process: {
      eyebrow: '03 — Forma de trabajar',
      title: 'IA para la velocidad.',
      titleMuted: 'Una persona para la responsabilidad.',
      steps: [
        { title: 'Primera llamada', text: 'Aclaramos objetivos, punto de partida y marco – de forma concreta y sin compromiso.' },
        { title: 'Análisis y arquitectura', text: 'Reviso el código y la infraestructura y propongo un camino claro.' },
        { title: 'Implementación', text: 'En iteraciones cortas, con resultados visibles y una revisión cuidadosa.' },
        { title: 'Traspaso', text: 'Documentado y comprensible, para que su equipo pueda continuar de forma autónoma.' },
      ],
    },
    openSource: {
      eyebrow: '02 — Open Source y estándares',
      title: 'Código y estándares que puede comprobar antes de contratarme.',
      button: 'Todos los proyectos en GitHub',
      intro:
        'Trabajo en abierto: en mis propias librerías en Maven Central y en los estándares sobre los que se construyen – desde la suite de tests oficial de JSONPath (RFC 9535) hasta Jakarta JSON Processing.',
      libs: [
        { group: 'Eclipse · Jakarta EE', name: 'parsson', text: 'Corrección de un error abierto desde 2020 en Eclipse Parsson, una implementación de Jakarta JSON Processing – integrada.', href: 'https://github.com/eclipse-ee4j/parsson/pull/174' },
        { group: 'RFC 9535 · JSONPath', name: 'compliance test suite', text: 'Nuevos casos de prueba para la suite de tests oficial del estándar JSONPath – integrados.', href: 'https://github.com/jsonpath-standard/jsonpath-compliance-test-suite/pull/121' },
        { group: 'io.github.treetrail', name: 'treetrail', text: 'JSONPath según RFC 9535 para Java. La versión 1.0 supera todos los casos de la suite de tests oficial.', href: 'https://github.com/treetrail/treetrail' },
        { group: 'Jakarta EE', name: 'jsonp-api', text: 'Propuesta: JSONPath como parte de Jakarta JSON Processing – con implementaciones y TCK.', href: 'https://github.com/jakartaee/jsonp-api/issues/448' },
        { group: 'com.christoph-sens', name: '*overflow', text: 's3overflow, sqsoverflow y snsoverflow – extended clients para aws-sdk-kotlin: los mensajes grandes de SQS y SNS pasan a S3 automáticamente.', href: 'https://github.com/christoph-sens' },
      ],
    },
    stories: {
      eyebrow: '04 — Casos de éxito',
      title: 'Resultados de proyectos reales.',
      button: 'Todos los casos de éxito',
      more: 'Más artículos en el blog →',
    },
  },
};
