/**
 * Legal documents for Donjo (Privacy Policy, Terms of Use, Cookie and Local-Storage Notice).
 *
 * SELF-CONTAINED ON PURPOSE: this file imports nothing so the same text can be copied verbatim
 * into the Donjo app (hr.donjoafrica.com). Render `blocks` however suits the host UI.
 *
 * IMPORTANT: this is a comprehensive TEMPLATE written for a Kenya-based SaaS. It MUST be reviewed
 * by a Kenyan lawyer before it is relied on. Every fact we do not know is a TODO(owner) placeholder
 * in LEGAL_ENTITY below; nothing has been invented.
 *
 * Tokens: write {{entity.<field>}} in text; call resolveTokens() to substitute. Missing facts render
 * as PLACEHOLDER so they are visible, not silently blank.
 */

export const PLACEHOLDER = "[to be confirmed]";

export const LEGAL_ENTITY = {
  // TODO(owner): registered legal name of the company/business that operates Donjo.
  name: null as string | null,
  // TODO(owner): registered (physical) address, including city and country.
  address: null as string | null,
  // TODO(owner): company / business registration number.
  registrationNumber: null as string | null,
  // TODO(owner): registration number with the Office of the Data Protection Commissioner (ODPC), if registered.
  odpcRegistrationNumber: null as string | null,
  // TODO(owner): a dedicated privacy/DPO mailbox. Until then the general contact below is used.
  dpoEmail: null as string | null,
  // Existing public contact channels (already published on the website).
  contactEmail: "makamubetsy@gmail.com",
  whatsapp: "+254 113 881 734",
  websiteUrl: "https://donjoafrica.com",
  appUrl: "https://hr.donjoafrica.com",
  // TODO(owner): confirm governing law and venue (drafted as Kenya / Nairobi).
  governingLaw: "the laws of Kenya",
  disputeVenue: "Nairobi, Kenya",
};

// TODO(owner): confirm the effective date once a lawyer has approved the text.
export const LEGAL_EFFECTIVE_DATE = "2026-09-30";
export const LEGAL_UPDATED_DATE = "2026-09-30";
export const LEGAL_EFFECTIVE_LABEL = "30 September 2026";

export function resolveTokens(text: string): string {
  return text.replace(/\{\{entity\.(\w+)\}\}/g, (_, key: string) => {
    const v = (LEGAL_ENTITY as Record<string, string | null>)[key];
    return v ? v : PLACEHOLDER;
  });
}

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "defs"; items: { term: string; def: string }[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][] }
  | { type: "note"; text: string };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: "privacy" | "terms" | "cookies";
  title: string;
  /** Short plain-language summary shown in a box at the top. */
  summary: string[];
  sections: LegalSection[];
}

/* ------------------------------------------------------------------------------------------ */
/* PRIVACY POLICY                                                                             */
/* ------------------------------------------------------------------------------------------ */

