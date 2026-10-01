/**
 * Bundled content — the canonical copy from the live site (dentalatelier.co),
 * captured verbatim (typos included, see note below) and used as:
 *
 *   1. the Prisma seed source (`prisma/seed.js`)
 *   2. the fallback when MySQL is unreachable, so `next build` and the
 *      marketing pages still render on a fresh clone or in CI
 *
 * Once a page/FAQ/service row exists in the database, the DB wins and this
 * file is only the starting point. Editing copy should be done in the admin
 * portal; editing here and re-running `npm run db:seed` re-seeds it.
 */

export const SITE = {
  name: 'Dental Atelier',
  legalName: 'Dental Atelier Michal Siakel',
  tagline: 'A state-of-the-art laboratory',
  description:
    'Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind.',
  url: 'https://www.dentalatelier.co',
  locale: 'en',
  vat: 'BE 0504872627',
  email: 'contact@dentalatelier.co',
  mobile: '+32478547475',
  mobileDisplay: '+32 478 54 74 75',
  phone: '+32 2 376 43 26',
  phoneDisplay: '+32 2 376 43 26',
  facebook: 'https://www.facebook.com/DentalAtelierMichalSiakel',
  address: {
    street: 'Rue du Bourdon 100/8',
    postalCode: '1180',
    city: 'Uccle',
    country: 'Brussels',
    countryCode: 'BE',
    lines: ['Dental Atelier Michal Siakel', 'Rue du Bourdon 100/8', '1180 Uccle', 'Brussels'],
  },
  mapEmbed:
    'https://www.google.com/maps?q=Dental+Atelier+Michal+Siakel,+Rue+du+Bourdon+100,+1180+Uccle,+Brussels&output=embed',
  mapDirections:
    'https://www.google.com/maps/dir//Dental+Atelier+Michal+Siakel,+Horzelstraat+100,+1180+Ukkel/@50.785398,4.333017,17z/data=!4m12!1m3!3m2!1s0x0:0xb8663b767b480c77!2sDental+Atelier+Michal+Siakel!4m7!1m0!1m5!1m1!1s0x47c3dea0e23fd62b:0xb8663b767b480c77!2m2!1d4.333017!2d50.785398?hl=en',
  ogImage: '/images/hero-sexy.jpg',
};

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Products & Materials', href: '/products-and-materials' },
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact Us', href: '/contact-us' },
];

/** The three feature banners on the home page. */
export const FEATURE_SECTIONS = [
  {
    slug: 'sexy-and-powerful-smile',
    title: 'Sexy & powerful smile',
    headingLines: ['Sexy', '& powerful smile'],
    image: '/images/hero-sexy.jpg',
    intro: 'An ideal smile is linked to certain biometrical features of your face.',
  },
  {
    slug: 'comfort-and-self-confidence',
    title: 'Comfort & Self-confidence',
    headingLines: ['Comfort', '& Self-confidence'],
    image: '/images/hero-comfort.jpg',
    intro: 'There is always a solution to your discomfort.',
  },
  {
    slug: 'looking-young-feeling-healthy',
    title: 'Looking young, feeling healthy',
    headingLines: ['Looking young,', 'feeling healthy'],
    image: '/images/hero-young.jpg',
    intro: 'Thanks to the newest technologies we can correct a large part of these imperfections.',
  },
];

