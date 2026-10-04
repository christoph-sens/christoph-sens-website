import type { Lang } from '../i18n/ui';

export type ServiceIcon = 'code' | 'cloud' | 'spark';

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
  openSource: { eyebrow: string; title: string; button: string; intro: string; libs: { name: string; text: string }[] };
  stories: { eyebrow: string; title: string; button: string; more: string };
}

export const homePage: Record<Lang, HomePage> = {
  de: {
    metaTitle: 'Christoph Sens – Kotlin, Java & Spring Boot auf AWS',
    metaDescription:
      'Freelance Backend Engineer für Kotlin, Java, Spring Boot und AWS. KI-gestützt im Tempo, menschlich in Architektur, Review und Verantwortung – mit über 15 Jahren Erfahrung.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends, die unter Last ruhig bleiben.',
      lead: 'Ich entwickle Kotlin- und Java-Backends mit Spring Boot auf AWS – KI-gestützt im Tempo, menschlich in Architektur, Review und Verantwortung. Mit über 15 Jahren Erfahrung.',
      primary: 'Erstgespräch vereinbaren',
      secondary: 'Success Stories ansehen',
      codeComment: '// Große Payloads? Landen automatisch in S3.',
    },
    facts: [
      ['15+', 'Jahre Backend-Erfahrung'],
      ['Kotlin & Java', 'mit Spring Boot auf der JVM zu Hause'],
      ['AWS', 'SQS, SNS, S3 und mehr'],
      ['3 Libraries', 'Open Source auf Maven Central'],
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
          bullets: ['Spring-Boot-Services & REST-APIs', 'Java-zu-Kotlin-Modernisierung', 'Testautomatisierung'],
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
      eyebrow: '02 — Arbeitsweise',
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
      eyebrow: '03 — Open Source',
      title: 'Code, den Sie sich vorher ansehen können.',
      button: 'Alle Projekte auf GitHub',
      intro:
        'Extended Clients für aws-sdk-kotlin: Sie lagern große SQS- und SNS-Nachrichten automatisch in S3 aus – abgeleitet von den AWS-Java-Libraries, gebaut für Kotlin und Coroutines.',
      libs: [
        { name: 's3overflow', text: 'Das Fundament: Payload-Store auf S3, auf dem die anderen Clients aufbauen.' },
        { name: 'sqsoverflow', text: 'Extended Client für Amazon SQS – Nachrichten über dem Limit gehen transparent nach S3.' },
        { name: 'snsoverflow', text: 'Extended Client für Amazon SNS – kombinierbar mit sqsoverflow für Fan-out-Szenarien.' },
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
      'Freelance backend engineer for Kotlin, Java, Spring Boot and AWS. AI-assisted for speed, human for architecture, review and accountability – with more than 15 years of experience.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends that stay calm under load.',
      lead: 'I build Kotlin and Java backends with Spring Boot on AWS – AI-assisted for speed, human for architecture, review and accountability. With more than 15 years of experience.',
      primary: 'Book an intro call',
      secondary: 'See success stories',
      codeComment: '// Large payloads? They go to S3 automatically.',
    },
    facts: [
      ['15+', 'years of backend experience'],
      ['Kotlin & Java', 'at home on the JVM with Spring Boot'],
      ['AWS', 'SQS, SNS, S3 and more'],
      ['3 Libraries', 'open source on Maven Central'],
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
          bullets: ['Spring Boot services & REST APIs', 'Java-to-Kotlin modernization', 'Test automation'],
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
      eyebrow: '02 — How I work',
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
      eyebrow: '03 — Open Source',
      title: 'Code you can inspect before you hire me.',
      button: 'All projects on GitHub',
      intro:
        'Extended clients for aws-sdk-kotlin: they automatically offload large SQS and SNS messages to S3 – derived from the AWS Java libraries, built for Kotlin and coroutines.',
      libs: [
        { name: 's3overflow', text: 'The foundation: an S3 payload store the other clients build on.' },
        { name: 'sqsoverflow', text: 'Extended client for Amazon SQS – messages above the size limit go to S3 transparently.' },
        { name: 'snsoverflow', text: 'Extended client for Amazon SNS – combine it with sqsoverflow for fan-out scenarios.' },
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
      'Ingeniero backend freelance para Kotlin, Java, Spring Boot y AWS. Con apoyo de IA para la velocidad, con criterio humano para la arquitectura, la revisión y la responsabilidad – con más de 15 años de experiencia.',
    hero: {
      eyebrow: 'Freelance Backend Engineer · Kotlin · Java · Spring Boot · AWS',
      title: 'Backends que mantienen la calma bajo carga.',
      lead: 'Desarrollo backends en Kotlin y Java con Spring Boot sobre AWS – con apoyo de IA para la velocidad, con criterio humano para la arquitectura, la revisión y la responsabilidad. Con más de 15 años de experiencia.',
      primary: 'Concertar una primera llamada',
      secondary: 'Ver casos de éxito',
      codeComment: '// ¿Payloads grandes? Van a S3 automáticamente.',
    },
    facts: [
      ['15+', 'años de experiencia en backend'],
      ['Kotlin y Java', 'en casa en la JVM con Spring Boot'],
      ['AWS', 'SQS, SNS, S3 y más'],
      ['3 librerías', 'open source en Maven Central'],
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
          bullets: ['Servicios Spring Boot y APIs REST', 'Modernización de Java a Kotlin', 'Automatización de tests'],
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
      eyebrow: '02 — Forma de trabajar',
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
      eyebrow: '03 — Open Source',
      title: 'Código que puede revisar antes de contratarme.',
      button: 'Todos los proyectos en GitHub',
      intro:
        'Extended clients para aws-sdk-kotlin: trasladan automáticamente los mensajes grandes de SQS y SNS a S3 – derivados de las librerías Java de AWS, creados para Kotlin y corrutinas.',
      libs: [
        { name: 's3overflow', text: 'La base: un payload store en S3 sobre el que se construyen los demás clientes.' },
        { name: 'sqsoverflow', text: 'Extended client para Amazon SQS – los mensajes que superan el límite pasan a S3 de forma transparente.' },
        { name: 'snsoverflow', text: 'Extended client para Amazon SNS – combinable con sqsoverflow en escenarios de fan-out.' },
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
