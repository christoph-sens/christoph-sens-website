import type { Lang } from '../i18n/ui';
import type { StoryKey } from './stories';

export interface Service {
  title: string;
  text: string;
  tasks: string[];
  example?: { label: string; story: StoryKey };
  dark?: boolean;
}

export interface ServicesPage {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lead: string;
  tasksLabel: string;
  services: Service[];
  techLabel: string;
}

export const technologies = [
  'Kotlin', 'Java', 'Spring Boot', 'Spring Data', 'Hibernate', 'aws-sdk-kotlin', 'Amazon SQS', 'Amazon SNS', 'Amazon S3',
  'PostgreSQL', 'Docker', 'Docker Compose', 'Testcontainers', 'JUnit', 'Rest Assured', 'Gradle', 'Maven',
];

export const servicesPage: Record<Lang, ServicesPage> = {
  de: {
    metaTitle: 'Leistungen – Christoph Sens',
    metaDescription:
      'Backend-Entwicklung mit Kotlin und Java, AWS-Architektur, Modernisierung bestehender Systeme und KI-gestützte Entwicklung – von Christoph Sens.',
    eyebrow: 'Leistungen',
    title: 'Backend-Entwicklung, die geprüft ist und im Betrieb läuft.',
    lead: 'Kotlin, Java und AWS – mit KI für das Tempo und einem erfahrenen Entwickler für Architektur, Review und Verantwortung. Ich unterstütze Ihr Team dort, wo es gerade Verstärkung braucht.',
    tasksLabel: 'Typische Aufgaben',
    techLabel: 'Technologien',
    services: [
      {
        title: 'Backend-Entwicklung mit Kotlin und Java',
        text: 'Neue Services und Erweiterungen bestehender Systeme – mit sauberen Schnittstellen, durchdachten Datenmodellen und Tests, die wirklich etwas absichern.',
        tasks: ['Neue Microservices und REST-APIs', 'Spring Boot, Spring Data und Hibernate', 'Datenbanken wie PostgreSQL', 'Testautomatisierung mit JUnit, Testcontainers und Rest Assured'],
        example: { label: 'Beispiel: PDF-Generierung in Microservice-Landschaften →', story: 'storyPdf' },
      },
      {
        title: 'AWS und ereignisgetriebene Architektur',
        text: 'Systeme, die über Queues und Topics kommunizieren, skalieren gut – wenn die Details stimmen. Ich entwerfe und baue solche Lösungen auf AWS.',
        tasks: ['Messaging mit Amazon SQS und SNS', 'Große Nachrichten über S3 auslagern (Claim-Check-Muster)', 'Anbindung an bestehende AWS-Landschaften', 'Integrationstests gegen einen lokalen AWS-Emulator'],
        example: { label: 'Beispiel: Extended Clients für Kotlin →', story: 'storyKotlin' },
      },
      {
        title: 'Modernisierung bestehender Systeme',
        text: 'Ältere Systeme schrittweise auf einen aktuellen Stand bringen, ohne den Betrieb zu gefährden – mit klaren Entscheidungen statt mechanischer Übersetzung.',
        tasks: ['Java-Code nach Kotlin überführen', 'Abhängigkeiten mit Sicherheitshinweisen ablösen', 'Lizenzrechtliche Prüfung eingesetzter Bibliotheken', 'Technologieauswahl mit Prototypen absichern'],
      },
      {
        title: 'KI-gestützte Entwicklung',
        text: 'KI schreibt schnell Code. Prüfen, entscheiden und die Verantwortung tragen muss ein Mensch. Genau diese Aufteilung bringe ich in Ihr Projekt.',
        tasks: ['KI schreibt Code, Tests und Boilerplate nach klaren Vorgaben', 'Ich lege die Architektur fest und prüfe jede Änderung', 'Lizenzprüfung, Tests und nachvollziehbare Veröffentlichung', 'KI-Workflows für Ihr Team einführen'],
        example: { label: 'Beispiel: drei Bibliotheken, KI-gestützt entwickelt →', story: 'storyKotlin' },
        dark: true,
      },
    ],
  },
  en: {
    metaTitle: 'Services – Christoph Sens',
    metaDescription:
      'Backend development with Kotlin and Java, AWS architecture, modernizing existing systems and AI-assisted development – by Christoph Sens.',
    eyebrow: 'Services',
    title: 'Backend development that is reviewed and runs in production.',
    lead: 'Kotlin, Java and AWS – with AI for speed and an experienced engineer for architecture, review and accountability. I support your team wherever it needs reinforcement right now.',
    tasksLabel: 'Typical tasks',
    techLabel: 'Technologies',
    services: [
      {
        title: 'Backend development with Kotlin and Java',
        text: 'New services and extensions to existing systems – with clean interfaces, well-designed data models and tests that genuinely protect something.',
        tasks: ['New microservices and REST APIs', 'Spring Boot, Spring Data and Hibernate', 'Databases such as PostgreSQL', 'Test automation with JUnit, Testcontainers and Rest Assured'],
        example: { label: 'Example: PDF generation in microservice landscapes →', story: 'storyPdf' },
      },
      {
        title: 'AWS and event-driven architecture',
        text: 'Systems that communicate via queues and topics scale well – if the details are right. I design and build such solutions on AWS.',
        tasks: ['Messaging with Amazon SQS and SNS', 'Offloading large messages to S3 (claim-check pattern)', 'Integration with existing AWS landscapes', 'Integration tests against a local AWS emulator'],
        example: { label: 'Example: extended clients for Kotlin →', story: 'storyKotlin' },
      },
      {
        title: 'Modernizing existing systems',
        text: 'Bringing older systems up to date step by step without putting operations at risk – with clear decisions instead of mechanical translation.',
        tasks: ['Migrating Java code to Kotlin', 'Replacing dependencies that carry security advisories', 'License review of the libraries in use', 'Validating technology choices with prototypes'],
      },
      {
        title: 'AI-assisted development',
        text: 'AI writes code fast. Reviewing, deciding and taking responsibility is a human’s job. That is exactly the split I bring to your project.',
        tasks: ['AI writes code, tests and boilerplate to clear specifications', 'I define the architecture and review every change', 'License review, tests and traceable releases', 'Introducing AI workflows to your team'],
        example: { label: 'Example: three libraries, built with AI assistance →', story: 'storyKotlin' },
        dark: true,
      },
    ],
  },
};