/** Products & Materials → service catalogue. */
export const SERVICES = [
  {
    slug: 'facial-analysis-and-digital-smile-design',
    title: 'Facial Analysis and Digital Smile Design',
    category: 'product',
    summary:
      'Digital imaging allows you to see the desired result on your portrait photograph before your teeth are even touched by the dentist!',
    description:
      'Digital imaging allows you to see the desired result on your portrait photograph before your teeth are even touched by the dentist!',
    order: 1,
  },
  {
    slug: 'diagnostic-wax-up',
    title: 'Diagnostic wax up',
    category: 'product',
    summary: 'See your future smile on a 3D model!',
    description:
      'See your future smile on a 3D model! The impressions of your teeth are used to build a plaster model, which we then use to wax up "mock-up" teeth so you can see and approve the result before the definitive work begins.',
    order: 2,
  },
  {
    slug: 'provisional-crowns',
    title: 'Provisional Crowns',
    category: 'product',
    summary:
      'Not one day toothless. With a provisional crown people around you will not even notice you are having your teeth done.',
    description:
      'Not one day toothless. With a provisional crown people around you will not even notice you are having your teeth done. The wax-up we approve together is copied into the provisional stage, so adjustments are always possible.',
    order: 3,
  },
  {
    slug: 'crowns-and-bridges',
    title: 'Crowns & Bridges',
    category: 'product',
    summary: 'Missing a tooth? No problem to fix this with a highly durable ceramic bridge!',
    description:
      'Missing a tooth? No problem to fix this with a highly durable ceramic bridge! We consider it crucial to mimic all the life-like features of the natural tooth to arrive at the best aesthetic look.',
    order: 4,
  },
  {
    slug: 'implant-solutions',
    title: 'Implant Solutions',
    category: 'product',
    summary: 'Properly designed implant crowns are the basis of “invisible crowns”.',
    description:
      'Properly designed implant crowns are the basis of “invisible crowns”. Dental implants also support the jaw bone, which keeps your expression younger and healthier.',
    order: 5,
  },
  {
    slug: 'inlays-onlays',
    title: 'Inlays/Onlays',
    category: 'product',
    summary:
      'Fed up with yellow composite fillings in your teeth? Ceramic “fillings” will sort out this problem for a long time.',
    description:
      'Fed up with yellow composite fillings in your teeth? Ceramic “fillings” will sort out this problem for a long time. Strong, precisely fitting and natural looking.',
    order: 6,
  },
  {
    slug: 'veneers',
    title: 'Veneers',
    category: 'product',
    summary:
      'Discover the beauty of an individually fine-tuned veneer! Quick and conservative method how to fix the issues with your smile.',
    description:
      'Discover the beauty of an individually fine-tuned veneer! Quick and conservative method how to fix the issues with your smile. A veneer is a very thin shell — thin like an egg shell — attached to the front side of your tooth.',
    order: 7,
  },
  // ---- Services page ----
  {
    slug: 'price-estimation',
    title: 'Price estimation',
    category: 'service',
    summary:
      'The price of your dental product is derived from the type of work and the type of material used.',
    description:
      'The price of your dental product is derived from the type of work and the type of material used.\n\nWe can advise you on your individual needs and provide the laboratory costs price estimation.',
    order: 1,
  },
  {
    slug: 'free-consultation',
    title: 'Free consultation',
    category: 'service',
    summary:
      'The collaboration between Patient, Dentist and Technician very important to achieve the final result we are aiming to.',
    description:
      'The collaboration between Patient, Dentist and Technician very important to achieve the final result we are aiming to.\n\nWith the dentist on one side and with the customer on the other, every step of the way is set in advance so there is no unwanted surprise at the end of your treatment.',
    order: 2,
  },
  {
    slug: 'custom-colour-shading',
    title: 'Custom colour shading',
    category: 'service',
    summary:
      'Our customers are always welcome in our Dental Atelier for a consultation on the colour of their teeth.',
    description:
      'Our customers are always welcome in our Dental Atelier for a consultation on the colour of their teeth.\n\nWe are pleased to see the patients individually for a free custom shading appointment.',
    order: 3,
  },
  {
    slug: 'facial-analysis',
    title: 'Facial analysis and Digital Smile Design',
    category: 'service',
    summary:
      'Analyse your face on the computer and check out your new teeth before the makeover even begins.',
    description:
      'Analyse your face on the computer and check out your new teeth before the makeover even begins. A ground-breaking new approach makes you see the results in advance of any treatment. Come and get a photo of your new smile!',
    order: 4,
  },
  {
    slug: 'pick-up-and-delivery',
    title: 'Pick-up and delivery',
    category: 'service',
    summary: 'Dental Atelier Michal Siakel provides for a free pick-up and delivery service.',
    description:
      'Dental Atelier Michal Siakel provides for a free pick-up and delivery service. We collect the work from your dental practice and return it to your door, at no extra cost.',
    order: 5,
  },
  {
    slug: 'consultation',
    title: 'Consultation',
    category: 'service',
    summary: 'Please make an appointment for a free consultation on individual cases.',
    description: 'Please make an appointment for a free consultation on individual cases.',
    order: 6,
  },
  {
    slug: 'diagnostic-case-planning',
    title: 'Diagnostic case planning',
    category: 'service',
    summary:
      'Plan each case using photographs, study casts and afterwards creating a wax up.',
    description:
      'In order to end up with a satisfying aesthetic and functional prosthesis, it is very important to plan each case by using photographs, study casts and afterwards creating a wax up. The wax up shows clearly how we could improve the existing situation and what are our limitations.',
    order: 7,
  },
];

