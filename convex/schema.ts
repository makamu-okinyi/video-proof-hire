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
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"]),

  webauthnCredentials: defineTable({
    userId: v.string(),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_credentialId", ["credentialId"]),

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
  })
    .index("by_employerId", ["employerId"])
    .index("by_isActive", ["isActive"]),

  jobApplications: defineTable({
    jobId: v.id("jobPostings"),
    applicantId: v.string(),
    status: v.string(), // pending | reviewed | shortlisted | rejected
    coverMessage: v.optional(v.string()),
  })
    .index("by_jobId", ["jobId"])
    .index("by_applicantId", ["applicantId"])
    .index("by_jobId_applicantId", ["jobId", "applicantId"]),

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
  }).index("by_userId", ["userId"]),
});
