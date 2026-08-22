// src/data/towns.js
// Service-area pages. Every town gets genuinely unique copy — real routes,
// real drive times, and a different angle per city. This is the doorway-page
// guard from SPEC.md §6.7: never find-and-replace a town name into a template.
// Verify drive times/routes locally before launch; tune as needed.

export const towns = [
  {
    slug: 'bay-city-mi',
    name: 'Bay City',
    distance: '≈ 15 miles',
    driveTime: 'about 20 minutes',
    route: 'south on I-75 to Exit 149B, then Dixie Hwy',
    teaser:
      'A straight shot down I-75 — most Bay City customers make the drive for trucks and winter-ready AWD.',
    intro: [
      `Bay City drivers make up some of our most regular customers — and no wonder: we're a straight run down I-75, about 20 minutes door to door. Take I-75 south, get off at Exit 149B, and we're right on Dixie Hwy. That's often faster than crossing town on Wilder Road on a Saturday.`,
      `What Bay City buyers ask us for most is trucks and all-wheel-drive SUVs that can handle the Saginaw Bay winters — vehicles we inspect with exactly that in mind. Rust matters more near the bay, so on every vehicle we check the frame, brake lines, and rocker panels and put what we find in the listing. If we wouldn't drive it across the Zilwaukee Bridge in January, we don't sell it.`,
      `We're also the parts call worth making before you pay dealer prices in Bay City. Body panels color-matched to your paint code, mirrors, a transmission for an older F-150 — our network of 1,000+ partner yards means we can usually locate it in a day or two and have it waiting for you here, fifteen minutes from home.`,
    ],
    faq: {
      q: 'Do you deliver parts to Bay City?',
      a: 'Most Bay City customers grab parts on the I-75 run, but call us — for larger orders like body panels or drivetrain parts we can often arrange drop-off.',
    },
  },
  {
    slug: 'midland-mi',
    name: 'Midland',
    distance: '≈ 25 miles',
    driveTime: 'about 30 minutes',
    route: 'US-10 E to I-75 S, exit at Dixie Hwy',
    teaser:
      'Half an hour on US-10 — Midland families come to us for honest second cars and first cars for new drivers.',
    intro: [
      `From Midland, we're about half an hour: US-10 east toward Bay City, drop south on I-75, and exit at Dixie Hwy. Plenty of Midland families have decided that drive is worth it for a used car priced on its actual condition rather than its zip code.`,
      `The requests we hear most from Midland are sensible second cars, commuter sedans for the run to Dow or downtown, and safe first cars for new drivers. Those are exactly the cars we like putting on the lot: hand-inspected, with condition notes that tell you what we checked and what we fixed, so you can hand the keys to a 17-year-old without crossing your fingers.`,
      `And when something on your current car breaks, check with us before ordering new. Our nationwide parts network turns up OEM parts — often color-matched to your exact paint — at a fraction of dealership pricing, and we can have them shipped here or straight to your shop in Midland.`,
    ],
    faq: {
      q: 'Can you find a specific model for a Midland buyer?',
      a: "Yes — tell us the model, budget, and must-haves and we'll watch our sourcing channels. When the right car shows up, you get a call before it's listed.",
    },
  },
  {
    slug: 'flint-mi',
    name: 'Flint',
    distance: '≈ 35 miles',
    driveTime: 'about 35 minutes',
    route: 'north on I-75 to the Dixie Hwy exit',
    teaser:
      'Thirty-five minutes north on I-75 — Flint buyers come for transparent pricing and leave with a car that was actually inspected.',
    intro: [
      `Flint has no shortage of car lots — which is exactly why it's worth the 35-minute drive north on I-75 to see ours. Buyers who make the trip tell us the same thing: they wanted a lot where the price on the windshield is the real price and the condition notes were written by someone who actually put the car on a lift.`,
      `Every vehicle we sell is hand-inspected before it's listed, and the listing tells you what we found — what was replaced, what's wearing, what to budget for. No doc-fee surprises stacked on at the desk. If your credit has taken some hits, our financing partners work with a range of situations; bring your trade and we'll talk real numbers.`,
      `Flint's also a big part of our parts business. Between I-75 and Dort Highway there are plenty of shops that call us when they need a color-matched fender or a hard-to-find OEM part, because our 1,000+ yard network turns up pieces the local chains can't. Retail customers get the same access — request the part, and we'll quote you sourced options within a business day.`,
    ],
    faq: {
      q: 'Is the drive from Flint worth it for one car?',
      a: "Call ahead and we'll confirm the car is still on the lot, have it pulled up, and have the keys ready — so the trip is a test drive, not a gamble.",
    },
  },
  {
    slug: 'bridgeport-mi',
    name: 'Bridgeport',
    distance: 'under 5 miles',
    driveTime: 'about 5 minutes',
    route: 'straight down Dixie Hwy',
    teaser:
      "We're practically neighbors — five minutes down Dixie Hwy, and the first stop for parts in Bridgeport.",
    intro: [
      `If you're in Bridgeport, we're practically your neighborhood lot — five minutes down Dixie Hwy, no freeway required. Plenty of our walk-in traffic is Bridgeport folks who pass the lot every day and finally stop in when the right truck shows up out front.`,
      `Being this close changes how you can use us. Test drive on your lunch break. Swing by twice before deciding. Bring your mechanic. When a part you ordered lands, you're here in minutes instead of burning an afternoon. For Bridgeport customers we're less a dealership and more the car guys up the road.`,
      `We're also glad to be a first call for Bridgeport's shops and DIYers: OEM and color-matched parts through our 1,000+ yard network, usually cheaper than the dealership counter and often faster than shipping from an online warehouse you've never heard of.`,
    ],
    faq: {
      q: 'Can I just walk in?',
      a: "Absolutely — we're on Dixie Hwy with the inventory out front. Walk-ins welcome during business hours; call ahead if you want a specific car pulled up.",
    },
  },
  {
    slug: 'frankenmuth-mi',
    name: 'Frankenmuth',
    distance: '≈ 10 miles',
    driveTime: 'about 15 minutes',
    route: 'M-83 N to Dixie Hwy',
    teaser:
      'Fifteen minutes up M-83 — quality used cars without tourist-town pricing.',
    intro: [
      `Frankenmuth is fifteen minutes from our lot — up M-83, then a short hop over to Dixie Hwy. It's close enough that a test drive fits between errands, and far enough from the tourist strip that our prices have nothing to do with Main Street.`,
      `Frankenmuth customers tend to come to us for dependable daily drivers and clean SUVs — and for a straight answer about condition before they buy. Every car on our lot is hand-inspected and listed with honest notes: what we checked, what we replaced, what it needs. That's the whole pitch. It works because the cars back it up.`,
      `For anyone in Frankenmuth restoring or repairing, our parts network is the quiet advantage: over 1,000 partner yards nationwide means we can chase down discontinued trim, color-matched panels, and OEM components that would take you weeks of forum-scrolling to find on your own.`,
    ],
    faq: {
      q: 'Do you take trade-ins from Frankenmuth?',
      a: "Yes — bring the title and we'll appraise it on the spot. The fifteen-minute drive means you can do the whole deal, trade included, in one visit.",
    },
  },
];