export const MATERIALS = {
  title: 'Materials',
  body: 'All materials used for the fabrication of our dentures are produced by the leading manufacturers in the dental field. These materials fulfilling all the EU requirements of EU and carry all necessary certification.',
};

export const DIRECTIONS = [
  {
    id: 'car',
    title: 'By car:',
    body: '',
    link: { label: 'Google Maps: Get Direction', href: SITE.mapDirections },
  },
  {
    id: 'metro',
    title: 'By metro:',
    body: 'Metro line 2 and 6 Stop Zuidstation/ Gare du Midi or Hallepoort/Porte de Hal, afterwards switch to tram line 51.',
  },
  {
    id: 'tram',
    title: 'By tram:',
    body: 'Tram line 51, stop Horzel/Bourdon direction Van Haelen from Brussels centre.',
  },
  {
    id: 'bus',
    title: 'By bus:',
    body: 'Bus line 43, stop Horzel/Bourdon. Bus line 60, stop Engeland.',
  },
  {
    id: 'train',
    title: 'By train:',
    body: 'Train station Ukkel Kalevoet/Uccle Calevoet.',
  },
];

/** Home page testimonials carousel (verbatim from the live site). */
export const TESTIMONIALS = [
  {
    author: 'Karl',
    treatment: '3 crowns',
    quote:
      'I was very happy to be served in Dental Atelier. The professional attitude and quality of service is great…thank you,',
  },
  {
    author: 'Martin Weron',
    treatment: '6 veneers',
    quote:
      'The possibility to see my new smile on a photo before the treatment gave me more relaxed feeling while the procedure was being done. Thanks,',
  },
  {
    author: 'Louise',
    treatment: 'Single central incisor',
    quote: 'The natural look of my front tooth is amazing!',
  },
  {
    author: 'Vincenze',
    treatment: 'Smile makeover',
    quote: 'Fantastic! My new teeth make me look 10 years younger…"',
  },
  {
    author: 'Mirabelle',
    treatment: 'Smile makeover',
    quote:
      'Before I went for my dental treatment and I was very anxious. But there was no way out, I was already postponing it for a long time. After you have explained to me step-by-step the whole treatment step by step, the discomfort was gone. I am now enjoying my new teeth very much. Thank you guys,',
  },
  {
    author: 'Paula',
    treatment: 'Implant bridge',
    quote: 'With my new smile the self confidence is back… Cheers,',
  },
];

export const FAQS = [
  {
    question: 'What is a porcelain veneer/lumineer?',
    answer:
      'Porcelain veneer or lumineer is a very thin shell (thin like an egg shell) made of ceramic material attached on front side of your tooth . Your tooth might need a minimal or no preparation before the treatment, depending on the effect you would like to reach.',
    category: 'VENEERS',
  },
  {
    question: 'What is a crown and how would the tooth be prepared for treatment?',
    answer:
      'Crown is a cap (made of different materials, from metal to full ceramic) that replaces your natural tooth structure. Your original tooth needs to be prepared in advance (certain thickness of your tooth structure is removed by the dentist in order to create space for the crown) and the crown is cemented/attached on top of it.',
    category: 'CROWNS_BRIDGES',
  },
  {
    question: 'What is a provisional crown?',
    answer: 'Provisional crown is an acrylic or a composite crown fitted until the final crown is produced.',
    category: 'CROWNS_BRIDGES',
  },
  {
    question: 'What is a bridge?',
    answer:
      'Bridge is done when one or more of your teeth are missing. The teeth closest to the gap are prepared (certain thickness of the tooth structure is removed by the dentist to create space for anchoring the crown that replaces the missing tooth) and the bridge is cemented/attached in place.',
    category: 'CROWNS_BRIDGES',
  },
  {
    question: 'What is an implant crown?',
    answer:
      'When you are missing one or more teeth the dentist place an implant into your jaw, and afterwards a crown or a bridge is constructed to replace your teeth. This way you do not need to ‘prepare’ other teeth for the treatment.',
    category: 'IMPLANTS',
  },
  {
    question: 'What is a ceramic inlay/onlay',
    answer:
      'Instead of a black or composite filling, a ceramic filling (called inlay) is created in the laboratory and attached in the cavity (left after the caries were removed) by the dentist. Ceramic fillings are not visible and long lasting.',
    category: 'GENERAL',
  },
  {
    question: 'What is diagnostic wax up?',
    answer:
      'The impressions of your teeth taken by the dentist are used by the laboratory to make a plaster model of your teeth. The model is then used to make ‘mock-up’ teeth made of wax in order to see how your future smile will look like and to ensure the utmost precision of the work. These ‘mock-up’ wax teeth can also be used for construction of temporary crowns.',
    category: 'TREATMENT',
  },
  {
    question: 'What is a Facial Analysis and Digital Smile Design?',
    answer: 'From your portrait photograph we can analyse and digitally correct the problematic issues of your smile.',
    category: 'GENERAL',
  },
  {
    question: 'How much will the new smile cost?',
    answer:
      'The price depends on the type of work that needs to be done. Please contact us to get price estimation.',
    category: 'COST',
  },
  {
    question: 'Do I need to change my dentist when I decide to make changes?',
    answer: 'You do not have to change your current dentist. Please contact us to get more information.',
    category: 'GENERAL',
  },
];

