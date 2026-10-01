import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.string(),
    username: v.optional(v.string()),
    userType: v.optional(v.string()), // talent | employer | founder | investor | judge | admin
    skillCategory: v.optional(v.string()),
    field: v.optional(v.string()), // specific field, e.g. "Nursing"; skillCategory is its broad group
    isVerified: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    avatar: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.string()),
    aboutUs: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    cultureVideoUrl: v.optional(v.string()),
    perks: v.optional(v.array(v.string())),
    slug: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    fullName: v.optional(v.string()),
    notifyNewApplicants: v.optional(v.string()),
    notifyMarketing: v.optional(v.boolean()),
    twoFactorEnabled: v.optional(v.boolean()),
    passkeyNudgeDismissedAt: v.optional(v.number()),
    feedbackPromptedAt: v.optional(v.number()),
    feedbackGivenAt: v.optional(v.number()),
    feedbackOptOut: v.optional(v.boolean()), // "never ask me again"
    // Location (optional, encouraged). county is one of the 47 Kenyan counties, or unset
    // with country != "Kenya" for people outside Kenya.
    county: v.optional(v.string()),
    country: v.optional(v.string()),
    // Account state managed by admins. Missing = active.
    status: v.optional(v.union(v.literal("active"), v.literal("suspended"))),
    suspendedAt: v.optional(v.number()),
    suspendedReason: v.optional(v.string()),
    lastSeenAt: v.optional(v.number()),
    // Consent record (see convex/lib/legal.ts for the current version)
    termsAcceptedAt: v.optional(v.number()),
    termsVersion: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_username", ["username"]),

  // WebAuthn passkeys (one row per registered credential). `publicKey` is the
  // base64url-encoded COSE public key; `counter` is the authenticator signature counter.
  passkeys: defineTable({
    userId: v.id("users"),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
    deviceLabel: v.string(),
    deviceType: v.optional(v.string()), // singleDevice | multiDevice
    backedUp: v.optional(v.boolean()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_credentialId", ["credentialId"]),

  // Short-lived, single-use WebAuthn challenges (deleted when consumed or expired).
  webauthnChallenges: defineTable({
    challenge: v.string(), // base64url
    type: v.union(v.literal("registration"), v.literal("authentication")),
    userId: v.optional(v.id("users")), // set for registration only
    expiresAt: v.number(),
  })
    .index("by_challenge", ["challenge"])
    .index("by_expiresAt", ["expiresAt"]),

  // Append-only audit trail of privileged (admin) actions.
  adminAuditLog: defineTable({
    userId: v.string(),
    action: v.string(), // sign_in | sign_in_denied | idle_signout | venture_status_update | ...
    at: v.number(),
    userAgent: v.optional(v.string()),
    detail: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_at", ["at"]),

  // First-login password setup: an armed email may set its password once, without the old one.
  passwordSetups: defineTable({
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),

  // Fixed-window rate limiting for unauthenticated endpoints.
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  videos: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    views: v.number(),
    likes: v.number(),
    isPrivate: v.optional(v.boolean()),
    skillCategory: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_private", ["userId", "isPrivate"])
    .index("by_skillCategory", ["skillCategory"]),

  videoLikes: defineTable({
    videoId: v.id("videos"),
    userId: v.string(),
  })
    .index("by_videoId", ["videoId"])
    .index("by_userId", ["userId"])
    .index("by_videoId_userId", ["videoId", "userId"]),

  videoComments: defineTable({
    videoId: v.id("videos"),
    userId: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("videoComments")),
    likesCount: v.number(),
  })
    .index("by_videoId", ["videoId"])
    .index("by_userId", ["userId"]),

  savedVideos: defineTable({
    videoId: v.id("videos"),
    userId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_videoId_userId", ["videoId", "userId"]),

  videoViews: defineTable({
    videoId: v.id("videos"),
    userId: v.optional(v.string()),
  }).index("by_videoId", ["videoId"]),

  jobPostings: defineTable({
    employerId: v.string(),
    title: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    jobType: v.string(),
    experienceLevel: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    skillsRequired: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    applicationDeadline: v.optional(v.string()),
    isActive: v.boolean(),
    videoPrompt: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()), // admin-controlled
    adminHidden: v.optional(v.boolean()), // unpublished by a moderator; employers cannot undo
  })
    .index("by_employerId", ["employerId"])
    .index("by_isActive", ["isActive"]),

  jobApplications: defineTable({
    jobId: v.id("jobPostings"),
    applicantId: v.string(),
    status: v.string(), // pending | reviewed | shortlisted | rejected
    coverMessage: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    statusHistory: v.optional(
      v.array(v.object({ status: v.string(), at: v.number(), by: v.optional(v.string()) }))
    ),
  })
    .index("by_jobId", ["jobId"])
    .index("by_applicantId", ["applicantId"])
    .index("by_jobId_applicantId", ["jobId", "applicantId"]),

  // Structured reviewer input on an application (1 to 5 per criterion, plus an optional note).
  applicationAssessments: defineTable({
    applicationId: v.id("jobApplications"),
    reviewerId: v.string(),
    scores: v.object({
      communication: v.number(),
      technical: v.number(),
      problemSolving: v.number(),
      roleFit: v.number(),
      presentation: v.number(),
    }),
    note: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_applicationId", ["applicationId"])
    .index("by_application_reviewer", ["applicationId", "reviewerId"]),

  challenges: defineTable({
    employerId: v.string(),
    title: v.string(),
    description: v.string(),
    prizeDescription: v.optional(v.string()),
    prizeAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    skillsTags: v.optional(v.array(v.string())),
    videoPrompt: v.optional(v.string()),
    adminHidden: v.optional(v.boolean()), // unpublished by a moderator
  })
    .index("by_employerId", ["employerId"])
    .index("by_isActive", ["isActive"]),

  challengeSubmissions: defineTable({
    challengeId: v.id("challenges"),
    userId: v.string(),
    videoId: v.id("videos"),
    status: v.string(), // submitted | reviewed | winner
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_userId", ["userId"])
    .index("by_challengeId_userId", ["challengeId", "userId"]),

  ventures: defineTable({
    name: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    solution: v.optional(v.string()),
    marketSize: v.optional(v.string()),
    traction: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    stage: v.string(), // idea | prototype | mvp | growth | scale
    industry: v.optional(v.array(v.string())),
    techStack: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    pitchVideoUrl: v.optional(v.string()),
    pitchVideoThumbnail: v.optional(v.string()),
    reviewStatus: v.string(), // pending | submitted | shortlisted | rejected
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    isFundraising: v.optional(v.boolean()),
    fundingGoal: v.optional(v.number()),
    fundingRaised: v.optional(v.number()),
    hackathonName: v.optional(v.string()),
    hackathonCohort: v.optional(v.string()),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
    // Review bookkeeping (written only by admins via convex/adminReview.ts)
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    reviewReason: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    reviewScore: v.optional(v.number()),
    statusHistory: v.optional(
      v.array(
        v.object({
          status: v.string(),
          at: v.number(),
          by: v.optional(v.string()),
          reason: v.optional(v.string()),
        })
      )
    ),
  })
    .index("by_isActive", ["isActive"])
    .index("by_reviewStatus", ["reviewStatus"]),

  ventureFounders: defineTable({
    ventureId: v.id("ventures"),
    userId: v.string(),
    role: v.string(),
    title: v.optional(v.string()),
    isLead: v.boolean(),
  })
    .index("by_ventureId", ["ventureId"])
    .index("by_userId", ["userId"])
    .index("by_userId_isLead", ["userId", "isLead"]),

  pitchDecks: defineTable({
    ventureId: v.id("ventures"),
    title: v.string(),
    fileUrl: v.string(),
    fileType: v.optional(v.string()),
    version: v.number(),
    isCurrentVersion: v.boolean(),
    uploadedBy: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  })
    .index("by_ventureId", ["ventureId"])
    .index("by_ventureId_isCurrent", ["ventureId", "isCurrentVersion"]),

  investorBookmarks: defineTable({
    investorId: v.string(),
    ventureId: v.id("ventures"),
    action: v.string(), // bookmark | pass | superlike
    notes: v.optional(v.string()),
  })
    .index("by_investorId", ["investorId"])
    .index("by_investorId_ventureId", ["investorId", "ventureId"]),

  conversations: defineTable({
    employerId: v.string(),
    candidateId: v.string(),
    jobApplicationId: v.optional(v.id("jobApplications")),
  })
    .index("by_employerId", ["employerId"])
    .index("by_candidateId", ["candidateId"])
    .index("by_participants", ["employerId", "candidateId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    isRead: v.boolean(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_isRead", ["conversationId", "isRead"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.string(), // view | like | comment | match | interview | application | message | follow
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    isRead: v.boolean(),
    relatedUserId: v.optional(v.string()),
    relatedVideoId: v.optional(v.id("videos")),
    relatedJobId: v.optional(v.id("jobPostings")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  shortlists: defineTable({
    recruiterId: v.string(),
    talentId: v.string(),
    videoId: v.optional(v.id("videos")),
    notes: v.optional(v.string()),
  })
    .index("by_recruiterId", ["recruiterId"])
    .index("by_talentId", ["talentId"])
    .index("by_recruiterId_talentId", ["recruiterId", "talentId"]),

  hiringLeads: defineTable({
    recruiterId: v.string(),
    talentId: v.string(),
    videoId: v.optional(v.id("videos")),
    status: v.string(), // pending | accepted | declined | interview_scheduled | hired
    message: v.optional(v.string()),
    companyName: v.optional(v.string()),
  })
    .index("by_recruiterId", ["recruiterId"])
    .index("by_talentId", ["talentId"]),

  employerProfiles: defineTable({
    userId: v.string(),
    companyName: v.optional(v.string()),
    companyDescription: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    companyLogoUrl: v.optional(v.string()),
    planSlug: v.optional(v.string()), // admin-controlled; missing = "free"
  }).index("by_userId", ["userId"]),

  // Subscription tiers for employers, editable by admins. If no plan document exists for
  // an employer's slug, no limits are enforced.
  plans: defineTable({
    slug: v.string(),
    name: v.string(),
    priceDisplay: v.string(), // free-text, e.g. "KES 4,900 / month"
    description: v.optional(v.string()),
    limits: v.object({
      activeJobs: v.optional(v.number()),
      activeChallenges: v.optional(v.number()),
      shortlistSize: v.optional(v.number()),
      seats: v.optional(v.number()),
    }),
    features: v.array(v.string()),
    // Optional promotion shown with the plan until endsAt (display only; limits above are what is enforced).
    offer: v.optional(v.object({ label: v.string(), priceDisplay: v.optional(v.string()), endsAt: v.optional(v.number()) })),
    isActive: v.boolean(),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  // Member ratings and comments. Nothing is public until an admin approves it AND the member allowed it.
  feedback: defineTable({
    userId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
    allowPublic: v.boolean(),
    displayName: v.string(),
    role: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
    handledAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),

  // Employer requests to move to another plan; handled by admins.
  planRequests: defineTable({
    userId: v.string(),
    planSlug: v.string(),
    note: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"), v.literal("cancelled")),
    createdAt: v.number(),
    handledAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  // Small key/value store for admin-tunable settings.
  appSettings: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  // First-party, privacy-friendly analytics. No IPs, no PII, no user ids.
  analyticsEvents: defineTable({
    type: v.union(v.literal("pageview"), v.literal("event")),
    name: v.optional(v.string()),
    visitorId: v.string(),
    sessionId: v.string(),
    isNewVisitor: v.boolean(),
    path: v.string(),
    referrerHost: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    device: v.string(), // mobile | tablet | desktop
    browser: v.string(),
    os: v.string(),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_at", ["at"])
    .index("by_visitor_at", ["visitorId", "at"]),
});
