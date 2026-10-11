/* TAVISH & CO. — seed category data (static, no backend) */
window.TAVISH_SEED_CATEGORIES = [
  {
    id: 'cat-earrings',
    name: 'Earrings',
    slug: 'earrings',
    description: 'Anti-tarnish everyday studs, contemporary Korean silhouettes and festive statement earrings.',
    image: 'assets/images/products/p05-1.jpg',
    sortOrder: 1,
    visible: true,
    subcategories: [
      { id: 'sub-earrings-anti-tarnish', name: 'Anti-Tarnish', slug: 'anti-tarnish', sortOrder: 1, visible: true },
      { id: 'sub-earrings-korean', name: 'Korean', slug: 'korean', sortOrder: 2, visible: true },
      { id: 'sub-earrings-festive', name: 'Festive', slug: 'festive', sortOrder: 3, visible: true }
    ]
  },
  {
    id: 'cat-necklaces',
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Fine chains, layered Korean edits and heirloom-inspired festive necklaces.',
    image: 'assets/images/products/p11-1.jpg',
    sortOrder: 2,
    visible: true,
    subcategories: [
      { id: 'sub-necklaces-anti-tarnish', name: 'Anti-Tarnish', slug: 'anti-tarnish', sortOrder: 1, visible: true },
      { id: 'sub-necklaces-korean', name: 'Korean', slug: 'korean', sortOrder: 2, visible: true },
      { id: 'sub-necklaces-festive', name: 'Festive', slug: 'festive', sortOrder: 3, visible: true }
    ]
  },
  {
    id: 'cat-bracelets',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Sculpted kadas and slim bangle stacks made for daily wear and celebration.',
    image: 'assets/images/products/p13-1.jpg',
    sortOrder: 3,
    visible: true,
    subcategories: [
      { id: 'sub-bracelets-kadas', name: 'Kadas', slug: 'kadas', sortOrder: 1, visible: true },
      { id: 'sub-bracelets-bangles', name: 'Bangles', slug: 'bangles', sortOrder: 2, visible: true }
    ]
  },
  {
    id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    description: 'Cocktail rings, gemstone settings and minimal bands sized for Indian ring sizes.',
    image: 'assets/images/products/p17-1.jpg',
    sortOrder: 4,
    visible: true,
    subcategories: [
      { id: 'sub-rings-statement', name: 'Statement', slug: 'statement', sortOrder: 1, visible: true },
      { id: 'sub-rings-bands', name: 'Bands', slug: 'bands', sortOrder: 2, visible: true }
    ]
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Pendant chains, brooches, keepsakes and charms that complete the TAVISH look.',
    image: 'assets/images/products/p22-1.jpg',
    sortOrder: 5,
    visible: true,
    subcategories: [
      { id: 'sub-accessories-chains', name: 'Chains & Pendants', slug: 'chains-pendants', sortOrder: 1, visible: true },
      { id: 'sub-accessories-brooches', name: 'Brooches', slug: 'brooches', sortOrder: 2, visible: true },
      { id: 'sub-accessories-keepsakes', name: 'Keepsakes', slug: 'keepsakes', sortOrder: 3, visible: true },
      { id: 'sub-accessories-charms', name: 'Charms', slug: 'charms', sortOrder: 4, visible: true }
    ]
  }
];