export const SMILE_CHECK_QUESTIONS = [
  'Are your teeth crooked, rotated or uneven?',
  'Are your teeth chipped?',
  'Did you lose any teeth?',
  'Would you like to change the colour of your teeth? Are they yellow? Would you like to have them brighter?',
  'Are your teeth worn down?',
  'Do you have old discoloured composite fillings or black amalgam fillings?',
  'Do you feel like not showing your full smile when a photograph is taken?',
  'Do you already have crowns or bridges with an unnatural/odd appearance?',
  'Would you like to change the shape (length, form) of your teeth?',
  'Do you have gaps (diasthemas) between teeth?',
  'Is there too much gum visible while smiling?',
];

export const DIRECTOR_MILESTONES = [
  { period: 'January 2013 - present', role: 'Director at Dental Atelier Michal Siakel', place: 'Brussels, Belgium' },
  { period: 'January 2010 - December 2012', role: 'Director at Ceramic Design GmbH', place: 'Weinheim, Germany' },
  { period: 'April 2007 - December 2009', role: 'Dental technician (self-employed)', place: 'Weinheim, Germany' },
  { period: 'April 2005 - March 2007', role: 'Dental technician at Smiledent Ltd.', place: 'Dublin, Ireland' },
  { period: 'July 2002 - January 2005', role: 'Dental technician at Eurodent Medima', place: 'Martin, Slovakia' },
];

export const COURSES = [
  '12unit zirconia bridge with pink porcelain led by Luke Hasegawa, Baden-Baden, Germany',
  'eLAB course led by Irmen de Vries and Cai Verweij, Beilen, Netherlands',
  'Key Effects: Concept & Application of Willi Geller Creation System led by Naoki Aiba , Meiningen, Austria',
  'Platinum foil Veneers course led by Erik Mentink, Leuven, Belgium',
  'Old Fashioned - a platinum foil course led by Claus-Peter Schulz, Baden Baden , Germany',
  'Advanced Anterior Course led by Murilo Calgaro, Stuttgart, Germany',
  'Digital Smile Design led by Christian Coachman, Winnenden, Germany',
  'Function & Aesthetic led by Alf-Henry Magnusson and Udo Plaster, Gaggenau, Germany',
  'Form, Surface and Texture led by Bertrand Thievent, Stuttgart, Germany',
  'Ivoclare Vivadent Emax Ceramic Course led by Claudio Joss, Schaan, Lichtenstein',
];

