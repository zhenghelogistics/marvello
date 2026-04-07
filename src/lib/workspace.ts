// Zhenghe Logistics — Workspace Configuration
// This is your business profile as Marvello understands it.
// It drives content strategy, agent prompts, and platform priorities.

export const workspace = {
  business: {
    name: 'Zhenghe Logistics',
    tagline: 'End-to-End Freight Forwarding & 3PL Solutions',
    description:
      'A full-service ("bao ga liao") freight forwarding and third-party logistics company — handling sea freight (FCL/LCL), air freight, customs clearance, documentation, and warehousing/fulfillment end-to-end.',
    industry: 'Freight Forwarding & Logistics',
    stage: 'early' as const,
  },

  services: [
    { id: 'sea', label: 'Sea Freight', detail: 'FCL & LCL ocean shipping', icon: '🚢' },
    { id: 'air', label: 'Air Freight', detail: 'Express and standard air cargo', icon: '✈️' },
    { id: 'customs', label: 'Customs Clearance', detail: 'Import/export docs & duties', icon: '📋' },
    { id: 'warehouse', label: 'Warehousing & Fulfillment', detail: '3PL storage, pick & pack, last-mile', icon: '🏭' },
    { id: 'docs', label: 'Documentation', detail: 'Bill of lading, COO, permits, etc.', icon: '📄' },
  ],

  audience: [
    { id: 'importers', label: 'Importers & Exporters', priority: 1, description: 'Primary lead target — businesses shipping goods internationally' },
    { id: 'ecom', label: 'E-commerce Brands', priority: 2, description: 'Online sellers needing fulfillment, warehousing, last-mile' },
    { id: 'scm', label: 'Supply Chain Managers', priority: 3, description: 'Decision-makers at mid-to-large companies' },
    { id: 'peers', label: 'Freight & Logistics Peers', priority: 4, description: 'Industry credibility and network building' },
  ],

  platforms: [
    {
      id: 'linkedin' as const,
      priority: 1,
      goal: 'Primary lead generation — B2B decision-makers, importers, supply chain managers',
      postFrequency: '4x / week',
      contentSplit: { educational: 40, commentary: 30, caseStudy: 20, behindScenes: 10 },
    },
    {
      id: 'instagram' as const,
      priority: 2,
      goal: 'Brand awareness + reach e-commerce brands visually',
      postFrequency: '3x / week',
      contentSplit: { educational: 30, behindScenes: 40, social: 30 },
    },
    {
      id: 'facebook' as const,
      priority: 3,
      goal: 'Community + retargeting importers/exporters in groups',
      postFrequency: '2x / week',
      contentSplit: { educational: 50, commentary: 30, promo: 20 },
    },
  ],

  contentSeries: {
    name: 'The Trusted Route',
    platform: 'LinkedIn Articles',
    angle: 'Educational + Industry Commentary',
    description: 'Long-form articles that demystify freight for business owners and importers — plus expert takes on supply chain trends, trade disruptions, and global logistics.',
    cadence: 'Bi-weekly',
    topics: [
      'FCL vs LCL — which one does your business actually need?',
      'How customs clearance works (and what causes delays)',
      'Why your freight quote keeps changing — 6 factors most importers don\'t know',
      'Air vs sea freight: the real cost breakdown',
      'What is a 3PL and does your business need one?',
      'Incoterms explained for non-logistics people',
      'Port congestion: what it is, and how to protect your shipment',
    ],
  },

  primaryGoal: 'lead-generation' as const,

  contentPillars: [
    {
      id: 'education',
      label: 'Educate the Shipper',
      description: 'Break down freight and logistics concepts for importers and business owners who didn\'t study supply chain. This builds trust and positions Zhenghe as the expert.',
      weight: 40,
      exampleAngles: [
        'What happens after you book a shipment?',
        'The hidden costs of sea freight',
        'FCL vs LCL decision guide',
        'Customs red flags to avoid',
      ],
    },
    {
      id: 'commentary',
      label: 'Industry Commentary',
      description: 'Your take on supply chain news — port disruptions, trade policy, freight rate trends. Shows you\'re plugged in and thinking ahead for your clients.',
      weight: 25,
      exampleAngles: [
        'What the Suez/Red Sea situation means for shipping costs',
        'Why freight rates are spiking in Q2',
        'How new tariffs affect importers from China',
      ],
    },
    {
      id: 'social-proof',
      label: 'Case Studies & Results',
      description: 'Anonymized or named stories of problems Zhenghe solved. The most powerful lead generation content.',
      weight: 20,
      exampleAngles: [
        'How we cleared a stuck shipment in 24 hours',
        'E-commerce brand reduces fulfillment cost by 30%',
        'What we do differently for first-time importers',
      ],
    },
    {
      id: 'behind-scenes',
      label: 'Behind the Scenes',
      description: 'The warehouse, the team, day-in-the-life content. Humanises the brand and builds trust.',
      weight: 15,
      exampleAngles: [
        'A day in our warehouse',
        'How we handle Chinese New Year disruption',
        'Meet the team',
      ],
    },
  ],

  brandVoice: {
    tone: 'Professional but plain-spoken. No jargon unless you\'re explaining it. We make logistics feel less scary and more manageable.',
    avoid: ['Overly formal corporate-speak', 'Unexplained acronyms (always define FCL, LCL, 3PL, etc.)', 'Vague promises without specifics'],
    always: ['Practical takeaways', 'Specific examples over abstract claims', 'A clear CTA or next step on lead-gen posts'],
  },
}

export type WorkspaceConfig = typeof workspace
