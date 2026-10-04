/** The first language is the default: it is served without a path prefix and is the hreflang x-default. */
export const languages = ['en', 'de', 'es'] as const;
export const defaultLang = languages[0];
export type Lang = (typeof languages)[number];

export type PageKey = 'home' | 'services' | 'storyKotlin' | 'storyPdf' | 'blog' | 'imprint' | 'privacy';

/** URL of every page in every language. Keeps the language switcher and hreflang links in sync. */
export const routes: Record<PageKey, Record<Lang, string>> = {
  home: { en: '/', de: '/de/', es: '/es/' },
  services: { en: '/services/', de: '/de/leistungen/', es: '/es/servicios/' },
  storyKotlin: {
    en: '/success-stories/kotlin-extended-clients/',
    de: '/de/success-stories/kotlin-extended-clients/',
    es: '/es/casos-de-exito/kotlin-extended-clients/',
  },
  storyPdf: {
    en: '/success-stories/pdf-generation/',
    de: '/de/success-stories/pdf-generierung/',
    es: '/es/casos-de-exito/generacion-de-pdf/',
  },
  /** Blog index; posts live at <blog path><slug>/. */
  blog: { en: '/blog/', de: '/de/blog/', es: '/es/blog/' },
  imprint: { en: '/legal-notice/', de: '/de/impressum/', es: '/es/aviso-legal/' },
  privacy: { en: '/privacy-policy/', de: '/de/datenschutz/', es: '/es/politica-de-privacidad/' },
};

export const email: Record<Lang, string> = {
  de: 'kontakt@christoph-sens.com',
  en: 'contact@christoph-sens.com',
  es: 'contact@christoph-sens.com',
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
    ogLocale: 'de_DE',
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
    ogLocale: 'en_US',
  },
  es: {
    navLabel: 'Navegación principal',
    nav: { home: 'Inicio', services: 'Servicios', stories: 'Casos de éxito', blog: 'Blog' },
    navCta: 'Solicitar proyecto',
    back: 'Inicio',
    langSwitchLabel: 'Idioma',
    contact: {
      eyebrow: 'Contacto',
      title: 'Hablemos de su backend.',
      text: 'Escríbame brevemente de qué se trata. Le responderé personalmente y veremos juntos si puedo ayudarle y cómo.',
      portraitAlt: 'Retrato de Christoph Sens',
      role: 'Su contacto directo',
    },
    footer: {
      tagline: 'Backends en Kotlin y Java sobre AWS',
      imprint: 'Aviso legal',
      privacy: 'Privacidad',
    },
    legal: {
      imprint: { title: 'Aviso legal', description: 'Aviso legal (Impressum) de christoph-sens.com.' },
      privacy: { title: 'Política de privacidad', description: 'Política de privacidad de christoph-sens.com: alojamiento, correo electrónico, registros del servidor y sus derechos.' },
    },
    readMore: 'Leer más →',
    nextStory: 'Siguiente caso de éxito',
    blog: {
      title: 'Blog – Christoph Sens',
      description: 'Casos de éxito y artículos técnicos de Christoph Sens sobre Kotlin, Java, AWS, arquitectura y desarrollo de software.',
      heroTitle: 'Casos de éxito y artículos técnicos',
      heroLead: 'De proyectos reales: cuál era el reto, cómo lo resolví y qué resultado se obtuvo.',
      sections: { stories: 'Casos de éxito', articles: 'Artículos técnicos' },
      anchors: { stories: 'casos-de-exito', articles: 'articulos' },
      categories: { 'success-story': 'Caso de éxito', article: 'Artículo técnico' },
      updated: 'actualizado',
      topics: 'Temas',
      all: 'Todas las entradas',
      locale: 'es-ES',
    },
    ogLocale: 'es_ES',
  },
} as const satisfies Record<Lang, unknown>;