export const GALLERY = [
  { title: 'Smile transformation - before', url: '/images/before.jpg', altText: 'Close-up of a patient smile before treatment', category: 'before', order: 1 },
  { title: 'Smile transformation - after', url: '/images/after.jpg', altText: 'Close-up of the same patient smile after ceramic restoration', category: 'after', order: 2 },
  { title: 'Laboratory', url: '/images/lab-1.jpg', altText: 'Dental Atelier laboratory bench', category: 'lab', order: 3 },
  { title: 'Laboratory', url: '/images/lab-2.jpg', altText: 'Ceramic work in progress in the laboratory', category: 'lab', order: 4 },
  { title: 'Laboratory', url: '/images/lab-3.jpg', altText: 'Technician working on a ceramic restoration', category: 'lab', order: 5 },
  { title: 'Laboratory', url: '/images/lab-4.jpg', altText: 'Shade matching session at the atelier', category: 'lab', order: 6 },
  { title: 'Laboratory', url: '/images/lab-5.jpg', altText: 'Precision milling of a zirconia bridge', category: 'lab', order: 7 },
  { title: 'Laboratory', url: '/images/lab-6.jpg', altText: 'Finished ceramic crowns ready for delivery', category: 'lab', order: 8 },
  { title: 'Ceramic veneer case', url: '/images/smile-sexy-1.jpg', altText: 'Patient smile after six ceramic veneers', category: 'smile', order: 9 },
  { title: 'Smile makeover', url: '/images/smile-sexy-2.jpg', altText: 'Digital smile design preview on a portrait photograph', category: 'smile', order: 10 },
  { title: 'Implant crown', url: '/images/smile-sexy-3.jpg', altText: 'Ceramic implant crown replacing a missing front tooth', category: 'smile', order: 11 },
  { title: 'Shade consultation', url: '/images/smile-comfort-1.jpg', altText: 'Custom colour shading appointment', category: 'smile', order: 12 },
  { title: 'Ceramic inlays', url: '/images/smile-comfort-2.jpg', altText: 'Ceramic inlays replacing discoloured composite fillings', category: 'smile', order: 13 },
  { title: 'Ceramic bridge', url: '/images/smile-comfort-3.jpg', altText: 'Fully ceramic bridge in the lower jaw', category: 'smile', order: 14 },
  { title: 'Crowns and bridges', url: '/images/smile-young-1.jpg', altText: 'Ceramic crowns restoring worn teeth', category: 'smile', order: 15 },
  { title: 'Full smile makeover', url: '/images/smile-young-2.jpg', altText: 'Complete smile makeover result', category: 'smile', order: 16 },
  { title: 'Younger looking smile', url: '/images/smile-young-3.jpg', altText: 'Patient looking younger after ceramic restoration', category: 'smile', order: 17 },
  { title: 'Smile check', url: '/images/smile-check-1.jpg', altText: 'Patient checking their smile in a mirror', category: 'smile-check', order: 18 },
  { title: 'Natural smile', url: '/images/smile-check-2.jpg', altText: 'Close-up of a natural looking ceramic smile', category: 'smile-check', order: 19 },
];

export const PORTFOLIO_BEFORE_AFTER = {
  intro: 'You will find a wide array of products of superb quality and prime aesthetic value.',
  secondary:
    'You can also check out the extended description of the products with a list of materials they are made of.',
  downloadNote: 'Please download a wider portfolio of our recent works.',
};

/**
 * Page inventory. `seo` values are new — the legacy site shipped a single
 * description on every page (and none at all on most), which is fixed here.
 */