export const privacyPolicy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  summary: [
    "We collect only what we need to run Donjo: your account, the proof you choose to share, and basic technical data to keep the service safe.",
    "Your videos are private or public by your choice. Employers and reviewers see what you submit to them, not more.",
    "Passkeys never send your fingerprint or face to us. Your device keeps biometrics; we store only a public key.",
    "We do not sell personal data, and no hiring decision is made solely by an algorithm.",
    "You can ask to see, fix, export or delete your data at any time. Email us and we will act.",
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are and what this policy covers",
      blocks: [
        { type: "p", text: "Donjo is a video-first, proof-of-work hiring platform for Kenya and East Africa. This Privacy Policy explains how personal data is handled when you visit our website ({{entity.websiteUrl}}) or use the Donjo application ({{entity.appUrl}}), together called the Service." },
        { type: "p", text: "The controller of your personal data is {{entity.name}}, of {{entity.address}} (company registration number {{entity.registrationNumber}}). In this policy, \"Donjo\", \"we\", \"us\" and \"our\" mean that controller." },
        { type: "p", text: "We handle personal data in line with the Kenya Data Protection Act, 2019 and its Regulations. Where the law of the European Economic Area or the United Kingdom applies to you, we also respect the GDPR and UK GDPR rights described below." },
      ],
    },
    {
      id: "definitions",
      title: "Definitions",
      blocks: [
        {
          type: "defs",
          items: [
            { term: "Personal data", def: "Any information that identifies you or can reasonably be linked to you." },
            { term: "Processing", def: "Anything done with personal data, such as collecting, storing, using, sharing or deleting it." },
            { term: "Controller", def: "The party that decides why and how personal data is processed. For the Service, that is Donjo." },
            { term: "Processor", def: "A party that processes personal data on our behalf and on our instructions, such as a hosting provider." },
            { term: "Applicant", def: "A person who creates a profile, records proof clips or applies to jobs, challenges or programmes." },
            { term: "Employer", def: "An organisation or person who posts jobs or challenges and reviews applicants." },
            { term: "Founder", def: "A person who submits a venture application to a programme." },
            { term: "Admin or Reviewer", def: "A Donjo-authorised person who reviews applications and manages the Service." },
            { term: "Proof content", def: "Videos, audio, images, pitch decks, documents and text you submit to the Service." },
            { term: "ODPC", def: "The Office of the Data Protection Commissioner of Kenya." },
          ],
        },
      ],
    },
    {
      id: "data-we-collect",
      title: "Personal data we collect",
      blocks: [
        { type: "p", text: "What we collect depends on how you use the Service. We collect it from you directly, from your use of the Service, and (where you choose to use them) from sign-in providers." },
        {
          type: "table",
          caption: "Categories of personal data, examples and where they come from",
          head: ["Category", "Examples", "Source"],
          rows: [
            ["Account and profile", "Name, username, email, password (stored hashed), account role, bio, skills, avatar, links", "You"],
            ["Proof content", "Video and audio clips, thumbnails, titles and descriptions, pitch decks, privacy settings", "You"],
            ["Venture and application data", "Venture name, stage, industry, problem and solution, traction, team role, job or challenge applications, cover messages", "You"],
            ["Employer and company data", "Company name, size, industry, logo, website, job postings, challenges, shortlists and notes", "You"],
            ["Messages and notifications", "Messages between employers and applicants, in-app notifications", "You and other users"],
            ["Location", "County or country you choose to provide; approximate country derived from your time zone", "You and your device"],
            ["Usage and analytics", "Pages viewed, referrer, campaign tags, device class, approximate country, interaction events", "Your device (see Analytics)"],
            ["Device and technical", "Browser and operating-system family, language, screen size class, security logs, error reports", "Your device"],
            ["Passkey credentials", "WebAuthn credential ID and public key, signature counter", "Your device (public data only)"],
            ["Contact and partnership requests", "Name, organisation, email, phone, message you send through website forms", "You"],
            ["Enquiries by WhatsApp or email", "Content of messages you send us", "You"],
          ],
        },
        { type: "p", text: "We do not knowingly collect special categories of personal data (such as health, religion or ethnicity). Please do not include them in your proof content or messages unless you choose to. We do not collect payment card numbers on the website." },
      ],
    },
    {
      id: "biometrics-passkeys",
      title: "Passkeys and biometric data",
      blocks: [
        { type: "p", text: "Donjo supports passkeys (WebAuthn) as a way to sign in. When you use a passkey, your device (or password manager or security key) checks your fingerprint, face, PIN or pattern locally. That biometric information never leaves your device and is never sent to, or stored by, Donjo." },
        { type: "p", text: "Donjo stores only the public part of the credential: a credential identifier, a public key and a signature counter. These cannot be used to reconstruct your biometrics. You can remove a passkey at any time in your account settings." },
        { type: "note", text: "Passkey sign-in is being rolled out. Until it is available in your account, sign-in uses the methods shown on the sign-in page." },
      ],
    },
    {
      id: "purposes-lawful-bases",
      title: "How and why we use personal data",
      blocks: [
        { type: "p", text: "We use personal data only for specified purposes and only where we have a lawful basis. The table below shows each purpose, the data involved, our lawful basis, how long we keep the data, and who it is shared with." },
        {
          type: "table",
          caption: "Purposes, lawful bases, retention and sharing",
          head: ["Purpose", "Data", "Lawful basis", "Retention", "Shared with"],
          rows: [
            ["Create and run your account", "Account and profile, passkey credentials", "Contract", "While your account is active, then up to 30 days to complete deletion", "Processors (hosting, storage)"],
            ["Host and display your proof content", "Proof content, profile", "Contract; consent for public visibility", "Until you delete it or your account", "Employers, reviewers and the public, as you choose"],
            ["Process applications, challenges and venture reviews", "Application and venture data, proof content", "Contract; legitimate interests", "For the life of the programme plus up to 24 months", "The employer or programme you applied to; Admins"],
            ["Enable messaging and notifications", "Messages, notifications", "Contract", "While your account is active", "The other participants in the conversation"],
            ["Generate applicant dossiers and reports", "Names, roles, portfolio links", "Legitimate interests; contract", "Generated on demand; not retained by us", "Authorised employers and Admins"],
            ["Respond to enquiries and partnership requests", "Contact and partnership requests", "Legitimate interests; steps at your request", "Up to 24 months after the last contact", "Our team and hosting processors"],
            ["Keep the Service secure and prevent abuse", "Device and technical, security logs", "Legitimate interests; legal obligation", "Up to 12 months", "Processors; authorities where required by law"],
            ["Understand and improve the Service (first-party analytics)", "Usage and analytics (no IP address stored)", "Legitimate interests; consent where required", "Up to 13 months, then aggregated or deleted", "Not shared outside Donjo and its processors"],
            ["Send service messages", "Name, email", "Contract", "While your account is active", "Email provider, when enabled"],
            ["Marketing updates (only if you opt in)", "Name, email", "Consent", "Until you withdraw consent", "Email provider, when enabled"],
            ["Comply with the law and protect legal rights", "Any data needed", "Legal obligation; legitimate interests", "As long as the law requires", "Regulators, courts, advisers"],
          ],
        },
        { type: "p", text: "Where we rely on consent (for example to make a video public, or for optional marketing), you can withdraw it at any time. Withdrawal does not affect processing that happened before you withdrew." },
        { type: "p", text: "Where we rely on legitimate interests, we weigh them against your rights and freedoms. You can object to this processing (see Your rights)." },
      ],
    },
    {
      id: "video-and-sharing-controls",
      title: "Your videos and who can see them",
      blocks: [
        { type: "p", text: "Video is at the heart of Donjo, so we give you control over it:" },
        {
          type: "ul",
          items: [
            "Public videos appear on your profile and can be seen by anyone who can visit it, including employers.",
            "Private videos are visible only to you, unless you submit them to a specific job, challenge, venture application or programme, in which case the receiving employer, programme and authorised Admins can view them.",
            "Submitting proof to an employer or programme is your choice. You should only submit what you are comfortable sharing with them.",
            "Employers can shortlist applicants and add private notes. Those notes are visible to the employer and authorised Donjo staff, not to the applicant.",
            "Other viewers may like, comment on, or save public videos. Comments are visible with your username.",
          ],
        },
        { type: "p", text: "If you record other people, you must have their permission (see our Terms of Use). Tell us if content about you was posted without your permission and we will review it promptly." },
      ],
    },
    {
      id: "analytics",
      title: "Analytics",
      blocks: [
        { type: "p", text: "We aim to understand how the Service is used without tracking individuals. Where we run analytics, they are first-party (operated by us, not an advertising network), do not use cookies, and do not store your IP address. They record events such as pages viewed, the referring website, campaign tags, device class, approximate country (from your time zone) and interactions such as clicking a call-to-action." },
        { type: "ul", items: ["We respect the Do Not Track signal: if your browser sends it, we do not run analytics for you.", "An anonymous random identifier may be held in your browser's local storage so we can count repeat visits. It contains no personal data and you can clear it at any time.", "We filter obvious bots and do not build advertising profiles."] },
        { type: "p", text: "See the Cookie and Local-Storage Notice for details." },
      ],
    },
    {
      id: "cookies-storage",
      title: "Cookies and local storage",
      blocks: [
        { type: "p", text: "The public website does not set advertising or tracking cookies. The Donjo application uses browser storage to keep you signed in and remember preferences. Read the full list and how to control it in our Cookie and Local-Storage Notice." },
      ],
    },
    {
      id: "sharing-processors",
      title: "Sharing and sub-processors",
      blocks: [
        { type: "p", text: "We do not sell your personal data. We share it only as described in this policy: with the people you choose to share it with, with service providers who process it for us under written terms, and where the law requires." },
        {
          type: "table",
          caption: "Service providers (processors and sub-processors)",
          head: ["Provider", "Role", "Data involved"],
          rows: [
            ["Convex", "Application hosting, database and file storage (videos, images, documents)", "Account, proof content, application data, messages, form submissions"],
            ["Cloudflare", "Website hosting, content delivery and security filtering", "Technical data such as IP address for request routing and abuse protection"],
            ["Email provider (when enabled)", "Sending service and account emails", "Name, email address, message content"],
            ["Google or Apple sign-in (when enabled)", "Optional sign-in", "Identifier and email address provided by the provider"],
            ["WhatsApp (if you choose to message us)", "Messaging you initiate with us", "Your number and message"],
          ],
        },
        { type: "p", text: "We may also share data with professional advisers, auditors and insurers under duties of confidentiality, and with regulators, courts or law enforcement when the law requires. If Donjo is involved in a merger, financing or sale, personal data may be transferred to the successor under this policy's protections." },
      ],
    },
    {
      id: "international-transfers",
      title: "International transfers",
      blocks: [
        { type: "p", text: "Our providers may process data outside Kenya. Where we transfer personal data out of Kenya, we do so as the Kenya Data Protection Act, 2019 and its Regulations allow: to countries or providers with adequate safeguards, under contracts that require them to protect the data, or with your consent where required. For EEA and UK users, we use appropriate safeguards such as standard contractual clauses where needed." },
        { type: "p", text: "The hosting region depends on how our providers are configured. Ask us for the current regions and safeguards." },
      ],
    },
    {
      id: "retention",
      title: "How long we keep personal data",
      blocks: [
        { type: "p", text: "We keep personal data only as long as needed for the purposes above, then delete or anonymise it. Typical periods are shown in the table in the purposes section. In addition:" },
        {
          type: "ul",
          items: [
            "When you delete your account, we delete or anonymise your profile and proof content within 30 days, except what we must keep by law or to resolve disputes.",
            "Backups are overwritten on a rolling basis and deleted data drops out of backups on that cycle.",
            "Content you submitted to an employer or programme may remain with them, under their own responsibilities as a controller, unless you ask them to delete it.",
            "Security and audit logs are kept for up to 12 months unless needed longer to investigate an incident.",
          ],
        },
      ],
    },
    {
      id: "security",
      title: "How we protect personal data",
      blocks: [
        { type: "p", text: "We use technical and organisational measures appropriate to the risk, including:" },
        {
          type: "ul",
          items: [
            "Encryption in transit (HTTPS/TLS) for the Service.",
            "Role-based access control: talent, employer, founder, investor, judge and admin accounts see only what their role requires.",
            "Server-side authorisation checks on admin actions, and audit logging of sensitive administrative activity.",
            "Passkey (WebAuthn) support to reduce reliance on passwords, and hashed storage for any passwords.",
            "Rate limiting and abuse controls on public forms.",
            "Security headers and hardening on the website and edge protection through our hosting provider.",
            "Limiting staff access to personal data to those who need it, under confidentiality duties.",
          ],
        },
        { type: "p", text: "No system is perfectly secure. Please use a strong, unique password or a passkey, and tell us straight away if you suspect unauthorised access." },
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      blocks: [
        { type: "p", text: "Under the Kenya Data Protection Act, 2019 (and, where applicable, the GDPR and UK GDPR) you have the right to:" },
        {
          type: "ul",
          items: [
            "be informed about how your personal data is used (this policy);",
            "access the personal data we hold about you and receive a copy;",
            "ask us to correct inaccurate or incomplete data (rectification);",
            "ask us to delete your data (erasure) where there is no good reason for us to keep it;",
            "ask us to restrict processing in certain circumstances;",
            "receive your data in a commonly used, machine-readable format and have it transmitted to another provider where technically feasible (portability);",
            "object to processing based on legitimate interests, and to direct marketing at any time;",
            "withdraw consent at any time, where processing is based on consent;",
            "not be subject to a decision based solely on automated processing that significantly affects you.",
          ],
        },
        { type: "p", text: "These rights are not absolute and some have exceptions, for example where we must keep data by law. We will explain if we cannot fully act on a request." },
      ],
    },
    {
      id: "exercising-rights",
      title: "How to exercise your rights",
      blocks: [
        { type: "p", text: "Email {{entity.contactEmail}} (or {{entity.dpoEmail}} once a dedicated mailbox is in place), or message us on WhatsApp at {{entity.whatsapp}}. Tell us who you are and what you would like us to do. We may ask you to verify your identity to protect your data." },
        { type: "ul", items: ["We aim to respond within 30 days, and sooner where the law requires a shorter period.", "There is normally no charge. If a request is manifestly unfounded or excessive we may charge a reasonable fee or decline, and we will tell you why.", "You can also correct much of your data yourself in your account settings, and delete your videos and account there."] },
      ],
    },
    {
      id: "automated-decisions",
      title: "Automated decision-making",
      blocks: [
        { type: "p", text: "Donjo does not make hiring, shortlisting or selection decisions solely by automated means. People (employers, reviewers and Admins) watch proof content and make the decisions. Analytics and charts, such as cohort skill views, are informational aids based on tags that applicants provide, not automated ratings of a person." },
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        { type: "p", text: "The Service is intended for people aged 18 and over. We do not knowingly collect personal data from children under 18. If you believe a child has provided us with personal data, contact us and we will delete it." },
      ],
    },
    {
      id: "breaches",
      title: "Personal data breaches",
      blocks: [
        { type: "p", text: "If a personal data breach occurs that is likely to result in a real risk of harm to your rights and freedoms, we will notify the ODPC within 72 hours of becoming aware of it where the law requires, and we will notify affected individuals without unreasonable delay, describing what happened and what you can do." },
      ],
    },
    {
      id: "complaints",
      title: "Complaints",
      blocks: [
        { type: "p", text: "We would like the chance to fix any concern first, so please contact us. You also have the right to complain to the Office of the Data Protection Commissioner (Kenya), at odpc.go.ke. If you are in the EEA or UK you may complain to your local supervisory authority." },
      ],
    },
    {
      id: "contact-dpo",
      title: "Contact and data protection officer",
      blocks: [
        {
          type: "ul",
          items: [
            "Controller: {{entity.name}}",
            "Address: {{entity.address}}",
            "Registration number: {{entity.registrationNumber}}",
            "ODPC registration number: {{entity.odpcRegistrationNumber}}",
            "Privacy contact: {{entity.contactEmail}} (dedicated DPO mailbox: {{entity.dpoEmail}})",
            "WhatsApp: {{entity.whatsapp}}",
          ],
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        { type: "p", text: "We may update this policy as the Service or the law changes. The \"Last updated\" date at the top shows the current version. If we make material changes, we will give reasonable notice, for example by email or a notice in the app, before they take effect." },
      ],
    },
  ],
};

