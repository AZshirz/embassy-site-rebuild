// Flattens the site's content into search entries. The site publishes this as /search-index.json
// at build time (see pages/search-index.json.ts) and the API reads it to answer /search queries,
// so the API never holds a second copy of the content.

import { LANGS, type Lang, home, visas, citizens, education, ui, embassy } from './content';

export interface SearchEntry { lang: Lang; url: string; title: string; section: string; text: string }

const prefix = (lang: Lang, path: string) => (lang === 'en' ? path : `/az${path}`);

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const lang of LANGS) {
    const h = home[lang];
    const add = (url: string, title: string, section: string, parts: (string | undefined)[]) => {
      const text = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      if (text) entries.push({ lang, url, title, section, text });
    };

    // Home. Each section gets its own anchor so results and citations point at the right place.
    const homeUrl = prefix(lang, '/');
    const u = ui[lang];
    add(homeUrl, h.title, h.heroTitle, [h.heroText]);
    add(`${homeUrl}#needs-heading`, h.title, h.needTitle, h.needs.map((c) => `${c.title}. ${c.text}`));
    add(`${homeUrl}#news-heading`, h.title, h.newsTitle, h.news.map((n) => n.title));
    // Contact details as real text: address, phone, fax, opening hours per day, emergency numbers.
    const hoursText = embassy.hours.map((hh, i) => `${u.hours.days[i]}: ${hh ? `${hh.open}–${hh.close}` : u.hours.closed}`).join('; ');
    add(`${homeUrl}#contact`, h.title, h.contactTitle, [
      `${h.addressLabel}: ${embassy.name}, ${embassy.address.street}, ${embassy.address.postal} ${embassy.address.city}, ${embassy.address.country}.`,
      `${h.phoneLabel}: ${embassy.phone}. ${h.faxLabel}: ${embassy.fax}.`,
      `${u.hours.title}: ${hoursText}. ${u.hours.timezone}`,
      `${u.emergency.title}. ${u.emergency.inAz}: ${embassy.phone}. ${u.emergency.afterHours}: ${embassy.afterHoursPhone}. ${u.emergency.fromUs}: ${embassy.fromUsPhone}.`,
    ]);
    add(`${homeUrl}#leaders-heading`, h.title, h.leadersTitle, [...h.leaders, ...h.governmentLeaders].map((l) => `${l.name}, ${l.role}. ${l.bio}`));
    add(`${homeUrl}#reports-heading`, h.title, h.reportsTitle, h.reports.map((r) => r.label));

    // Visas
    const v = visas[lang];
    const visasUrl = prefix(lang, '/visas/');
    add(visasUrl, v.title, v.noticeTitle, v.notices);
    add(`${visasUrl}#what-is-a-visa`, v.title, v.whatTitle, v.whatText);
    add(`${visasUrl}#how-to-apply`, v.title, v.stepsTitle, v.steps.map((s) => `${s.title}. ${s.text}`));
    add(`${visasUrl}#tips`, v.title, v.tipsTitle, v.tips.map((t) => `${t.title}. ${t.text}`));
    add(`${visasUrl}#types`, v.title, v.typesTitle, v.types.map((c) => `${c.title}. ${c.text}`));
    add(`${visasUrl}#contact`, v.title, v.contactTitle, [
      v.contactText, `${v.contactEmailLabel}: ${embassy.visaEmail}.`,
      `${h.phoneLabel}. ${v.contactAzLabel}: ${v.contactAz}. ${v.contactUsLabel}: ${v.contactUs}.`,
    ]);
    add(`${visasUrl}#rights`, v.title, v.rightsTitle, v.rights.map((c) => `${c.title}. ${c.text}`));

    // Citizen services and Education share the same section/card shape
    for (const [page, path] of [[citizens[lang], '/citizen-services/'], [education[lang], '/education/']] as const) {
      const url = prefix(lang, path);
      add(url, page.title, page.title, [page.lead]);
      for (const s of page.sections) {
        add(`${url}#${s.id}`, page.title, s.title, [s.intro, ...s.cards.map((c) => `${c.title}. ${c.text}`)]);
      }
    }
  }
  return entries;
}