export const PAGES = [
  {
    slug: '/',
    key: 'home',
    title: 'A state-of-the-art laboratory',
    heading: 'A state-of-the-art laboratory',
    description:
      'Dental Atelier is a state-of-the-art dental laboratory in Brussels. Ceramics, veneers, crowns and bridges designed from facial analysis and digital smile design.',
  },
  {
    slug: 'about-us',
    key: 'about-us',
    title: 'About – Dental Atelier',
    heading: 'About Dental Atelier',
    description:
      'Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind. Meet Michal Siakel, our director, and read about our latest courses and mission.',
  },
  {
    slug: 'products-and-materials',
    key: 'products-and-materials',
    title: 'Products & Materials',
    heading: 'Products & Materials',
    description:
      'Facial analysis, diagnostic wax up, provisional crowns, crowns and bridges, implant solutions, inlays/onlays and veneers — all made with certified materials from leading manufacturers.',
  },
  {
    slug: 'services',
    key: 'services',
    title: 'Services',
    heading: 'Services',
    description:
      'Price estimation, free consultation, custom colour shading, digital smile design, pick-up and delivery and diagnostic case planning at Dental Atelier, Brussels.',
  },
  {
    slug: 'portfolio',
    key: 'portfolio',
    title: 'Portfolio',
    heading: 'Portfolio',
    description:
      'Before and after smile transformations produced by Dental Atelier: a wide array of products of superb quality and prime aesthetic value.',
  },
  {
    slug: 'faqs',
    key: 'faqs',
    title: 'FAQs',
    heading: 'FAQs',
    description:
      'Answers about porcelain veneers, crowns, bridges, implant crowns, ceramic inlays, diagnostic wax up, digital smile design and treatment costs.',
  },
  {
    slug: 'contact-us',
    key: 'contact-us',
    title: 'Contact Us',
    heading: 'Contact us',
    description:
      'Contact Dental Atelier Michal Siakel: Rue du Bourdon 100/8, 1180 Uccle, Brussels. Mobile +32 478 54 74 75, phone +32 2 376 43 26.',
  },
  {
    slug: 'sexy-and-powerful-smile',
    key: 'sexy-and-powerful-smile',
    title: 'Sexy & powerful smile',
    heading: 'Sexy and powerful smile',
    description:
      'How smile aesthetics affect confidence, what a positive smile line is, and how veneers and crowns can improve crooked, gapped or discoloured teeth in weeks instead of years.',
  },
  {
    slug: 'comfort-and-self-confidence',
    key: 'comfort-and-self-confidence',
    title: 'Comfort & Self-confidence',
    heading: 'Comfort and self confidence',
    description:
      'Chipping, discoloured fillings, gaps and worn enamel hold people back from smiling. Ceramic inlays, veneers and crowns are the easy solution.',
  },
  {
    slug: 'looking-young-feeling-healthy',
    key: 'looking-young-feeling-healthy',
    title: 'Looking young, feeling healthy',
    heading: 'Looking young, feeling healthy',
    description:
      'Teeth get more translucent, discoloured and worn with age. Veneers, crowns, bridges and implants reverse most of it — and support the jaw bone.',
  },
  {
    slug: 'facial-analysis-and-digital-smile-design',
    key: 'facial-analysis',
    title: 'Facial analysis and Digital Smile Design',
    heading: 'Facial analysis and Digital Smile Design',
    description:
      'We measure the biometrical features of your face, analyse it digitally and show you on your portrait photograph what your new smile will look like before treatment starts.',
  },
  {
    slug: 'smile-check-form',
    key: 'smile-check',
    title: 'Smile check form',
    heading: 'Ready for your smile check?',
    description:
      'Answer eleven short questions about your teeth and find out what bothers you about your smile — then request a free consultation.',
  },
  {
    slug: 'testimonials',
    key: 'testimonials',
    title: 'Testimonials',
    heading: 'What our patients say',
    description:
      'Unedited feedback from patients of Dental Atelier about crowns, veneers, implant bridges and full smile makeovers.',
  },
];

/** Admin-editable settings, mirrored into the Setting table by the seed. */
export const SETTINGS = [
  { key: 'site.name', value: SITE.name, group: 'general' },
  { key: 'site.legalName', value: SITE.legalName, group: 'general' },
  { key: 'site.tagline', value: SITE.tagline, group: 'general' },
  { key: 'site.description', value: SITE.description, group: 'general' },
  { key: 'site.url', value: SITE.url, group: 'general' },
  { key: 'site.ogImage', value: SITE.ogImage, group: 'general' },
  { key: 'contact.email', value: SITE.email, group: 'contact' },
  { key: 'contact.mobile', value: SITE.mobile, group: 'contact' },
  { key: 'contact.phone', value: SITE.phone, group: 'contact' },
  { key: 'contact.vat', value: SITE.vat, group: 'contact' },
  { key: 'contact.address', value: SITE.address.lines.join('\n'), group: 'contact' },
  { key: 'contact.mapEmbed', value: SITE.mapEmbed, group: 'contact' },
  { key: 'contact.mapDirections', value: SITE.mapDirections, group: 'contact' },
  { key: 'social.facebook', value: SITE.facebook, group: 'social' },
  { key: 'booking.openingHours', value: 'Monday to Friday, 09:00 - 17:00', group: 'booking' },
  { key: 'booking.leadTimeHours', value: '24', group: 'booking' },
  { key: 'booking.cancellationNotice', value: '24', group: 'booking' },
];