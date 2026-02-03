// Venture-related types for the Startup Garage platform
export type UserType = 'talent' | 'employer' | 'founder' | 'investor' | 'judge';

export type SkillCategory = 'tech' | 'design' | 'business' | 'other';

export type VentureStage = 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: UserType;
  avatar?: string;
  bio?: string;
  skills: string[];
  skillCategory: SkillCategory;
  isVerified: boolean;
  createdAt: Date;
}

export interface Video {
  id: string;
  userId: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  skills: string[];
  category: string;
  visibility: 'public' | 'recruiters';
  likes: number;
  comments: number;
  views: number;
  createdAt: Date;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  description: string;
  skills: string[];
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  experienceLevel: 'entry' | 'mid' | 'senior';
  postedAt: Date;
}

export interface Notification {
  id: string;
  type: 'view' | 'like' | 'comment' | 'match' | 'interview' | 'application';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface Article {
  id: string;
  author: User;
  title: string;
  content: string;
  coverImage?: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: Date;
}

// Venture Types for Startup Garage
export interface Venture {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  problemStatement?: string;
  solution?: string;
  marketSize?: string;
  traction?: string;
  businessModel?: string;
  stage: VentureStage;
  
  // Media
  logoUrl?: string;
  coverImageUrl?: string;
  pitchVideoUrl?: string;
  pitchVideoThumbnail?: string;
  
  // Links
  websiteUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  
  // Categorization
  industry: string[];
  techStack: string[];
  
  // Fundraising
  isFundraising: boolean;
  fundingGoal?: number;
  fundingRaised?: number;
  
  // Hackathon
  hackathonName?: string;
  hackathonCohort?: string;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  founders?: VentureFounder[];
  scores?: VentureScore[];
}

export interface VentureFounder {
  id: string;
  ventureId: string;
  userId: string;
  role: string;
  title?: string;
  equityPercentage?: number;
  isLead: boolean;
  joinedAt: Date;
  user?: User;
}

export interface PitchDeck {
  id: string;
  ventureId: string;
  version: number;
  title: string;
  fileUrl: string;
  fileType: string;
  slideCount?: number;
  notes?: string;
  isCurrent: boolean;
  uploadedBy?: string;
  createdAt: Date;
}

export interface VentureTechBlock {
  id: string;
  ventureId: string;
  title: string;
  description?: string;
  category: 'algorithm' | 'infrastructure' | 'data' | 'integration' | 'ai_ml';
  visibility: 'public' | 'investors_only' | 'founders_only';
  techDetails?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VentureScore {
  id: string;
  ventureId: string;
  judgeId: string;
  impactScore: number;
  feasibilityScore: number;
  innovationScore: number;
  uxScore: number;
  totalScore: number;
  feedback?: string;
  strengths?: string;
  improvements?: string;
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
  judge?: User;
}

export interface InvestorBookmark {
  id: string;
  investorId: string;
  ventureId: string;
  action: 'bookmark' | 'pass' | 'superlike';
  notes?: string;
  createdAt: Date;
}

export interface IntroRequest {
  id: string;
  investorId: string;
  ventureId: string;
  founderId: string;
  status: 'pending' | 'founder_approved' | 'founder_declined' | 'connected';
  investorMessage?: string;
  investorInterest?: string;
  investmentRange?: string;
  founderResponse?: string;
  requestedAt: Date;
  respondedAt?: Date;
  connectedAt?: Date;
}

export interface HackathonCohort {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  demoDay?: Date;
  isActive: boolean;
  createdAt: Date;
}