/* ------------------------------------------------------------------------------------------ */
/* TERMS OF USE                                                                               */
/* ------------------------------------------------------------------------------------------ */

export const termsOfUse: LegalDoc = {
  slug: "terms",
  title: "Terms of Use",
  summary: [
    "Donjo is a platform where people share proof of skill and organisations review it. We are not the employer, recruiter or guarantor of any outcome.",
    "You own your content. You give us a limited licence to host and show it the way you choose.",
    "Be honest, respect others and the law. No fake proof, impersonation, discrimination, harassment, scraping or malware.",
    "Employers must hire lawfully and fairly, protect applicant data, and never charge applicants a fee.",
    "These terms are governed by Kenyan law. Read the disputes section for how we resolve problems.",
  ],
  sections: [
    {
      id: "acceptance",
      title: "Acceptance and eligibility",
      blocks: [
        { type: "p", text: "These Terms of Use (\"Terms\") are an agreement between you and {{entity.name}} (\"Donjo\", \"we\", \"us\"). They govern your use of our website ({{entity.websiteUrl}}) and the Donjo application ({{entity.appUrl}}), together the \"Service\". By accessing or using the Service, creating an account, or clicking to accept, you agree to these Terms and to our Privacy Policy." },
        { type: "p", text: "You must be at least 18 years old and able to form a binding contract. If you use the Service for an organisation, you confirm you have authority to bind that organisation, and \"you\" includes it." },
      ],
    },
    {
      id: "acceptable-use-quick",
      title: "Acceptable use: quick reference",
      blocks: [
        {
          type: "table",
          caption: "Acceptable use at a glance",
          head: ["Do", "Do not"],
          rows: [
            ["Share genuine work you created or have permission to share", "Post fake, misleading or plagiarised proof, or impersonate anyone"],
            ["Get permission before recording other people", "Record or upload anyone without their consent, or content that infringes others' rights"],
            ["Treat applicants and reviewers with respect", "Harass, discriminate, threaten or abuse others"],
            ["Hire lawfully and keep applicant data confidential", "Demand fees from applicants or misuse their data"],
            ["Protect your credentials and passkeys", "Share accounts, or attempt to bypass security or access controls"],
            ["Use the Service as intended", "Scrape, reverse engineer, overload, or introduce malware"],
          ],
        },
      ],
    },
    {
      id: "definitions",
      title: "Definitions",
      blocks: [
        {
          type: "defs",
          items: [
            { term: "Applicant", def: "A user who creates a profile, submits proof content or applies to jobs, challenges or programmes." },
            { term: "Founder", def: "A user who submits a venture application to a programme." },
            { term: "Employer", def: "A user or organisation that posts jobs or challenges and reviews applicants." },
            { term: "Admin or Reviewer", def: "A person authorised by Donjo to review applications and administer the Service." },
            { term: "Content", def: "Anything you upload, record, post or send through the Service, including videos, audio, images, documents, text and messages." },
            { term: "Plan", def: "A subscription or access tier described on our pricing page or agreed in writing." },
          ],
        },
      ],
    },
    {
      id: "service-and-roles",
      title: "The Service and user roles",
      blocks: [
        { type: "p", text: "Donjo lets Applicants record and share short proof clips and portfolios, lets Founders submit venture applications, lets Employers post jobs and challenges and review applicants, and lets Admins review applications, shortlist or reject them and export applicant summaries." },
        { type: "p", text: "Features described as \"in development\" or \"on the roadmap\" are not yet available and may change or never launch. Your account role determines what you can see and do." },
      ],
    },
    {
      id: "accounts-security",
      title: "Accounts and security",
      blocks: [
        {
          type: "ul",
          items: [
            "Give accurate information and keep it up to date.",
            "Keep your password, passkeys and devices secure. You are responsible for activity under your account.",
            "Tell us immediately at {{entity.contactEmail}} if you suspect unauthorised use.",
            "One person, one account. Do not share credentials or let others use your account.",
            "We may require additional verification, and may suspend accounts that appear compromised or in breach of these Terms.",
          ],
        },
      ],
    },
    {
      id: "your-content",
      title: "Your content and licence to us",
      blocks: [
        { type: "p", text: "You keep ownership of your Content. You are responsible for it and confirm that you have the rights to it and to grant the licence below." },
        { type: "p", text: "You grant Donjo a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, process, transcode, display and share your Content solely to operate, secure and improve the Service and to make it available to the people you choose, according to your visibility and submission settings (for example public profile, or a specific job, challenge or programme). We will not use your Content for advertising or sell it. The licence ends when you delete the Content or your account, except for copies in backups for a limited time, content already shared with others under your instructions, and where we must keep it by law." },
        { type: "p", text: "We may remove or restrict Content that breaches these Terms or the law." },
      ],
    },
    {
      id: "content-standards",
      title: "Content standards and prohibited conduct",
      blocks: [
        { type: "p", text: "You must not use the Service to:" },
        {
          type: "ul",
          items: [
            "post proof, credentials, qualifications or experience that is false or misleading, or claim work that is not yours;",
            "impersonate any person or organisation, or misrepresent your affiliation;",
            "discriminate against or harass anyone, or post hateful, threatening, abusive or sexually explicit content;",
            "infringe intellectual property, privacy or other rights, or post unlawful content;",
            "scrape, harvest or bulk-download data, or use automated means to access the Service other than as we permit;",
            "reverse engineer, decompile or attempt to extract source code, except as the law allows;",
            "probe, scan or test the vulnerability of the Service, or bypass authentication, rate limits or access controls;",
            "upload malware, or disrupt or overload the Service;",
            "contact users for spam, scams, advance-fee or any unlawful purpose.",
          ],
        },
      ],
    },
    {
      id: "recording-consent",
      title: "Recording, consent and third-party rights",
      blocks: [
        { type: "p", text: "If your video, audio or images show or record other people, you must have their permission, and where required their written consent, before uploading. Do not record where recording is prohibited. Do not include confidential information you have no right to share, or third-party music, software or designs unless you have the right to use them." },
        { type: "p", text: "If you believe Content infringes your rights or shows you without consent, email {{entity.contactEmail}} with the details and we will review it promptly." },
      ],
    },
    {
      id: "employer-obligations",
      title: "Employer obligations",
      blocks: [
        { type: "p", text: "If you use the Service as an Employer, you agree that you will:" },
        {
          type: "ul",
          items: [
            "post genuine opportunities and comply with all applicable employment, equality and data protection laws;",
            "not discriminate on grounds such as ethnicity, gender, religion, disability, age or other protected characteristics;",
            "treat applicants' videos, personal data and messages as confidential and use them only to evaluate them for the role or challenge concerned;",
            "not share, sell, scrape or misuse applicant data, or contact applicants for unrelated purposes;",
            "never ask applicants to pay any fee, deposit or charge as part of an application or hiring process;",
            "respect the privacy controls and deletion requests of applicants, and act as a responsible controller of data you receive.",
          ],
        },
      ],
    },
    {
      id: "hiring-disclaimers",
      title: "Applications, challenges and hiring disclaimers",
      blocks: [
        { type: "p", text: "Donjo is a platform. We are not an employer, recruiter, employment agency or guarantor. We do not guarantee that any Applicant will be shortlisted or hired, that any Employer will hire or respond, that any challenge prize will be awarded, or that any user or claim is accurate or verified." },
        { type: "p", text: "Skills, industries and other tags are provided by users, and analytics such as cohort skill views are informational. Decisions about hiring, selection and prizes are made by people at the Employer or programme, who are solely responsible for them. Any arrangement between you and another user is between you and them." },
      ],
    },
    {
      id: "plans-payments",
      title: "Plans, payments and pricing",
      blocks: [
        { type: "p", text: "Some parts of the Service are free and some require a paid Plan. Prices, limits and features are shown on our pricing page or agreed in writing, and may change. We will give reasonable notice of price changes for existing paid subscriptions." },
        { type: "ul", items: ["Prices are shown in the currency stated and exclude applicable taxes unless we say otherwise. You are responsible for taxes that apply to you.", "Payment methods and invoicing details are confirmed when you sign up or contact us.", "Unless the law or your written agreement provides otherwise, fees already paid are not refundable.", "We may suspend paid features for non-payment after notice."] },
      ],
    },
    {
      id: "our-ip",
      title: "Donjo's intellectual property",
      blocks: [
        { type: "p", text: "The Service, including its software, design, text, logos and branding, is owned by Donjo or its licensors and protected by law. We grant you a limited, revocable, non-exclusive, non-transferable right to use the Service in accordance with these Terms. You may not copy, modify, distribute or create derivative works of the Service except as we permit." },
      ],
    },
    {
      id: "feedback",
      title: "Feedback",
      blocks: [
        { type: "p", text: "If you give us ideas or suggestions, we may use them without obligation or payment to you, provided we do not disclose your personal data or confidential information." },
      ],
    },
    {
      id: "third-parties",
      title: "Third-party services and links",
      blocks: [
        { type: "p", text: "The Service may link to or rely on third-party services (for example hosting, sign-in and messaging providers). Their terms and privacy practices apply to your use of them, and we are not responsible for them." },
      ],
    },
    {
      id: "privacy",
      title: "Privacy",
      blocks: [
        { type: "p", text: "Our Privacy Policy explains how we handle personal data and forms part of these Terms. Our Cookie and Local-Storage Notice explains browser storage." },
      ],
    },
    {
      id: "availability-changes",
      title: "Availability and changes to the Service",
      blocks: [
        { type: "p", text: "We work to keep the Service available, but we do not promise uninterrupted or error-free operation. We may modify, suspend or discontinue features, with notice where reasonable, and may perform maintenance." },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      blocks: [
        { type: "p", text: "To the fullest extent permitted by law, the Service is provided \"as is\" and \"as available\", without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, accuracy and non-infringement. Nothing in these Terms excludes warranties or rights that cannot be excluded under applicable consumer protection law." },
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      blocks: [
        { type: "p", text: "To the fullest extent permitted by law, Donjo and its directors, employees and licensors will not be liable for indirect, incidental, special, consequential or punitive damages, or for loss of profits, revenue, data, goodwill or opportunities, arising from your use of the Service." },
        { type: "p", text: "Our total liability for any claim relating to the Service is limited to the fees you paid to us for the Service in the 12 months before the claim. Nothing limits liability for fraud, death or personal injury caused by negligence, or anything that cannot lawfully be limited." },
      ],
    },
    {
      id: "indemnity",
      title: "Indemnity",
      blocks: [
        { type: "p", text: "You will indemnify and hold Donjo harmless from claims, losses and reasonable costs arising from your Content, your breach of these Terms or the law, or your infringement of another's rights, except to the extent caused by our own breach or wrongdoing." },
      ],
    },
    {
      id: "suspension-termination",
      title: "Suspension and termination",
      blocks: [
        { type: "p", text: "You may stop using the Service and delete your account at any time. We may suspend or terminate access, with notice where reasonable, if you breach these Terms, create risk or legal exposure for us or others, or where required by law. Provisions that by nature should survive (such as intellectual property, disclaimers, liability and disputes) will survive termination." },
      ],
    },
    {
      id: "export-deletion",
      title: "Data export and deletion on termination",
      blocks: [
        { type: "p", text: "Before your account closes, you may export your profile and proof content where the Service supports it, or request an export by email. After termination we delete or anonymise your data as described in the Privacy Policy, except what we must retain by law or to resolve disputes." },
      ],
    },
    {
      id: "governing-law",
      title: "Governing law and dispute resolution",
      blocks: [
        { type: "p", text: "These Terms are governed by {{entity.governingLaw}}. If a dispute arises, the parties will first try to resolve it in good faith by negotiation for at least 30 days after written notice. If unresolved, they will refer it to mediation, and if mediation fails, to arbitration seated in {{entity.disputeVenue}} under the rules then applicable to arbitration in Kenya, conducted in English. Either party may seek urgent injunctive relief from a competent court. Nothing here removes rights you have under mandatory consumer protection law." },
        // TODO(owner): a Kenyan lawyer should confirm the dispute resolution mechanism, seat and rules,
        // and the liability cap in the section above, before publication.
      ],
    },
    {
      id: "changes",
      title: "Changes to these Terms",
      blocks: [
        { type: "p", text: "We may update these Terms from time to time. The \"Last updated\" date shows the current version. For material changes we will give reasonable notice, for example by email or in the app. If you continue to use the Service after the changes take effect, you accept them." },
      ],
    },
    {
      id: "general",
      title: "General",
      blocks: [
        {
          type: "ul",
          items: [
            "Severability: if a provision is unenforceable, the rest continues in effect.",
            "Entire agreement: these Terms, the Privacy Policy and any Plan terms are the whole agreement about the Service.",
            "Assignment: you may not assign these Terms without our consent; we may assign them in connection with a merger, financing or sale.",
            "No waiver: our failure to enforce a right is not a waiver of it.",
            "Notices: we may give notice by email, in the app or on the website. You may give notice to {{entity.contactEmail}}.",
          ],
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        { type: "ul", items: ["Email: {{entity.contactEmail}}", "WhatsApp: {{entity.whatsapp}}", "Operator: {{entity.name}}, {{entity.address}}"] },
      ],
    },
  ],
};

/* ------------------------------------------------------------------------------------------ */
/* COOKIE AND LOCAL-STORAGE NOTICE                                                            */
/* ------------------------------------------------------------------------------------------ */

export const cookieNotice: LegalDoc = {
  slug: "cookies",
  title: "Cookie and Local-Storage Notice",
  summary: [
    "The Donjo website does not set advertising or tracking cookies.",
    "The Donjo app stores a small amount of data in your browser so you stay signed in and keep your preferences.",
    "If we run first-party analytics, we use an anonymous identifier in local storage, respect Do Not Track, and never store your IP address.",
    "You can clear or block browser storage at any time in your browser settings.",
  ],
  sections: [
    {
      id: "what-this-covers",
      title: "What this notice covers",
      blocks: [
        { type: "p", text: "Cookies are small text files that a website stores on your device. Local storage and similar technologies work in a similar way inside your browser. This notice explains which of these the Donjo website ({{entity.websiteUrl}}) and application ({{entity.appUrl}}) use, and your choices." },
      ],
    },
    {
      id: "what-we-use",
      title: "What we use",
      blocks: [
        {
          type: "table",
          caption: "Cookies and browser storage",
          head: ["Name or type", "Where", "Purpose", "Duration", "Category"],
          rows: [
            ["Website cookies", "Website", "None set. The public website does not use advertising or tracking cookies", "Not applicable", "Not applicable"],
            ["Authentication session tokens", "App", "Keep you signed in and secure your session", "Until you sign out or the session expires", "Strictly necessary"],
            ["Passkey and sign-in state", "App", "Complete passkey (WebAuthn) and password sign-in", "Short-lived, during sign-in", "Strictly necessary"],
            ["Interface preferences", "App", "Remember choices such as layout or dismissed notices", "Until cleared", "Functional"],
            ["Anonymous visitor identifier", "Website and app, only if analytics are enabled", "Count repeat visits without identifying you. Random value, no personal data", "Up to 13 months, or until cleared", "Analytics"],
            ["Session identifier (analytics)", "Website and app, only if analytics are enabled", "Group page views into a visit. Random value, no personal data", "Until the tab closes", "Analytics"],
          ],
        },
        { type: "note", text: "Analytics are first-party (run by us), do not use cookies, do not store your IP address, and are switched off when your browser sends Do Not Track." },
      ],
    },
    {
      id: "third-party",
      title: "Third-party storage",
      blocks: [
        { type: "p", text: "We do not embed advertising networks or social-media tracking pixels. Fonts and scripts on the website are served from our own domain. If you follow a link to a third-party service (for example WhatsApp), that service may set its own cookies under its own policy." },
      ],
    },
    {
      id: "your-choices",
      title: "Your choices",
      blocks: [
        {
          type: "ul",
          items: [
            "Turn on Do Not Track in your browser and we will not run analytics for you.",
            "Clear cookies and site data in your browser settings at any time. You may need to sign in again.",
            "Block cookies or storage in your browser. Strictly necessary items are required for the app to work while you are signed in.",
            "Use a private window to browse without keeping storage after you close it.",
          ],
        },
      ],
    },
    {
      id: "changes",
      title: "Changes and contact",
      blocks: [
        { type: "p", text: "We will update this notice if our use of storage changes; the \"Last updated\" date shows the current version. Questions: {{entity.contactEmail}}." },
      ],
    },
  ],
};

export const legalDocs = { privacy: privacyPolicy, terms: termsOfUse, cookies: cookieNotice } as const;

/** Consent version recorded on profiles. Must equal CURRENT_TERMS_VERSION in convex/lib/legal.ts. */
export const LEGAL_VERSION = LEGAL_EFFECTIVE_DATE;
