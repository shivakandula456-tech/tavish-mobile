/* TAVISH & CO. — initial static site settings */
window.TAVISH_SEED_SETTINGS = {
  brand: {
    name: 'TAVISH & CO.',
    tagline: 'Jewellery shaped by Indian heritage, made for now.',
    shortDescription: 'TAVISH & CO. is a contemporary Indian jewellery house working in gold tones, pearls and hand-set stones — anti-tarnish essentials, Korean-inspired edits and festive heirlooms.',
    logo: 'assets/images/brand/tavish-co-logo.png',
    logoAlt: 'TAVISH & CO. logo'
  },
  contact: {
    email: 'tanvianikhindi281@gmail.com',
    whatsappNumber: '919137961623',
    whatsappDisplay: '+91 91379 61623',
    location: 'New Kalyani Nagar, Pune, Maharashtra - 411014',
    locationNote: 'New Kalyani Nagar, Pune, Maharashtra - 411014.',
    hours: 'Monday – Saturday, 10:00 – 19:00 IST'
  },
  commerce: {
    currency: 'INR',
    currencySymbol: '₹',
    freeShippingAbove: 2499,
    shippingFee: 99,
    cashOnDelivery: true,
    codMaxOrderValue: 50000,
    dispatchDays: '2 – 4 working days',
    deliveryEstimate: '5 – 9 working days across India',
    returnsWindowDays: 7,
    cancellationWindowHours: 24
  },
  social: {
    instagram: 'https://www.instagram.com/tavishandco_/?vrfl=MXJ6anJ6cTBjcXpjOQ%3D%3D&utm_source=qr'
  },
  seo: {
    base: 'https://tavishandco.example',
    defaultTitle: 'TAVISH & CO. | Contemporary Indian Jewellery',
    defaultDescription: 'Discover TAVISH & CO. — anti-tarnish essentials, Korean-inspired edits and festive Indian jewellery crafted in gold tones, pearls and hand-set stones. Cash on delivery available across India.',
    ogImage: 'assets/images/hero/hero-poster.jpg'
  },
  admin: {
    note: 'Admin access is available only through configured Supabase Auth and database policies.'
  },
  disclaimer: {
    orders: 'Orders on this static website are saved in your browser\'s localStorage. No order data is transmitted to a server in this static architecture.',
    admin: 'Catalogue administration uses Supabase Auth and row-level security when configured. Local-only mode does not provide an Admin login.',
    imagery: 'The initial catalogue uses temporary stock/reference imagery for layout and visual styling. Replace it with final TAVISH & CO. product photography before launch.'
  }
};
