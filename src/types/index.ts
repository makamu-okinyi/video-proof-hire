export type UserType = 'talent' | 'employer';

export type SkillCategory = 'tech' | 'design' | 'business' | 'other';

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
