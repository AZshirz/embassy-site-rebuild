// All site text lives here, keyed by language. Page templates only read from this file,
// so editing content never requires touching a component.
//
// Source of the English text: the public U.S. Embassy in Azerbaijan website (az.usembassy.gov),
// which is U.S. Government work and in the public domain. Azerbaijani text is a translation
// made for this rebuild and should be reviewed by a native speaker before any real use.

export type Lang = 'en' | 'az';
export const LANGS: Lang[] = ['en', 'az'];

export interface Link { label: string; href: string; external?: boolean }
export interface Card { title: string; text: string; link: Link }
export interface Section { id: string; title: string; intro?: string; cards: Card[] }

// ---------- Shared chrome (banner, header, footer, emergency box) ----------

export const ui = {
  en: {
    siteName: 'U.S. Embassy in Azerbaijan',
    siteNameShort: 'U.S. Embassy Baku',
    skip: 'Skip to main content',
    bannerOfficial: 'An official website of the United States government',
    bannerHow: "Here's how you know",
    bannerDotGov: 'Official websites use .gov',
    bannerDotGovText: 'A .gov website belongs to an official government organization in the United States.',
    bannerHttps: 'Secure .gov websites use HTTPS',
    bannerHttpsText: 'A lock or https:// means you\'ve safely connected to the .gov website. Share sensitive information only on official, secure websites.',
    menu: 'Menu',
    search: 'Search',
    language: 'Language',
    langSwitchLabel: 'Azərbaycan dili',
    langSwitchHref: '/az/',
    emergencyButton: 'Emergency',
    primaryNav: [
      { label: 'Home', href: '/' },
      { label: 'U.S. Visas', href: '/visas/' },
      { label: 'Citizen Services', href: '/citizen-services/' },
      { label: 'Education & Exchanges', href: '/education/' },
      { label: 'Contact', href: '/#contact' },
    ] as Link[],
    otherEmbassies: 'Find another U.S. embassy or consulate',
    otherEmbassiesHref: 'https://www.usembassy.gov/',
    footerLinks: [
      { label: 'White House', href: 'https://www.whitehouse.gov/', external: true },
      { label: 'Department of State', href: 'https://www.state.gov/', external: true },
      { label: 'Privacy Policy', href: 'https://www.state.gov/privacy-policy/', external: true },
      { label: 'FOIA', href: 'https://foia.state.gov/', external: true },
      { label: 'No FEAR Act', href: 'https://www.state.gov/no-fear-act/', external: true },
      { label: 'Accessibility Statement', href: 'https://www.state.gov/accessibility-statement/', external: true },
    ] as Link[],
    identifierIntro: 'An official website of the',
    identifierAgency: 'U.S. Department of State',
    identifierRequired: 'Looking for U.S. government information and services?',
    identifierVisit: 'Visit USA.gov',
    backToTop: 'Return to top',
    externalLink: '(opens in a new tab)',
    lastReviewed: 'Content last reviewed',
    translationNote: 'This page is a translation. Where a translation is not yet available, the English text is shown.',
    onThisPage: 'On this page',
    emergency: {
      title: 'Emergency assistance for U.S. citizens',
      inAz: 'In Azerbaijan, call',
      afterHours: 'Outside office hours',
      fromUs: 'From the United States',
      more: 'All emergency contacts',
      moreHref: '/citizen-services/#emergency',
    },
    hours: {
      title: 'Hours of operation',
      openNow: 'Open now',
      closedNow: 'Closed now',
      closed: 'Closed',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      timezone: 'All times are Baku local time (AZT, UTC+4).',
    },
  },
  az: {
    siteName: 'ABŞ-ın Azərbaycandakı Səfirliyi',
    siteNameShort: 'ABŞ Səfirliyi, Bakı',
    skip: 'Əsas məzmuna keç',
    bannerOfficial: 'Amerika Birləşmiş Ştatları hökumətinin rəsmi veb-saytı',
    bannerHow: 'Bunu necə bilmək olar',
    bannerDotGov: 'Rəsmi veb-saytlar .gov domenindən istifadə edir',
    bannerDotGovText: '.gov veb-saytı Amerika Birləşmiş Ştatlarında rəsmi dövlət təşkilatına məxsusdur.',
    bannerHttps: 'Təhlükəsiz .gov veb-saytları HTTPS istifadə edir',
    bannerHttpsText: 'Kilid işarəsi və ya https:// .gov veb-saytına təhlükəsiz qoşulduğunuzu bildirir. Həssas məlumatları yalnız rəsmi, təhlükəsiz veb-saytlarda paylaşın.',
    menu: 'Menyu',
    search: 'Axtarış',
    language: 'Dil',
    langSwitchLabel: 'English',
    langSwitchHref: '/',
    emergencyButton: 'Təcili',
    primaryNav: [
      { label: 'Ana səhifə', href: '/az/' },
      { label: 'ABŞ vizaları', href: '/az/visas/' },
      { label: 'Vətəndaş xidmətləri', href: '/az/citizen-services/' },
      { label: 'Təhsil və mübadilə', href: '/az/education/' },
      { label: 'Əlaqə', href: '/az/#contact' },
    ] as Link[],
    otherEmbassies: 'Başqa ABŞ səfirliyi və ya konsulluğu tapın',
    otherEmbassiesHref: 'https://www.usembassy.gov/',
    footerLinks: [
      { label: 'Ağ Ev', href: 'https://www.whitehouse.gov/', external: true },
      { label: 'Dövlət Departamenti', href: 'https://www.state.gov/', external: true },
      { label: 'Məxfilik siyasəti', href: 'https://www.state.gov/privacy-policy/', external: true },
      { label: 'FOIA', href: 'https://foia.state.gov/', external: true },
      { label: 'No FEAR Act', href: 'https://www.state.gov/no-fear-act/', external: true },
      { label: 'Əlçatanlıq bəyanatı', href: 'https://www.state.gov/accessibility-statement/', external: true },
    ] as Link[],
    identifierIntro: 'Rəsmi veb-saytı:',
    identifierAgency: 'ABŞ Dövlət Departamenti',
    identifierRequired: 'ABŞ hökuməti haqqında məlumat və xidmətlər axtarırsınız?',
    identifierVisit: 'USA.gov saytına keçin',
    backToTop: 'Yuxarı qayıt',
    externalLink: '(yeni pəncərədə açılır)',
    lastReviewed: 'Məzmun son dəfə yoxlanılıb',
    translationNote: 'Bu səhifə tərcümədir. Tərcümə hələ mövcud olmayan yerlərdə ingilis dilindəki mətn göstərilir.',
    onThisPage: 'Bu səhifədə',
    emergency: {
      title: 'ABŞ vətəndaşları üçün təcili yardım',
      inAz: 'Azərbaycandan zəng edin',
      afterHours: 'İş saatlarından kənar',
      fromUs: 'Amerika Birləşmiş Ştatlarından',
      more: 'Bütün təcili əlaqə nömrələri',
      moreHref: '/az/citizen-services/#emergency',
    },
    hours: {
      title: 'İş saatları',
      openNow: 'Hazırda açıqdır',
      closedNow: 'Hazırda bağlıdır',
      closed: 'Bağlıdır',
      days: ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar'],
      timezone: 'Bütün vaxtlar Bakı yerli vaxtı ilədir (AZT, UTC+4).',
    },
  },
} as const;

// ---------- Site-wide alerts (shown under the header on every page) ----------
// In Phase 2 these come from a scheduled job that reads the travel.state.gov advisory feed;
// for now they mirror what the original site showed on 2026-09-20.

export interface SiteAlert { kind: 'advisory' | 'caution'; label: string; text: string; link: Link }

