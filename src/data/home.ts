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
      button: 'All success stories (German)',
      more: 'More articles on the blog (German) →',
    },
  },
};
