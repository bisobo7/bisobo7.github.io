// src/data/business.js
// Single source of truth for NAP (Name / Address / Phone) + business facts.
// EVERYTHING on the site (footer, contact page, schema) reads from here —
// change it once, it changes everywhere, and it must match Google Business
// Profile and citations byte-for-byte.

export const business = {
  name: 'Dixie Auto Land',
  legalName: 'Dixie Auto Land',
  domain: 'https://dixieauto.land',
  phone: '(586) 237-8440', // TODO: confirm — a local (989) number would lift local SEO + call rates
  phoneHref: 'tel:+15862378440',
  email: '', // add when ready, e.g. sales@dixieauto.land
  address: {
    street: '4285 Dixie Hwy',
    city: 'Saginaw',
    state: 'MI',
    zip: '48601',
  },
  geo: { lat: 43.3805, lng: -83.8916 }, // approx — verify against GBP pin
  hours: [
    { days: 'Monday - Friday', open: '9:00 AM', close: '7:00 PM', schema: 'Mo-Fr 09:00-19:00' },
    { days: 'Saturday', open: '10:00 AM', close: '5:00 PM', schema: 'Sa 10:00-17:00' },
    { days: 'Sunday', open: null, close: null, schema: null }, // closed
  ],
  mapsUrl: 'https://maps.google.com/?q=4285+Dixie+Hwy,+Saginaw,+MI+48601',
  // Only REAL profiles belong here (schema sameAs). Leave empty until verified.
  socials: [],
  // Web3Forms access key for the contact/inquiry forms.
  // Get a free key at https://web3forms.com (takes 1 minute) and paste it here.
  web3formsKey: 'YOUR_WEB3FORMS_ACCESS_KEY',
  clarityId: 'y6ztry5dwf',
};

export const seo = {
  titleSuffix: '| Dixie Auto Land - Saginaw, MI',
  defaultDescription:
    'Quality used cars, trucks & SUVs for sale in Saginaw, MI — plus OEM used parts sourced from 1,000+ yards nationwide. Stop by 4285 Dixie Hwy or call today.',
};
