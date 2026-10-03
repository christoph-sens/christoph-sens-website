export const languages = ['de', 'en'] as const;
export type Lang = (typeof languages)[number];

export type PageKey = 'home' | 'services' | 'storyKotlin' | 'storyPdf' | 'imprint' | 'privacy';

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
  imprint: { de: '/impressum/', en: '/en/legal-notice/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy-policy/' },
};

export const email: Record<Lang, string> = {
  de: 'kontakt@christoph-sens.com',
  en: 'contact@christoph-sens.com',
};

export const external = {
  github: 'https://github.com/christoph-sens',
  blog: 'https://www.christoph-sens.com/blog',
  successStories: 'https://www.christoph-sens.com/blog/categories/success-story',
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
      imprint: 'Impressum',
      privacy: 'Datenschutz',
    },
    legal: {
      imprint: { title: 'Impressum', description: 'Impressum und Anbieterkennzeichnung von christoph-sens.com.' },
      privacy: { title: 'Datenschutzerklärung', description: 'Datenschutzerklärung von christoph-sens.com: Hosting, E-Mail, Server-Logs und Ihre Rechte.' },
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
      imprint: 'Legal notice',
      privacy: 'Privacy policy',
    },
    legal: {
      imprint: { title: 'Legal notice', description: 'Legal notice (Impressum) of christoph-sens.com.' },
      privacy: { title: 'Privacy policy', description: 'Privacy policy of christoph-sens.com: hosting, email, server logs and your rights.' },
    },
    readMore: 'Read more →',
    nextStory: 'Next success story',
  },
} as const satisfies Record<Lang, unknown>;
