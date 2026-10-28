/**
 * Every word, product, person and number on the site lives here. Components only read from it.
 *
 * Copy marked `proposed` comes from the redesign brief and still needs William and Jabari's sign-off.
 * Any string starting with "TODO" is a placeholder; production builds fail while one remains
 * (see `assertLaunchReady` below).
 */

export type CopyStatus = "approved" | "proposed";

export interface Copy {
  text: string;
  status: CopyStatus;
}

export interface Step {
  number: string;
  title: string;
  body: string;
}

export interface Product {
  name: string;
  status: string;
  line: string;
  category: string;
  href: string;
  /** A real screenshot turns the product into a featured 2×2 tile. */
  screenshot?: { src: string; alt: string; width: number; height: number };
}

export interface TeamMember {
  slug: string;
  name: string;
  title: string;
  /** Three short paragraphs. `null` means no bio page is generated and the name is not linked. */
  bio: [string, string, string] | null;
  linkedin?: string;
}

export interface LegalSection {
  heading: string;
  /** Trusted HTML carried over from the previous privacy and terms pages. */
  html: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const site = {
  name: "Allora Foundry",
  legalName: "Allora Foundry LLC",
  url: "https://www.allorafoundry.com",
  email: "info@allorafoundry.com",
  linkedin: "https://www.linkedin.com/company/allorafoundry/",
  /** Footer and hero corner location line. `null` = omitted (open item). */
  location: null as string | null,
  description:
    "Allora Foundry is a venture studio. We help founders build and grow real products, from engineering to launch to growth.",
  googleSiteVerification: "OCNHs5NAPRCOKaxT7V58ZpqEUl_Hudt6jCcT3UYI6Gg",
} as const;

export const nav = [
  { label: "Approach", hash: "#approach" },
  { label: "Studio", hash: "#studio" },
  { label: "Founders", hash: "#founders" },
  { label: "Team", hash: "#team" },
  { label: "Contact", hash: "#contact" },
] as const;

export const hero = {
  eyebrow: "Venture Studio",
  headline: { text: "Built by operators. For founders.", status: "proposed" } satisfies Copy,
  subline: {
    text: "We help founders build and grow real products, from engineering to launch to growth.",
    status: "proposed",
  } satisfies Copy,
  cta: { label: "Build with us", hash: "#contact" },
};

export const approach = {
  eyebrow: "Our Approach",
  headline: {
    text: "We've built it before. Now we build it with you.",
    status: "proposed",
  } satisfies Copy,
  steps: [
    {
      number: "01",
      title: "Build",
      body: "Product, design and engineering, from first version to App Store.",
    },
    { number: "02", title: "Launch", body: "Positioning, go-to-market and first users." },
    { number: "03", title: "Grow", body: "Marketing, content, UGC and sales." },
  ] satisfies Step[],
};

export const capabilities = {
  eyebrow: "What We Bring",
  items: [
    "Engineering",
    "Product & Design",
    "Go-to-Market",
    "Marketing & UGC",
    "Sales",
    "Operations",
  ],
};

export const studio = {
  eyebrow: "Studio Companies",
  headline: { text: "Products we've built.", status: "proposed" } satisfies Copy,
  products: [
    {
      name: "Left Right: Photo Cleaner",
      status: "Live on App Store and Google Play",
      // Carried over from the current portfolio page.
      line: "A photo cleaner that turns years of camera roll clutter into a few minutes of swiping: left to delete, right to keep.",
      category: "Consumer",
      href: "https://www.leftrightphotocleaner.app/",
    },
  ] satisfies Product[],
};

export const founders = {
  eyebrow: "Who We Partner With",
  status: "proposed" as CopyStatus,
  items: [
    "First-time founders with a clear problem.",
    "Technical founders who need distribution.",
    "Operators with an idea and an audience.",
    "Small businesses ready to build a product.",
  ],
};

export const team = {
  eyebrow: "Team",
  members: [
    {
      slug: "william-finney",
      name: "William Finney",
      title: "Co-founder",
      bio: [
        "TODO: bio paragraph 1, supplied by William.",
        "TODO: bio paragraph 2, supplied by William.",
        "TODO: bio paragraph 3, supplied by William.",
      ],
    },
    {
      slug: "jabari-garcia",
      name: "Jabari Garcia",
      title: "Co-founder",
      bio: [
        "TODO: bio paragraph 1, supplied by Jabari.",
        "TODO: bio paragraph 2, supplied by Jabari.",
        "TODO: bio paragraph 3, supplied by Jabari.",
      ],
    },
  ] satisfies TeamMember[],
};

export const contact = {
  headline: { text: "Building something? Let's talk.", status: "proposed" } satisfies Copy,
  // Open item: form, booking link or email only. Email until decided.
  cta: { label: "Build with us", href: `mailto:${site.email}` },
};

export const legal = {
  /** Last date the legal wording changed (git history of the old privacy.html / terms.html). */
  updated: "2026-09-30",
  documents: [
    {
      id: "privacy",
      title: "Privacy Policy",
      intro:
        'This Privacy Policy explains how Allora Foundry LLC, a New Jersey limited liability company ("we," "us," or "our"), collects, uses, and protects information when you visit this website (the "Site").',
      sections: [
        {
          heading: "1. Information We Collect",
          html: "We collect information you voluntarily provide through our contact form, including your name, email address, and any message, business plan, or project details you choose to share. We do not currently use tracking cookies, analytics scripts, or third-party advertising trackers on this Site. Like most websites, our hosting provider automatically logs basic technical information for every visit — such as IP address, browser type, and access times — as a standard part of operating the Site; we do not use this information to track you individually.",
        },
        {
          heading: "2. How We Use Your Information",
          html: "We use the information you submit solely to respond to your inquiry and to evaluate potential projects or partnerships. We do not sell, rent, or share your personal information with third parties for marketing purposes. We may share information with service providers who help us operate this Site (such as our hosting provider), solely for that purpose and under obligations to protect your information.",
        },
        {
          heading: "3. Third-Party Services",
          html: 'When you submit the form on our <a class="link" href="/#contact">Build With Us</a> page, your submission is processed through Web3Forms, a third-party form-delivery service, which forwards it to us by email. We use this service only to receive and manage inquiries — not for advertising or tracking — but it is subject to its own provider\'s privacy policy in addition to this one.',
        },
        {
          heading: "4. Data Retention",
          html: "We retain contact submissions for as long as reasonably necessary to respond to your inquiry and maintain business records, after which they may be deleted.",
        },
        {
          heading: "5. Data Security",
          html: "We take reasonable measures to protect information submitted through this Site, but no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.",
        },
        {
          heading: "6. Your Rights",
          html: 'You may request that we delete or provide the information you\'ve submitted to us by contacting us at <a class="link" href="mailto:info@allorafoundry.com">info@allorafoundry.com</a>.',
        },
        {
          heading: "7. Children's Privacy",
          html: "This Site is not directed at children under 13, and we do not knowingly collect information from children.",
        },
        {
          heading: "8. Changes to This Policy",
          html: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.",
        },
        {
          heading: "9. Contact",
          html: 'Questions about this Privacy Policy can be sent to <a class="link" href="mailto:info@allorafoundry.com">info@allorafoundry.com</a>.',
        },
      ],
    },
    {
      id: "terms",
      title: "Terms of Use",
      intro:
        'These Terms of Use ("Terms") govern your use of the Allora Foundry website (the "Site"). By accessing or using the Site, you agree to these Terms. If you do not agree, please do not use the Site.',
      sections: [
        {
          heading: "1. Who We Are",
          html: 'Allora Foundry is a venture studio operated by Allora Foundry LLC, a New Jersey limited liability company. References to "Allora Foundry," "we," "us," or "our" refer to Allora Foundry LLC. This Site does not itself constitute an offer to form a business relationship, and nothing on it should be relied upon as a binding commitment.',
        },
        {
          heading: "2. Informational Purposes Only",
          html: "The content on this Site — including descriptions of our services, working models, and pricing approaches — is provided for general informational purposes only. It does not constitute a contract, proposal, or guarantee of services, pricing, equity terms, or outcomes. Any actual engagement with Allora Foundry (project work, equity arrangements, managed services, or otherwise) is governed exclusively by a separate written agreement signed by both parties.",
        },
        {
          heading: "3. No Investment or Financial Advice",
          html: "Nothing on this Site constitutes investment, legal, tax, or financial advice. Allora Foundry does not currently provide investment capital, and any reference to equity, fees, or compensation structures is illustrative only, subject to negotiation and a definitive agreement.",
        },
        {
          heading: "4. Submitted Ideas and Materials",
          html: 'If you share a business plan, product idea, pitch, or other materials with us — including through our <a class="link" href="/#contact">Build With Us</a> page or by email — you do so with the understanding that we may already be evaluating, building, or independently developing similar or related concepts. We are under no obligation to review, respond to, return, or keep confidential any materials you submit, and we do not treat submissions as confidential or proprietary unless we have agreed to do so in a separate signed agreement (such as a mutual NDA). Submitting materials to us does not create any obligation on our part to enter into a business relationship, and does not restrict our ability to pursue similar ideas independently or with others.',
        },
        {
          heading: "5. Intellectual Property",
          html: "All content on this Site — including text, graphics, logos, and the Allora Foundry name and marks — is the property of Allora Foundry LLC or its licensors and may not be copied, reproduced, or used without prior written permission.",
        },
        {
          heading: "6. Acceptable Use",
          html: "You agree not to: access or attempt to access any part of the Site through unauthorized means; interfere with or disrupt the operation of the Site; scrape, harvest, or collect data from the Site through automated means without our prior written consent; reverse engineer or attempt to extract the source code of the Site; or use the Site for any unlawful purpose. We may suspend or restrict access to the Site for anyone who violates these restrictions.",
        },
        {
          heading: "7. Third-Party Links",
          html: "This Site may link to third-party websites (including portfolio companies and partners). We do not control and are not responsible for the content, policies, or practices of those sites.",
        },
        {
          heading: "8. Disclaimer of Warranties",
          html: 'The Site is provided "as is" and "as available," without warranties of any kind, express or implied. We do not warrant that the Site will be uninterrupted, error-free, or secure.',
        },
        {
          heading: "9. Limitation of Liability",
          html: "To the fullest extent permitted by law, Allora Foundry LLC and its members shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, this Site. To the extent any liability is not excluded, our total liability to you for any claim arising from your use of the Site will not exceed $100.",
        },
        {
          heading: "10. Assignment",
          html: "You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign these Terms, in whole or in part, at our discretion.",
        },
        {
          heading: "11. Governing Law",
          html: "These Terms are governed by the laws of the State of New Jersey, without regard to its conflict of laws principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in New Jersey.",
        },
        {
          heading: "12. Changes to These Terms",
          html: "We may update these Terms from time to time. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms.",
        },
        {
          heading: "13. Contact",
          html: 'Questions about these Terms can be sent to <a class="link" href="mailto:info@allorafoundry.com">info@allorafoundry.com</a>.',
        },
      ],
    },
  ] satisfies LegalDocument[],
};

/** Pages that have their own title and description. */
export const pages = {
  home: {
    title: "Allora Foundry — Venture Studio",
    description: site.description,
  },
  legal: {
    title: "Legal — Allora Foundry",
    description: "Privacy Policy and Terms of Use for the Allora Foundry website.",
  },
  notFound: {
    title: "Page not found — Allora Foundry",
    description: "This page doesn't exist.",
  },
};

/**
 * Production builds on Vercel (`VERCEL_ENV=production`, i.e. the `main` branch) refuse to ship
 * placeholder content. Preview builds show the TODOs so they are easy to spot.
 */
export function assertLaunchReady(): void {
  if (process.env["VERCEL_ENV"] !== "production") return;
  const todos: string[] = [];
  const walk = (value: unknown, path: string): void => {
    if (typeof value === "string") {
      if (value.startsWith("TODO")) todos.push(path);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    }
  };
  walk({ site, hero, approach, capabilities, studio, founders, team, contact, legal }, "content");
  if (todos.length > 0) {
    throw new Error(`Placeholder content left in production build:\n${todos.join("\n")}`);
  }
}