export const alerts: Record<Lang, SiteAlert[]> = {
  en: [
    { kind: 'advisory', label: 'Travel Advisory Level 3', text: 'Reconsider travel to Azerbaijan.',
      link: { label: 'Read the advisory', href: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/azerbaijan-travel-advisory.html', external: true } },
    { kind: 'caution', label: 'Worldwide Caution', text: 'The Department of State advises Americans worldwide to exercise increased caution.',
      link: { label: 'Read the worldwide caution', href: 'https://travel.state.gov/content/travel/en/traveladvisories/ea/worldwide-caution.html', external: true } },
  ],
  az: [
    { kind: 'advisory', label: 'Səyahət xəbərdarlığı: 3-cü səviyyə', text: 'Azərbaycana səyahəti yenidən nəzərdən keçirin.',
      link: { label: 'Xəbərdarlığı oxuyun', href: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/azerbaijan-travel-advisory.html', external: true } },
    { kind: 'caution', label: 'Qlobal xəbərdarlıq', text: 'Dövlət Departamenti bütün dünyadakı amerikalılara artan ehtiyatlılıq göstərməyi tövsiyə edir.',
      link: { label: 'Qlobal xəbərdarlığı oxuyun', href: 'https://travel.state.gov/content/travel/en/traveladvisories/ea/worldwide-caution.html', external: true } },
  ],
};

// ---------- Facts that do not change with language ----------

export const embassy = {
  name: 'U.S. Embassy in Baku',
  address: { street: '111 Azadlig Ave', postal: 'AZ1007', city: 'Baku', country: 'Azerbaijan' },
  phone: '+994 12 488 3300',
  phoneHref: 'tel:+994124883300',
  fax: '+994 12 488 3330',
  afterHoursPhone: '+1 202 647 5225',
  afterHoursHref: 'tel:+12026475225',
  fromUsPhone: '1 888 407 4747',
  fromUsHref: 'tel:+18884074747',
  visaEmail: 'support-azerbaijan@usvisascheduling.com',
  // 0 = Monday ... 6 = Sunday. null = closed. Times are 24h local (Asia/Baku).
  hours: [
    { open: '08:30', close: '17:30' },
    { open: '08:30', close: '17:30' },
    { open: '08:30', close: '17:30' },
    { open: '08:30', close: '17:30' },
    { open: '08:30', close: '17:30' },
    null,
    null,
  ] as ({ open: string; close: string } | null)[],
  timezone: 'Asia/Baku',
  geo: { lat: 40.3777, lng: 49.8536 },
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/usembassybaku' },
    { label: 'X (Twitter)', href: 'https://x.com/USEmbassyBaku' },
    { label: 'Instagram', href: 'https://www.instagram.com/usembassybaku/' },
    { label: 'YouTube', href: 'https://www.youtube.com/user/usembassybaku' },
  ] as Link[],
  originalSite: 'https://az.usembassy.gov/',
  contentReviewed: '2026-09-20',
  // Photos are official U.S. Government work from the original site, resized by tools/optimize_images.py
  photos: {
    hero: { base: '/img/photos/hero-azeta', widths: [800, 1600], width: 1600, height: 700 },
    leaders: { 'Amy Carlon': '/img/photos/carlon-320.webp', 'Sujata Sharma': '/img/photos/sharma-320.webp' } as Record<string, string>,
  },
};

// ---------- Home page ----------

export const home = {
  en: {
    title: 'Home',
    heroTitle: 'U.S. Embassy in Azerbaijan',
    heroText: 'Advancing the interests of the United States and serving and protecting U.S. citizens in Azerbaijan.',
    heroAlt: 'Embassy staff and partners celebrate 30 years of partnership between AzETA and the U.S. Embassy, with U.S. and Azerbaijani flags',
    needTitle: 'I need…',
    moreTitle: 'More services',
    moreLinks: [
      { label: 'Job opportunities', href: 'https://az.usembassy.gov/jobs/', external: true },
      { label: 'News & events', href: 'https://az.usembassy.gov/news-events/', external: true },
      { label: 'Holiday calendar', href: 'https://az.usembassy.gov/holiday-calendar/', external: true },
      { label: 'Air quality monitor', href: 'https://www.airnow.gov/international/us-embassies-and-consulates/#Azerbaijan$Baku', external: true },
      { label: 'Business', href: 'https://az.usembassy.gov/business/', external: true },
    ] as Link[],
    newsTitle: 'Embassy news',
    news: [
      { title: 'Chargé d\'Affaires Amy Carlon celebrated 30 years of partnership between AzETA and the U.S. Embassy', img: '/img/photos/news-azeta-480.webp', alt: 'Three women join hands over a table at an outdoor AzETA 30th-anniversary event', href: 'https://az.usembassy.gov/news-events/', external: true },
      { title: 'Chargé d\'Affaires Amy Carlon and the Head of Ismayilli Executive Power discussed regional development and bilateral cooperation', img: '/img/photos/news-ismayilli-480.webp', alt: 'Delegations meet across a long conference table with U.S. and Azerbaijani flags', href: 'https://az.usembassy.gov/news-events/', external: true },
      { title: 'Chargé d\'Affaires Amy Carlon visited the Coca-Cola production facility in Ismayilli', img: '/img/photos/news-cocacola-480.webp', alt: 'Embassy delegation in high-visibility vests meets with plant staff at a conference table', href: 'https://az.usembassy.gov/news-events/', external: true },
    ],
    washingtonTitle: 'News from Washington',
    washingtonSource: 'ShareAmerica',
    washington: [
      { title: 'Look at the words: How the Constitution fulfills a promise', date: '2026-09-15', href: 'https://share.america.gov/', external: true },
      { title: 'Rebuilding America\'s manufacturing workforce', date: '2026-09-11', href: 'https://share.america.gov/', external: true },
      { title: 'When baseball fields became the home of the brave', date: '2026-09-09', href: 'https://share.america.gov/', external: true },
    ],
    needs: [
      { title: 'A U.S. visa', text: 'Visit, study, work in, or immigrate to the United States.', link: { label: 'Visa information', href: '/visas/' } },
      { title: 'A U.S. passport', text: 'Renew, replace, or apply for a passport while abroad.', link: { label: 'Passport services', href: 'https://travel.state.gov/content/travel/en/passports.html', external: true } },
      { title: 'Emergency assistance', text: 'Help for U.S. citizens facing an emergency in Azerbaijan.', link: { label: 'Emergency contacts', href: '/citizen-services/#emergency' } },
      { title: 'Alerts for U.S. citizens', text: 'Enroll in STEP to receive safety and security updates.', link: { label: 'Sign up for alerts', href: 'https://step.state.gov/', external: true } },
      { title: 'A document notarized', text: 'Notarial services are available by appointment.', link: { label: 'Notarial services', href: '/citizen-services/#passports' } },
      { title: 'To study in the U.S.', text: 'EducationUSA advising and exchange programs.', link: { label: 'Education & exchanges', href: '/education/' } },
    ] as Card[],
    leadersTitle: 'Mission leaders',
    leaders: [
      { name: 'Amy Carlon', role: 'Chargé d\'affaires', bio: 'Amy Carlon assumed duties as Deputy Chief of Mission at the U.S. Embassy in Baku on June 23, 2025. She is a member of the Senior Foreign Service at the U.S. Department of State.' },
      { name: 'Sujata Sharma', role: 'Deputy Chief of Mission', bio: 'Sujata Sharma is the Deputy Chief of Mission at the U.S. Embassy in Baku. Most recently she served as Deputy Director for Caucasus Affairs.' },
    ],
    contactTitle: 'Location and contact information',
    addressLabel: 'Address',
    phoneLabel: 'Phone',
    faxLabel: 'Fax',
    followLabel: 'Follow the embassy',
    mapLink: 'Open in OpenStreetMap',
    reportsTitle: 'U.S. Department of State reports',
    reports: [
      { label: '2025 Trafficking in Persons Report', href: 'https://www.state.gov/trafficking-in-persons-report/', external: true, img: '/img/photos/report-tip-240.webp', width: 120, height: 156 },
      { label: '2024 Country Report on Human Rights Practices', href: 'https://www.state.gov/reports/2024-country-reports-on-human-rights-practices/', external: true, img: '/img/photos/report-hrr-240.webp', width: 120, height: 147 },
      { label: '2023 Report on International Religious Freedom', href: 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/', external: true, img: '/img/photos/report-irf-240.webp', width: 120, height: 160 },
    ],
    policyTitle: 'Policy and history',
    policyText: 'Learn about U.S.–Azerbaijan policy and the history of the embassy.',
    policyLink: { label: 'U.S. relations with Azerbaijan', href: 'https://www.state.gov/u-s-relations-with-azerbaijan/', external: true },
  },
  az: {
    title: 'Ana səhifə',
    heroTitle: 'ABŞ-ın Azərbaycandakı Səfirliyi',
    heroText: 'Amerika Birləşmiş Ştatlarının maraqlarını irəli aparmaq, Azərbaycandakı ABŞ vətəndaşlarına xidmət göstərmək və onları qorumaq.',
    heroAlt: 'Səfirlik əməkdaşları və tərəfdaşlar ABŞ və Azərbaycan bayraqları önündə AzETA ilə ABŞ Səfirliyi arasında 30 illik tərəfdaşlığı qeyd edir',
    needTitle: 'Mənə lazımdır…',
    moreTitle: 'Digər xidmətlər',
    moreLinks: [
      { label: 'İş imkanları', href: 'https://az.usembassy.gov/jobs/', external: true },
      { label: 'Xəbərlər və tədbirlər', href: 'https://az.usembassy.gov/news-events/', external: true },
      { label: 'Bayram təqvimi', href: 'https://az.usembassy.gov/holiday-calendar/', external: true },
      { label: 'Hava keyfiyyəti monitoru', href: 'https://www.airnow.gov/international/us-embassies-and-consulates/#Azerbaijan$Baku', external: true },
      { label: 'Biznes', href: 'https://az.usembassy.gov/business/', external: true },
    ] as Link[],
    newsTitle: 'Səfirlik xəbərləri',
    news: [
      { title: 'Müvəqqəti işlər vəkili Emi Karlon AzETA ilə ABŞ Səfirliyi arasında 30 illik tərəfdaşlığı qeyd etdi', img: '/img/photos/news-azeta-480.webp', alt: 'AzETA-nın 30 illik yubileyi tədbirində üç qadın masa üzərində əl-ələ tutur', href: 'https://az.usembassy.gov/news-events/', external: true },
      { title: 'Müvəqqəti işlər vəkili Emi Karlon və İsmayıllı Rayon İcra Hakimiyyətinin başçısı regionun inkişafını və ikitərəfli əməkdaşlığı müzakirə etdi', img: '/img/photos/news-ismayilli-480.webp', alt: 'Nümayəndə heyətləri ABŞ və Azərbaycan bayraqları olan uzun masa arxasında görüşür', href: 'https://az.usembassy.gov/news-events/', external: true },
      { title: 'Müvəqqəti işlər vəkili Emi Karlon İsmayıllıdakı Coca-Cola istehsalat müəssisəsini ziyarət etdi', img: '/img/photos/news-cocacola-480.webp', alt: 'Səfirlik nümayəndə heyəti işıqqaytaran jiletlərdə müəssisə əməkdaşları ilə masa arxasında görüşür', href: 'https://az.usembassy.gov/news-events/', external: true },
    ],
    washingtonTitle: 'Vaşinqtondan xəbərlər',
    washingtonSource: 'ShareAmerica',
    washington: [
      { title: 'Look at the words: How the Constitution fulfills a promise', date: '2026-09-15', href: 'https://share.america.gov/', external: true },
      { title: 'Rebuilding America\'s manufacturing workforce', date: '2026-09-11', href: 'https://share.america.gov/', external: true },
      { title: 'When baseball fields became the home of the brave', date: '2026-09-09', href: 'https://share.america.gov/', external: true },
    ],
    needs: [
      { title: 'ABŞ vizası', text: 'Amerika Birləşmiş Ştatlarına səfər, təhsil, iş və ya immiqrasiya.', link: { label: 'Viza məlumatı', href: '/az/visas/' } },
      { title: 'ABŞ pasportu', text: 'Xaricdə pasportu yeniləyin, dəyişdirin və ya yeni pasport üçün müraciət edin.', link: { label: 'Pasport xidmətləri', href: 'https://travel.state.gov/content/travel/en/passports.html', external: true } },
      { title: 'Təcili yardım', text: 'Azərbaycanda təcili vəziyyətlə üzləşən ABŞ vətəndaşlarına kömək.', link: { label: 'Təcili əlaqə nömrələri', href: '/az/citizen-services/#emergency' } },
      { title: 'ABŞ vətəndaşları üçün xəbərdarlıqlar', text: 'Təhlükəsizlik xəbərdarlıqları almaq üçün STEP proqramına qeydiyyatdan keçin.', link: { label: 'Xəbərdarlıqlara abunə olun', href: 'https://step.state.gov/', external: true } },
      { title: 'Sənədin notarial təsdiqi', text: 'Notariat xidmətləri əvvəlcədən qeydiyyatla göstərilir.', link: { label: 'Notariat xidmətləri', href: '/az/citizen-services/#passports' } },
      { title: 'ABŞ-da təhsil almaq', text: 'EducationUSA məsləhət xidməti və mübadilə proqramları.', link: { label: 'Təhsil və mübadilə', href: '/az/education/' } },
    ] as Card[],
    leadersTitle: 'Missiya rəhbərləri',
    leaders: [
      { name: 'Amy Carlon', role: 'Müvəqqəti işlər vəkili', bio: 'Amy Carlon 2025-ci il iyunun 23-də ABŞ-ın Bakıdakı Səfirliyində missiya rəhbərinin müavini vəzifəsinə başlayıb. O, ABŞ Dövlət Departamentinin Ali Xarici Xidmətinin üzvüdür.' },
      { name: 'Sujata Sharma', role: 'Missiya rəhbərinin müavini', bio: 'Sujata Sharma ABŞ-ın Bakıdakı Səfirliyində missiya rəhbərinin müavinidir. Bundan əvvəl Qafqaz məsələləri üzrə direktor müavini vəzifəsində çalışıb.' },
    ],
    contactTitle: 'Ünvan və əlaqə məlumatı',
    addressLabel: 'Ünvan',
    phoneLabel: 'Telefon',
    faxLabel: 'Faks',
    followLabel: 'Səfirliyi izləyin',
    mapLink: 'OpenStreetMap-də açın',
    reportsTitle: 'ABŞ Dövlət Departamentinin hesabatları',
    reports: [
      { label: 'İnsan alveri üzrə 2025-ci il hesabatı', href: 'https://www.state.gov/trafficking-in-persons-report/', external: true, img: '/img/photos/report-tip-240.webp', width: 120, height: 156 },
      { label: 'İnsan hüquqları üzrə 2024-cü il ölkə hesabatı', href: 'https://www.state.gov/reports/2024-country-reports-on-human-rights-practices/', external: true, img: '/img/photos/report-hrr-240.webp', width: 120, height: 147 },
      { label: 'Beynəlxalq dini azadlıq üzrə 2023-cü il hesabatı', href: 'https://www.state.gov/reports/2023-report-on-international-religious-freedom/', external: true, img: '/img/photos/report-irf-240.webp', width: 120, height: 160 },
    ],
    policyTitle: 'Siyasət və tarix',
    policyText: 'ABŞ–Azərbaycan siyasəti və səfirliyin tarixi haqqında məlumat əldə edin.',
    policyLink: { label: 'ABŞ-ın Azərbaycanla əlaqələri', href: 'https://www.state.gov/u-s-relations-with-azerbaijan/', external: true },
  },
};

// ---------- Visas page ----------

export const visas = {
  en: {
    title: 'U.S. Visas',
    lead: 'Information for citizens of other countries who want to travel to the United States. U.S. citizens do not need a visa to enter the United States.',
    noticeTitle: 'Notice',
    notices: [
      'Applicants for nonimmigrant visas should schedule their interview at the U.S. embassy or consulate in their country of residence or nationality. Visa application fees are non-refundable and non-transferable.',
      'Applicants for certain visa categories (including F, J, M, H-1B and others) are instructed to set the privacy settings on all social media accounts to "public" to facilitate vetting under U.S. law.',
      'Presidential Proclamation 10998 suspends or limits entry and visa issuance to nationals of 39 countries effective January 1, 2026. Affected applicants may still apply and attend interviews but may be ineligible for issuance.',
    ],
    noticeMore: { label: 'Read the full notices on travel.state.gov', href: 'https://travel.state.gov/', external: true },
    whatTitle: 'What is a visa?',
    whatText: [
      'A citizen of a foreign country who seeks to enter the United States generally must first obtain a U.S. visa, which is placed in the traveler\'s passport.',
      'Certain international travelers may be eligible to travel to the United States without a visa under the Visa Waiver Program.',
    ],
    vwpLink: { label: 'Visa Waiver Program', href: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html', external: true },
    stepsTitle: 'How to apply for a nonimmigrant visa',
    steps: [
      { title: 'Find your visa type', text: 'Use the visa types below or the Visa Wizard on travel.state.gov to identify the right category.' },
      { title: 'Complete the DS-160 form online', text: 'Complete the online nonimmigrant visa application and print the confirmation page.' },
      { title: 'Pay the application fee', text: 'Fees are non-refundable and non-transferable.' },
      { title: 'Schedule your interview', text: 'Book through the official scheduling site for Azerbaijan.' },
      { title: 'Attend your interview', text: 'Bring your passport, DS-160 confirmation, fee receipt, and supporting documents.' },
    ],
    stepsLink: { label: 'Schedule an interview (ustraveldocs.com)', href: 'https://www.ustraveldocs.com/az/en/nonimmigrant-visa', external: true },
    wizardTitle: 'Not sure which visa you need?',
    wizardText: 'The Visa Wizard on travel.state.gov asks a few questions about your purpose of travel and points you to the right visa category.',
    wizardLink: { label: 'Use the Visa Wizard', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wizard.html', external: true },
    typesTitle: 'Visa types',
    types: [
      { title: 'Tourism and visit', text: 'Visitor visas (B-1/B-2) for tourism, visiting family, or medical treatment.', link: { label: 'Tourism and visit visas', href: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html', external: true } },
      { title: 'Study and exchange', text: 'Student (F, M) and exchange visitor (J) visas.', link: { label: 'Study and exchange visas', href: 'https://travel.state.gov/content/travel/en/us-visas/study.html', external: true } },
      { title: 'Business', text: 'Temporary business visitors, treaty traders, and investors.', link: { label: 'Business visas', href: 'https://travel.state.gov/content/travel/en/us-visas/business.html', external: true } },
      { title: 'Employment', text: 'Temporary worker visas (H, L, O, P, and others).', link: { label: 'Employment visas', href: 'https://travel.state.gov/content/travel/en/us-visas/employment.html', external: true } },
      { title: 'Immigrate', text: 'Family-based, employment-based, and diversity immigrant visas.', link: { label: 'Immigrant visas', href: 'https://travel.state.gov/content/travel/en/us-visas/immigrate.html', external: true } },
      { title: 'Other types', text: 'Diplomatic, official, transit, crew, and other categories.', link: { label: 'Other visa categories', href: 'https://travel.state.gov/content/travel/en/us-visas/other-visa-categories.html', external: true } },
    ] as Card[],
    contactTitle: 'Visa contact information',
    contactText: 'For information about specific cases, use the Visa Navigator. For applications and interview scheduling:',
    contactEmailLabel: 'Email',
    contactAzLabel: 'Calling from Azerbaijan',
    contactAz: '+994 12 310 30 22',
    contactAzHref: 'tel:+994123103022',
    contactUsLabel: 'Calling from the United States',
    contactUs: '+1 313 639 0896',
    contactUsHref: 'tel:+13136390896',
    navigatorLink: { label: 'Visa Navigator', href: 'https://az.usembassy.gov/visas/', external: true },
    rightsTitle: 'Rights and protections',
    rights: [
      { title: 'Temporary workers', text: 'Your legal rights in the United States as a nonimmigrant visa holder in certain employment- and education-based categories.', link: { label: 'Temporary worker rights pamphlet', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/temporary-workers.html', external: true } },
      { title: 'Immigrant visa applicants', text: 'Legal rights relating to domestic violence, sexual assault, and child abuse for K-1, K-3, IR-1/CR-1 and F2A applicants.', link: { label: 'Immigrant applicant rights pamphlet', href: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/rights-and-protections-for-immigrant-visa-applicants.html', external: true } },
    ] as Card[],
    resourcesTitle: 'Other resources',
    resources: [
      { label: 'U.S. Citizenship and Immigration Services', href: 'https://www.uscis.gov/', external: true },
      { label: 'Fraud prevention warning', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fraud.html', external: true },
      { label: 'U.S. Customs and Border Protection', href: 'https://www.cbp.gov/', external: true },
      { label: 'Travel.State.gov', href: 'https://travel.state.gov/', external: true },
    ] as Link[],
  },
  az: {
    title: 'ABŞ vizaları',
    lead: 'Amerika Birləşmiş Ştatlarına səfər etmək istəyən digər ölkə vətəndaşları üçün məlumat. ABŞ vətəndaşlarının Amerika Birləşmiş Ştatlarına daxil olmaq üçün vizaya ehtiyacı yoxdur.',
    noticeTitle: 'Bildiriş',
    notices: [
      'Qeyri-immiqrant viza üçün müraciət edənlər müsahibəni yaşadıqları və ya vətəndaşı olduqları ölkədəki ABŞ səfirliyində və ya konsulluğunda təyin etməlidirlər. Viza müraciət haqları geri qaytarılmır və başqasına ötürülmür.',
      'Müəyyən viza kateqoriyaları (F, J, M, H-1B və digərləri daxil olmaqla) üzrə müraciət edənlərə ABŞ qanunvericiliyinə uyğun yoxlama məqsədilə bütün sosial media hesablarının məxfilik ayarlarını "açıq" etmək tövsiyə olunur.',
      '10998 nömrəli Prezident Bəyannaməsi 2026-cı il yanvarın 1-dən etibarən 39 ölkənin vətəndaşlarının girişini və viza verilməsini dayandırır və ya məhdudlaşdırır. Aidiyyəti müraciətçilər yenə də müraciət edə və müsahibədə iştirak edə bilər, lakin viza verilməsi üçün uyğun olmaya bilərlər.',
    ],
    noticeMore: { label: 'Bildirişlərin tam mətnini travel.state.gov saytında oxuyun', href: 'https://travel.state.gov/', external: true },
    whatTitle: 'Viza nədir?',
    whatText: [
      'Amerika Birləşmiş Ştatlarına daxil olmaq istəyən xarici ölkə vətəndaşı adətən əvvəlcə pasportuna yapışdırılan ABŞ vizasını almalıdır.',
      'Bəzi beynəlxalq səyahətçilər Vizasız Səyahət Proqramı çərçivəsində vizasız səyahət etmək hüququna malik ola bilər.',
    ],
    vwpLink: { label: 'Vizasız Səyahət Proqramı', href: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html', external: true },
    stepsTitle: 'Qeyri-immiqrant viza üçün necə müraciət etməli',
    steps: [
      { title: 'Viza növünüzü müəyyən edin', text: 'Aşağıdakı viza növlərindən və ya travel.state.gov saytındakı Viza Sehrbazından istifadə edin.' },
      { title: 'DS-160 formasını onlayn doldurun', text: 'Onlayn qeyri-immiqrant viza müraciətini tamamlayın və təsdiq səhifəsini çap edin.' },
      { title: 'Müraciət haqqını ödəyin', text: 'Haqlar geri qaytarılmır və başqasına ötürülmür.' },
      { title: 'Müsahibə təyin edin', text: 'Azərbaycan üçün rəsmi qeydiyyat saytı vasitəsilə vaxt alın.' },
      { title: 'Müsahibədə iştirak edin', text: 'Pasportunuzu, DS-160 təsdiqini, ödəniş qəbzini və təsdiqedici sənədləri özünüzlə gətirin.' },
    ],
    stepsLink: { label: 'Müsahibə təyin edin (ustraveldocs.com)', href: 'https://www.ustraveldocs.com/az/az/nonimmigrant-visa', external: true },
    wizardTitle: 'Hansı vizaya ehtiyacınız olduğunu bilmirsiniz?',
    wizardText: 'travel.state.gov saytındakı Viza Sehrbazı səyahət məqsədinizlə bağlı bir neçə sual verir və sizi düzgün viza kateqoriyasına yönləndirir.',
    wizardLink: { label: 'Viza Sehrbazından istifadə edin', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wizard.html', external: true },
    typesTitle: 'Viza növləri',
    types: [
      { title: 'Turizm və səfər', text: 'Turizm, ailə ziyarəti və ya müalicə üçün qonaq vizaları (B-1/B-2).', link: { label: 'Turizm və səfər vizaları', href: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html', external: true } },
      { title: 'Təhsil və mübadilə', text: 'Tələbə (F, M) və mübadilə iştirakçısı (J) vizaları.', link: { label: 'Təhsil və mübadilə vizaları', href: 'https://travel.state.gov/content/travel/en/us-visas/study.html', external: true } },
      { title: 'Biznes', text: 'Müvəqqəti biznes səfərləri, müqavilə əsasında ticarət və investorlar.', link: { label: 'Biznes vizaları', href: 'https://travel.state.gov/content/travel/en/us-visas/business.html', external: true } },
      { title: 'İş', text: 'Müvəqqəti işçi vizaları (H, L, O, P və digərləri).', link: { label: 'İş vizaları', href: 'https://travel.state.gov/content/travel/en/us-visas/employment.html', external: true } },
      { title: 'İmmiqrasiya', text: 'Ailə, iş və müxtəliflik əsaslı immiqrant vizaları.', link: { label: 'İmmiqrant vizaları', href: 'https://travel.state.gov/content/travel/en/us-visas/immigrate.html', external: true } },
      { title: 'Digər növlər', text: 'Diplomatik, rəsmi, tranzit, ekipaj və digər kateqoriyalar.', link: { label: 'Digər viza kateqoriyaları', href: 'https://travel.state.gov/content/travel/en/us-visas/other-visa-categories.html', external: true } },
    ] as Card[],
    contactTitle: 'Viza üzrə əlaqə məlumatı',
    contactText: 'Konkret işlər barədə məlumat üçün Viza Naviqatorundan istifadə edin. Müraciət və müsahibə qeydiyyatı üçün:',
    contactEmailLabel: 'E-poçt',
    contactAzLabel: 'Azərbaycandan zəng',
    contactAz: '+994 12 310 30 22',
    contactAzHref: 'tel:+994123103022',
    contactUsLabel: 'Amerika Birləşmiş Ştatlarından zəng',
    contactUs: '+1 313 639 0896',
    contactUsHref: 'tel:+13136390896',
    navigatorLink: { label: 'Viza Naviqatoru', href: 'https://az.usembassy.gov/visas/', external: true },
    rightsTitle: 'Hüquqlar və müdafiə',
    rights: [
      { title: 'Müvəqqəti işçilər', text: 'Müəyyən iş və təhsil əsaslı kateqoriyalarda qeyri-immiqrant viza sahibi kimi Amerika Birləşmiş Ştatlarındakı hüquqi hüquqlarınız.', link: { label: 'Müvəqqəti işçilərin hüquqları broşürü', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/temporary-workers.html', external: true } },
      { title: 'İmmiqrant viza müraciətçiləri', text: 'K-1, K-3, IR-1/CR-1 və F2A müraciətçiləri üçün məişət zorakılığı, cinsi zorakılıq və uşaqlara qarşı zorakılıqla bağlı hüquqi hüquqlar.', link: { label: 'İmmiqrant müraciətçilərin hüquqları broşürü', href: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/rights-and-protections-for-immigrant-visa-applicants.html', external: true } },
    ] as Card[],
    resourcesTitle: 'Digər resurslar',
    resources: [
      { label: 'ABŞ Vətəndaşlıq və İmmiqrasiya Xidməti (USCIS)', href: 'https://www.uscis.gov/', external: true },
      { label: 'Saxtakarlıqdan qorunma xəbərdarlığı', href: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fraud.html', external: true },
      { label: 'ABŞ Gömrük və Sərhəd Mühafizəsi (CBP)', href: 'https://www.cbp.gov/', external: true },
      { label: 'Travel.State.gov', href: 'https://travel.state.gov/', external: true },
    ] as Link[],
  },
};

// ---------- American Citizens Services page ----------

export const citizens = {
  en: {
    title: 'American Citizens Services',
    lead: 'Passports, emergency help, federal benefits, and family services for U.S. citizens in Azerbaijan.',
    navigatorText: 'For questions about a specific situation, the U.S. Citizen Services Navigator will guide you to the right information or let you submit a question by email.',
    navigatorLink: { label: 'Open the Citizen Services Navigator', href: 'https://az.usembassy.gov/u-s-citizen-services/', external: true },
    sections: [
      {
        id: 'emergency', title: 'Emergency assistance',
        intro: 'The embassy can help U.S. citizens who are arrested, become victims of crime, or face a family emergency abroad.',
        cards: [
          { title: 'Arrest of a U.S. citizen', text: 'The Department of State assists U.S. citizens imprisoned overseas and works to ensure their fair and humane treatment.', link: { label: 'Help if arrested abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/arrest-detention.html', external: true } },
          { title: 'Death of a U.S. citizen', text: 'We inform the next of kin, provide information on local burial or return of remains, and issue a Consular Report of Death Abroad.', link: { label: 'Assistance after a death abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/death-abroad.html', external: true } },
          { title: 'International parental child abduction', text: 'The Office of Children\'s Issues works to resolve and prevent cases of international parental child abduction.', link: { label: 'Help for child abduction cases', href: 'https://travel.state.gov/content/travel/en/International-Parental-Child-Abduction.html', external: true } },
          { title: 'Victims of crime', text: 'We connect crime victims with police and other services and provide resources to help with physical, emotional, or financial injury.', link: { label: 'Help for victims of crime', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/crime.html', external: true } },
        ],
      },
      {
        id: 'financial', title: 'Emergency financial assistance',
        intro: 'U.S. citizens who need emergency funds abroad should first contact family, friends, a bank, or an employer. When that is not possible, the Department of State can help.',
        cards: [
          { title: 'Wiring money directly', text: 'Use a commercial money transfer service such as Western Union or MoneyGram. The recipient will need proof of identity such as a passport. Be wary of international financial scams.', link: { label: 'Sending money to a citizen abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
          { title: 'Sending money through the Department of State', text: 'Family or friends may send funds through the Department of State for delivery to a destitute U.S. citizen at the nearest embassy. A $30 fee applies.', link: { label: 'How the Department of State can help', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
          { title: 'Repatriation loans', text: 'Destitute U.S. citizens may be eligible for a loan to travel to the United States. Loans must be repaid, and passports are limited until repayment.', link: { label: 'About repatriation loans', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
        ],
      },
      {
        id: 'passports', title: 'Passports and notarial services',
        cards: [
          { title: 'U.S. passport services', text: 'U.S. citizens overseas can renew, replace, or apply for a new passport.', link: { label: 'Passport information', href: 'https://travel.state.gov/content/travel/en/passports.html', external: true } },
          { title: 'Notarial services', text: 'Notarial services are available by appointment at the consular section.', link: { label: 'Notarial and authentication services', href: 'https://travel.state.gov/content/travel/en/records-and-authentications/notarial-and-authentication-services.html', external: true } },
          { title: 'Smart Traveler Enrollment Program (STEP)', text: 'Sign up to receive safety and security alerts and local updates while abroad.', link: { label: 'Enroll in STEP', href: 'https://step.state.gov/', external: true } },
        ],
      },
      {
        id: 'federal', title: 'Federal programs',
        cards: [
          { title: 'Internal Revenue Service', text: 'U.S. citizens and lawful permanent residents must file U.S. federal income tax returns while abroad.', link: { label: 'IRS international taxpayers', href: 'https://www.irs.gov/individuals/international-taxpayers', external: true } },
          { title: 'Selective Service', text: 'U.S. citizens and dual citizens living abroad can register with the Selective Service System.', link: { label: 'Register for Selective Service', href: 'https://www.sss.gov/', external: true } },
          { title: 'Social Security', text: 'For questions about Social Security services in Azerbaijan, contact the Federal Benefits Unit in Greece.', link: { label: 'Social Security abroad', href: 'https://www.ssa.gov/foreign/', external: true } },
          { title: 'Veterans Affairs', text: 'Service members, veterans, and beneficiaries can apply for benefits on the VA website.', link: { label: 'Department of Veterans Affairs', href: 'https://www.va.gov/', external: true } },
          { title: 'Voting', text: 'Complete a Federal Post Card Application (FPCA) each January or when you move to receive your ballot by email, fax, or download.', link: { label: 'Federal Voting Assistance Program', href: 'https://www.fvap.gov/', external: true } },
        ],
      },
      {
        id: 'local', title: 'Local resources',
        intro: 'The Department of State assumes no responsibility for the professional ability or reputation of the providers on these lists. Inclusion is not an endorsement.',
        cards: [
          { title: 'Legal assistance', text: 'While in Azerbaijan, a U.S. citizen is subject to Azerbaijani law, which may differ significantly from U.S. law.', link: { label: 'Legal assistance information', href: 'https://az.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/attorneys/', external: true } },
          { title: 'Medical assistance', text: 'All Americans traveling to Azerbaijan should make sure their immunizations are up to date.', link: { label: 'Medical assistance information', href: 'https://az.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/doctors/', external: true } },
        ],
      },
      {
        id: 'family', title: 'Child and family issues',
        cards: [
          { title: 'Intercountry adoption', text: 'The Department of State urges U.S. citizens considering adoption in Azerbaijan to consider carefully the likely difficulties and continuing uncertainty.', link: { label: 'Adoption information', href: 'https://travel.state.gov/content/travel/en/Intercountry-Adoption.html', external: true } },
          { title: 'Births', text: 'U.S. citizen parents of a child born in Azerbaijan can apply for a Consular Report of Birth Abroad, which serves as proof of U.S. citizenship.', link: { label: 'Report a birth abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/birth-abroad.html', external: true } },
          { title: 'Marriage', text: 'Under Azerbaijani law, either the bride or the groom must be an Azerbaijani citizen for a marriage to be registered in Azerbaijan. Marriages are registered at the Main Registrar Office (ZAGS).', link: { label: 'Marriage abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/marriage-abroad.html', external: true } },
          { title: 'Divorce', text: 'The validity of a divorce obtained overseas depends on the requirements of your state of residence in the United States.', link: { label: 'Divorce abroad', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/divorce-abroad.html', external: true } },
        ],
      },
    ] as Section[],
  },
  az: {
    title: 'Amerika vətəndaşlarına xidmətlər',
    lead: 'Azərbaycandakı ABŞ vətəndaşları üçün pasport, təcili yardım, federal müavinətlər və ailə xidmətləri.',
    navigatorText: 'Konkret vəziyyətlə bağlı suallar üçün ABŞ Vətəndaş Xidmətləri Naviqatoru sizi düzgün məlumata yönləndirəcək və ya sualınızı e-poçtla göndərməyə imkan verəcək.',
    navigatorLink: { label: 'Vətəndaş Xidmətləri Naviqatorunu açın', href: 'https://az.usembassy.gov/u-s-citizen-services/', external: true },
    sections: [
      {
        id: 'emergency', title: 'Təcili yardım',
        intro: 'Səfirlik həbs olunan, cinayət qurbanı olan və ya xaricdə ailə ilə bağlı təcili vəziyyətlə üzləşən ABŞ vətəndaşlarına kömək edə bilər.',
        cards: [
          { title: 'ABŞ vətəndaşının həbsi', text: 'Dövlət Departamenti xaricdə həbs olunan ABŞ vətəndaşlarına kömək edir və onlarla ədalətli və humanist rəftar olunmasına çalışır.', link: { label: 'Xaricdə həbs olunduqda kömək', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/arrest-detention.html', external: true } },
          { title: 'ABŞ vətəndaşının vəfatı', text: 'Yaxın qohumlara məlumat veririk, yerli dəfn və ya cənazənin qaytarılması barədə məlumat təqdim edirik və Xaricdə Vəfat haqqında Konsul Hesabatı veririk.', link: { label: 'Xaricdə vəfat halında yardım', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/death-abroad.html', external: true } },
          { title: 'Uşağın valideyn tərəfindən beynəlxalq oğurlanması', text: 'Uşaq Məsələləri Ofisi uşaqların valideyn tərəfindən beynəlxalq oğurlanması hallarının həlli və qarşısının alınması üzərində işləyir.', link: { label: 'Uşaq oğurlanması hallarında kömək', href: 'https://travel.state.gov/content/travel/en/International-Parental-Child-Abduction.html', external: true } },
          { title: 'Cinayət qurbanları', text: 'Cinayət qurbanlarını polis və digər xidmətlərlə əlaqələndirir, fiziki, emosional və ya maliyyə zərəri ilə bağlı resurslar təqdim edirik.', link: { label: 'Cinayət qurbanları üçün kömək', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/crime.html', external: true } },
        ],
      },
      {
        id: 'financial', title: 'Təcili maliyyə yardımı',
        intro: 'Xaricdə təcili vəsaitə ehtiyacı olan ABŞ vətəndaşları əvvəlcə ailə, dostlar, bank və ya işəgötürənlə əlaqə saxlamalıdır. Bu mümkün olmadıqda Dövlət Departamenti kömək edə bilər.',
        cards: [
          { title: 'Birbaşa pul köçürməsi', text: 'Western Union və ya MoneyGram kimi kommersiya pul köçürmə xidmətindən istifadə edin. Alan şəxs pasport kimi şəxsiyyət sənədi təqdim etməlidir. Beynəlxalq maliyyə saxtakarlığından ehtiyatlı olun.', link: { label: 'Xaricdəki vətəndaşa pul göndərmək', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
          { title: 'Dövlət Departamenti vasitəsilə pul göndərmək', text: 'Ailə və ya dostlar ehtiyac içində olan ABŞ vətəndaşına ən yaxın səfirlikdə çatdırılmaq üçün Dövlət Departamenti vasitəsilə vəsait göndərə bilər. 30 ABŞ dolları haqq tutulur.', link: { label: 'Dövlət Departamenti necə kömək edə bilər', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
          { title: 'Repatriasiya kreditləri', text: 'Ehtiyac içində olan ABŞ vətəndaşları Amerika Birləşmiş Ştatlarına qayıtmaq üçün kredit ala bilər. Kredit geri ödənilməli, ödənilənədək pasport məhdudlaşdırılır.', link: { label: 'Repatriasiya kreditləri haqqında', href: 'https://travel.state.gov/content/travel/en/international-travel/emergencies/sending-money-abroad.html', external: true } },
        ],
      },
      {
        id: 'passports', title: 'Pasport və notariat xidmətləri',
        cards: [
          { title: 'ABŞ pasport xidmətləri', text: 'Xaricdəki ABŞ vətəndaşları pasportu yeniləyə, dəyişdirə və ya yeni pasport üçün müraciət edə bilər.', link: { label: 'Pasport məlumatı', href: 'https://travel.state.gov/content/travel/en/passports.html', external: true } },
          { title: 'Notariat xidmətləri', text: 'Notariat xidmətləri konsul şöbəsində əvvəlcədən qeydiyyatla göstərilir.', link: { label: 'Notariat və təsdiq xidmətləri', href: 'https://travel.state.gov/content/travel/en/records-and-authentications/notarial-and-authentication-services.html', external: true } },
          { title: 'Ağıllı Səyahətçi Qeydiyyat Proqramı (STEP)', text: 'Xaricdə olarkən təhlükəsizlik xəbərdarlıqları və yerli yenilikləri almaq üçün qeydiyyatdan keçin.', link: { label: 'STEP-ə qeydiyyatdan keçin', href: 'https://step.state.gov/', external: true } },
        ],
      },
      {
        id: 'federal', title: 'Federal proqramlar',
        cards: [
          { title: 'Daxili Gəlirlər Xidməti (IRS)', text: 'ABŞ vətəndaşları və daimi yaşayış hüququ olanlar xaricdə olarkən də ABŞ federal gəlir vergisi bəyannaməsi təqdim etməlidir.', link: { label: 'IRS beynəlxalq vergi ödəyiciləri', href: 'https://www.irs.gov/individuals/international-taxpayers', external: true } },
          { title: 'Seçmə Xidmət (Selective Service)', text: 'Xaricdə yaşayan ABŞ vətəndaşları və ikili vətəndaşlar Seçmə Xidmət Sistemində qeydiyyatdan keçə bilər.', link: { label: 'Seçmə Xidmətdə qeydiyyat', href: 'https://www.sss.gov/', external: true } },
          { title: 'Sosial Təminat', text: 'Azərbaycanda Sosial Təminat xidmətləri ilə bağlı suallar üçün Yunanıstandakı Federal Müavinətlər Bölməsi ilə əlaqə saxlayın.', link: { label: 'Xaricdə Sosial Təminat', href: 'https://www.ssa.gov/foreign/', external: true } },
          { title: 'Veteranlar İdarəsi', text: 'Hərbi qulluqçular, veteranlar və onların himayəsində olanlar VA saytında müavinət üçün müraciət edə bilər.', link: { label: 'Veteranlar İdarəsi', href: 'https://www.va.gov/', external: true } },
          { title: 'Səsvermə', text: 'Bülleteni e-poçt, faks və ya yükləmə yolu ilə almaq üçün hər il yanvar ayında və ya köçdükdə Federal Poçt Kartı Müraciəti (FPCA) doldurun.', link: { label: 'Federal Səsvermə Yardım Proqramı', href: 'https://www.fvap.gov/', external: true } },
        ],
      },
      {
        id: 'local', title: 'Yerli resurslar',
        intro: 'Dövlət Departamenti bu siyahılardakı xidmət təminatçılarının peşəkarlığı və ya reputasiyası üçün məsuliyyət daşımır. Siyahıya daxil edilmə tövsiyə demək deyil.',
        cards: [
          { title: 'Hüquqi yardım', text: 'Azərbaycanda olarkən ABŞ vətəndaşı ABŞ qanunlarından əhəmiyyətli dərəcədə fərqlənə bilən Azərbaycan qanunlarına tabedir.', link: { label: 'Hüquqi yardım məlumatı', href: 'https://az.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/attorneys/', external: true } },
          { title: 'Tibbi yardım', text: 'Azərbaycana səyahət edən bütün amerikalılar peyvəndlərinin vaxtında olduğundan əmin olmalıdır.', link: { label: 'Tibbi yardım məlumatı', href: 'https://az.usembassy.gov/u-s-citizen-services/local-resources-of-u-s-citizens/doctors/', external: true } },
        ],
      },
      {
        id: 'family', title: 'Uşaq və ailə məsələləri',
        cards: [
          { title: 'Ölkələrarası övladlığa götürmə', text: 'Dövlət Departamenti Azərbaycanda övladlığa götürməyi düşünən ABŞ vətəndaşlarını ehtimal olunan çətinlikləri və davam edən qeyri-müəyyənliyi diqqətlə nəzərə almağa çağırır.', link: { label: 'Övladlığa götürmə məlumatı', href: 'https://travel.state.gov/content/travel/en/Intercountry-Adoption.html', external: true } },
          { title: 'Doğum', text: 'Azərbaycanda doğulan uşağın ABŞ vətəndaşı olan valideynləri ABŞ vətəndaşlığını təsdiq edən Xaricdə Doğum haqqında Konsul Hesabatı üçün müraciət edə bilər.', link: { label: 'Xaricdə doğumu qeydə almaq', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/birth-abroad.html', external: true } },
          { title: 'Nikah', text: 'Azərbaycan qanunvericiliyinə görə nikahın Azərbaycanda qeydə alınması üçün gəlin və ya bəydən biri Azərbaycan vətəndaşı olmalıdır. Nikahlar Baş Qeydiyyat İdarəsində (ZAGS) qeydə alınır.', link: { label: 'Xaricdə nikah', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/marriage-abroad.html', external: true } },
          { title: 'Boşanma', text: 'Xaricdə alınmış boşanmanın etibarlılığı Amerika Birləşmiş Ştatlarında yaşadığınız ştatın tələblərindən asılıdır.', link: { label: 'Xaricdə boşanma', href: 'https://travel.state.gov/content/travel/en/international-travel/while-abroad/divorce-abroad.html', external: true } },
        ],
      },
    ] as Section[],
  },
};

// ---------- Education & Exchanges page ----------

export const education = {
  en: {
    title: 'Education & Exchanges',
    lead: 'The Public Affairs Section of the U.S. Embassy in Azerbaijan fosters mutual understanding between the United States and Azerbaijan through educational and training exchange programs.',
    overview: 'In addition to bringing U.S. scholars and researchers to Azerbaijan, the U.S. Department of State sends Azerbaijani students, educators, and professionals to the United States every year on a variety of programs.',
    sections: [
      {
        id: 'education', title: 'Education',
        cards: [
          { title: 'EducationUSA', text: 'EducationUSA is your official source on U.S. higher education.', link: { label: 'About EducationUSA', href: 'https://educationusa.state.gov/', external: true } },
          { title: 'Local EducationUSA centers', text: 'Advising centers help you navigate the Five Steps to U.S. Study.', link: { label: 'Find a center near you', href: 'https://educationusa.state.gov/find-advising-center', external: true } },
          { title: 'Study and exchange visas', text: 'Before applying for a visa, students and exchange visitors must be accepted by their school or program sponsor.', link: { label: 'Study and exchange visas', href: '/visas/#types' } },
          { title: 'American English', text: 'A resource center for teaching and learning about American English.', link: { label: 'Visit American English', href: 'https://americanenglish.state.gov/', external: true } },
        ],
      },
      {
        id: 'exchanges', title: 'Exchanges',
        cards: [
          { title: 'BridgeUSA', text: 'Brings emerging leaders and professionals to the United States.', link: { label: 'About BridgeUSA', href: 'https://j1visa.state.gov/', external: true } },
          { title: 'Academic and professional exchanges', text: 'Opportunities for international study and research from undergraduate through postdoctoral.', link: { label: 'Exchange programs', href: 'https://exchanges.state.gov/', external: true } },
          { title: 'American Spaces', text: 'A network of 600 open-access cultural centers, including American Centers and American Corners in Azerbaijan.', link: { label: 'Find an American Space', href: 'https://americanspaces.state.gov/', external: true } },
        ],
      },
      {
        id: 'alumni', title: 'Exchange alumni',
        intro: 'Join the Exchange Alumni community portal for academic resources, networking, funding opportunities, and the quarterly alumni newsletter.',
        cards: [
          { title: 'Alumni community portal', text: 'Access academic journals through eLibraryUSA, connect with fellow alumni, and find funding such as the Alumni Engagement Innovation Fund (AEIF).', link: { label: 'Exchange Alumni portal', href: 'https://alumni.state.gov/', external: true } },
        ],
      },
      {
        id: 'local', title: 'Local programs',
        cards: [
          { title: 'English Language Teaching Program', text: 'An open call for proposals for English language projects serving internally displaced communities and communities outside Baku.', link: { label: 'Program details', href: 'https://az.usembassy.gov/education-culture/', external: true } },
          { title: 'Strengthening Research Capacities', text: 'A one-year project with ADA University to enhance research potential and build partnerships with U.S. universities.', link: { label: 'Program details', href: 'https://az.usembassy.gov/education-culture/', external: true } },
          { title: 'Alumni Support for Local Communities Fund', text: 'Supports alumni-led projects that benefit local communities in Azerbaijan.', link: { label: 'Program details', href: 'https://az.usembassy.gov/education-culture/', external: true } },
        ],
      },
    ] as Section[],
  },
  az: {
    title: 'Təhsil və mübadilə proqramları',
    lead: 'ABŞ-ın Azərbaycandakı Səfirliyinin İctimaiyyətlə Əlaqələr Şöbəsi təhsil və təlim mübadilə proqramları vasitəsilə Amerika Birləşmiş Ştatları ilə Azərbaycan arasında qarşılıqlı anlaşmanı gücləndirir.',
    overview: 'ABŞ Dövlət Departamenti amerikalı alim və tədqiqatçıları Azərbaycana gətirməklə yanaşı, hər il müxtəlif proqramlar çərçivəsində azərbaycanlı tələbələri, müəllimləri və mütəxəssisləri Amerika Birləşmiş Ştatlarına göndərir.',
    sections: [
      {
        id: 'education', title: 'Təhsil',
        cards: [
          { title: 'EducationUSA', text: 'EducationUSA ABŞ ali təhsili haqqında rəsmi məlumat mənbəyinizdir.', link: { label: 'EducationUSA haqqında', href: 'https://educationusa.state.gov/', external: true } },
          { title: 'Yerli EducationUSA mərkəzləri', text: 'Məsləhət mərkəzləri ABŞ-da təhsilin Beş Addımını keçməyə kömək edir.', link: { label: 'Yaxınlıqdakı mərkəzi tapın', href: 'https://educationusa.state.gov/find-advising-center', external: true } },
          { title: 'Təhsil və mübadilə vizaları', text: 'Vizaya müraciət etməzdən əvvəl tələbələr və mübadilə iştirakçıları təhsil müəssisəsi və ya proqram sponsoru tərəfindən qəbul edilməlidir.', link: { label: 'Təhsil və mübadilə vizaları', href: '/az/visas/#types' } },
          { title: 'American English', text: 'Amerika ingiliscəsinin tədrisi və öyrənilməsi üçün resurs mərkəzi.', link: { label: 'American English saytına keçin', href: 'https://americanenglish.state.gov/', external: true } },
        ],
      },
      {
        id: 'exchanges', title: 'Mübadilə proqramları',
        cards: [
          { title: 'BridgeUSA', text: 'Gənc liderləri və mütəxəssisləri Amerika Birləşmiş Ştatlarına gətirir.', link: { label: 'BridgeUSA haqqında', href: 'https://j1visa.state.gov/', external: true } },
          { title: 'Akademik və peşəkar mübadilələr', text: 'Bakalavrdan postdoktoranturaya qədər beynəlxalq təhsil və tədqiqat imkanları.', link: { label: 'Mübadilə proqramları', href: 'https://exchanges.state.gov/', external: true } },
          { title: 'Amerika Məkanları', text: 'Azərbaycandakı Amerika Mərkəzləri və Amerika Guşələri də daxil olmaqla 600 açıq mədəniyyət mərkəzindən ibarət şəbəkə.', link: { label: 'Amerika Məkanı tapın', href: 'https://americanspaces.state.gov/', external: true } },
        ],
      },
      {
        id: 'alumni', title: 'Mübadilə proqramı məzunları',
        intro: 'Akademik resurslar, əlaqələr, maliyyə imkanları və rüblük məzun bülleteni üçün Mübadilə Məzunları icma portalına qoşulun.',
        cards: [
          { title: 'Məzunların icma portalı', text: 'eLibraryUSA vasitəsilə akademik jurnallara çıxış əldə edin, digər məzunlarla əlaqə qurun və Məzunların Cəlb Edilməsi İnnovasiya Fondu (AEIF) kimi maliyyə imkanlarını tapın.', link: { label: 'Mübadilə Məzunları portalı', href: 'https://alumni.state.gov/', external: true } },
        ],
      },
      {
        id: 'local', title: 'Yerli proqramlar',
        cards: [
          { title: 'İngilis dilinin tədrisi proqramı', text: 'Məcburi köçkün icmalarına və Bakıdan kənar icmalara xidmət edən ingilis dili layihələri üçün açıq təkliflər çağırışı.', link: { label: 'Proqram haqqında', href: 'https://az.usembassy.gov/education-culture/', external: true } },
          { title: 'Tədqiqat potensialının gücləndirilməsi', text: 'ADA Universiteti ilə tədqiqat potensialını artırmaq və ABŞ universitetləri ilə tərəfdaşlıq qurmaq üçün birillik layihə.', link: { label: 'Proqram haqqında', href: 'https://az.usembassy.gov/education-culture/', external: true } },
          { title: 'Yerli icmalara məzun dəstəyi fondu', text: 'Azərbaycanda yerli icmalara fayda verən məzunların rəhbərlik etdiyi layihələri dəstəkləyir.', link: { label: 'Proqram haqqında', href: 'https://az.usembassy.gov/education-culture/', external: true } },
        ],
      },
    ] as Section[],
  },
};
