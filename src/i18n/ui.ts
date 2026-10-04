export const languages = ['de', 'en'] as const;
export type Lang = (typeof languages)[number];

export type PageKey = 'home' | 'services' | 'storyKotlin' | 'storyPdf' | 'blog' | 'imprint' | 'privacy';

/** URL of every page in every language. Keeps the language switcher and hreflang links in sync. */
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { de: '/', en: '/en/' },
  services: { de: '/leistungen/', en: '/en/services/' },
  storyKotlin: {
    de: '/success-stories/kotlin-extended-clients/',
    en: '/en/success-stories/kotlin-extended-clients/',
  },
  storyPdf: {
    de: '/success-stories/pdf-generierung/',
    en: '/en/success-stories/pdf-generation/',
  },
  /** Blog index; posts live at <blog path><slug>/. */
  blog: { de: '/blog/', en: '/en/blog/' },
  imprint: { de: '/impressum/', en: '/en/legal-notice/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy-policy/' },
};

export const email: Record<Lang, string> = {
  de: 'kontakt@christoph-sens.com',
  en: 'contact@christoph-sens.com',
};

export const external = {
  github: 'https://github.com/christoph-sens',
};

export const ui = {
  de: {
    navLabel: 'Hauptnavigation',
    nav: { home: 'Startseite', services: 'Leistungen', stories: 'Success Stories', blog: 'Blog' },
    navCta: 'Projekt anfragen',
    back: 'Startseite',
    langSwitchLabel: 'Sprache',
    contact: {
      eyebrow: 'Kontakt',
      title: 'Lassen Sie uns über Ihr Backend sprechen.',
      text: 'Schreiben Sie mir kurz, worum es geht. Ich melde mich persönlich und wir finden heraus, ob und wie ich helfen kann.',
      portraitAlt: 'Porträt von Christoph Sens',
      role: 'Ihr direkter Ansprechpartner',
    },
    footer: {
      tagline: 'Kotlin- und Java-Backends auf AWS',
      imprint: 'Impressum',
      privacy: 'Datenschutz',
    },
    legal: {
      imprint: { title: 'Impressum', description: 'Impressum und Anbieterkennzeichnung von christoph-sens.com.' },
      privacy: { title: 'Datenschutzerklärung', description: 'Datenschutzerklärung von christoph-sens.com: Hosting, E-Mail, Server-Logs und Ihre Rechte.' },
    },
    readMore: 'Weiterlesen →',
    nextStory: 'Nächste Success Story',
    blog: {
      title: 'Blog – Christoph Sens',
      description: 'Success Stories und Fachartikel von Christoph Sens zu Kotlin, Java, AWS, Architektur und Softwareentwicklung.',
      heroTitle: 'Success Stories und Fachartikel',
      heroLead: 'Aus echten Projekten: was die Aufgabe war, wie ich sie gelöst habe und was dabei herauskam.',
      sections: { stories: 'Success Stories', articles: 'Fachartikel' },
      anchors: { stories: 'success-stories', articles: 'fachartikel' },
      categories: { 'success-story': 'Success Story', article: 'Fachartikel' },
      updated: 'aktualisiert',
      topics: 'Themen',
      all: 'Alle Beiträge',
      locale: 'de-DE',
    },
  },
  en: {
    navLabel: 'Main navigation',
    nav: { home: 'Home', services: 'Services', stories: 'Success stories', blog: 'Blog' },
    navCta: 'Start a project',
    back: 'Home',
    langSwitchLabel: 'Language',
    contact: {
      eyebrow: 'Contact',
      title: 'Let’s talk about your backend.',
      text: 'Drop me a short note about what you need. I’ll get back to you personally, and together we’ll find out whether and how I can help.',
      portraitAlt: 'Portrait of Christoph Sens',
      role: 'Your direct point of contact',
    },
    footer: {
      tagline: 'Kotlin and Java backends on AWS',
      imprint: 'Legal notice',
      privacy: 'Privacy policy',
    },
    legal: {
      imprint: { title: 'Legal notice', description: 'Legal notice (Impressum) of christoph-sens.com.' },
      privacy: { title: 'Privacy policy', description: 'Privacy policy of christoph-sens.com: hosting, email, server logs and your rights.' },
    },
    readMore: 'Read more →',
    nextStory: 'Next success story',
    blog: {
      title: 'Blog – Christoph Sens',
      description: 'Success stories and articles by Christoph Sens on Kotlin, Java, AWS, architecture and software development.',
      heroTitle: 'Success stories and articles',
      heroLead: 'From real projects: what the task was, how I solved it and what came out of it.',
      sections: { stories: 'Success stories', articles: 'Articles' },
      anchors: { stories: 'success-stories', articles: 'articles' },
      categories: { 'success-story': 'Success story', article: 'Article' },
      updated: 'updated',
      topics: 'Topics',
      all: 'All posts',
      locale: 'en-GB',
    },
  },
} as const satisfies Record<Lang, unknown>;
