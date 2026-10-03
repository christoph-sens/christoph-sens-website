export const languages = ['de', 'en'] as const;
export type Lang = (typeof languages)[number];

export type PageKey = 'home' | 'services' | 'storyKotlin' | 'storyPdf';

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
};

export const email: Record<Lang, string> = {
  de: 'kontakt@christoph-sens.com',
  en: 'contact@christoph-sens.com',
};

export const external = {
  github: 'https://github.com/christoph-sens',
  blog: 'https://www.christoph-sens.com/blog',
  successStories: 'https://www.christoph-sens.com/blog/categories/success-story',
  impressum: 'https://www.christoph-sens.com/impressum',
  datenschutz: 'https://www.christoph-sens.com/datenschutz',
};

export const ui = {
  de: {
    navLabel: 'Hauptnavigation',
    nav: { home: 'Startseite', services: 'Leistungen', stories: 'Success Stories' },
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
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
    },
    readMore: 'Weiterlesen →',
    nextStory: 'Nächste Success Story',
  },
  en: {
    navLabel: 'Main navigation',
    nav: { home: 'Home', services: 'Services', stories: 'Success stories' },
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
      impressum: 'Legal notice',
      datenschutz: 'Privacy policy',
    },
    readMore: 'Read more →',
    nextStory: 'Next success story',
  },
} as const satisfies Record<Lang, unknown>;
