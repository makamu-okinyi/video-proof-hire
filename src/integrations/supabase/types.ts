export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenge_submissions: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
          video_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenge_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["video_id"]
          },
          {
            foreignKeyName: "challenge_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          deadline: string | null
          description: string
          employer_id: string
          id: string
          is_active: boolean
          is_featured: boolean
          participants_count: number
          prize_amount: number | null
          prize_description: string | null
          skills_tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description: string
          employer_id: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          participants_count?: number
          prize_amount?: number | null
          prize_description?: string | null
          skills_tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string
          employer_id?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          participants_count?: number
          prize_amount?: number | null
          prize_description?: string | null
          skills_tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["video_id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          candidate_id: string
          created_at: string
          employer_id: string
          id: string
          job_application_id: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          employer_id: string
          id?: string
          job_application_id?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          employer_id?: string
          id?: string
          job_application_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_cohorts: {
        Row: {
          created_at: string
          demo_day: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          demo_day?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          demo_day?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      intro_requests: {
        Row: {
          connected_at: string | null
          founder_id: string
          founder_response: string | null
          id: string
          investment_range: string | null
          investor_id: string
          investor_interest: string | null
          investor_message: string | null
          requested_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["intro_status"]
          venture_id: string
        }
        Insert: {
          connected_at?: string | null
          founder_id: string
          founder_response?: string | null
          id?: string
          investment_range?: string | null
          investor_id: string
          investor_interest?: string | null
          investor_message?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["intro_status"]
          venture_id: string
        }
        Update: {
          connected_at?: string | null
          founder_id?: string
          founder_response?: string | null
          id?: string
          investment_range?: string | null
          investor_id?: string
          investor_interest?: string | null
          investor_message?: string | null
          requested_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["intro_status"]
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intro_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "intro_requests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_requests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intro_requests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "intro_requests_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_bookmarks: {
        Row: {
          action: string
          created_at: string
          id: string
          investor_id: string
          notes: string | null
          venture_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          investor_id: string
          notes?: string | null
          venture_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          investor_id?: string
          notes?: string | null
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_bookmarks_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_bookmarks_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_bookmarks_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investor_bookmarks_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_message: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          applications_count: number
          benefits: string[] | null
          company_logo: string | null
          company_name: string | null
          created_at: string
          description: string
          employer_id: string
          experience_level: string | null
          id: string
          is_active: boolean
          job_type: string
          location: string | null
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number
          benefits?: string[] | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          description: string
          employer_id: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          location?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number
          benefits?: string[] | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          description?: string
          employer_id?: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          location?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["video_id"]
          },
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          is_current: boolean | null
          notes: string | null
          slide_count: number | null
          title: string
          uploaded_by: string | null
          venture_id: string
          version: number
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          is_current?: boolean | null
          notes?: string | null
          slide_count?: number | null
          title: string
          uploaded_by?: string | null
          venture_id: string
          version?: number
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_current?: boolean | null
          notes?: string | null
          slide_count?: number | null
          title?: string
          uploaded_by?: string | null
          venture_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pitch_decks_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_decks_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_decks_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pitch_decks_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          avatar_url: string | null
          bio: string | null
          can_shortlist: boolean
          created_at: string
          id: string
          is_verified: boolean
          skill_category: string
          skills: string[] | null
          updated_at: string
          user_type: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_shortlist?: boolean
          created_at?: string
          id: string
          is_verified?: boolean
          skill_category?: string
          skills?: string[] | null
          updated_at?: string
          user_type?: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_shortlist?: boolean
          created_at?: string
          id?: string
          is_verified?: boolean
          skill_category?: string
          skills?: string[] | null
          updated_at?: string
          user_type?: string
          username?: string | null
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string | null
          id: string
          recruiter_id: string | null
          talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recruiter_id?: string | null
          talent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recruiter_id?: string | null
          talent_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venture_founders: {
        Row: {
          equity_percentage: number | null
          id: string
          is_lead: boolean | null
          joined_at: string
          role: string
          title: string | null
          user_id: string
          venture_id: string
        }
        Insert: {
          equity_percentage?: number | null
          id?: string
          is_lead?: boolean | null
          joined_at?: string
          role?: string
          title?: string | null
          user_id: string
          venture_id: string
        }
        Update: {
          equity_percentage?: number | null
          id?: string
          is_lead?: boolean | null
          joined_at?: string
          role?: string
          title?: string | null
          user_id?: string
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_founders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_founders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_founders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "venture_founders_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_scores: {
        Row: {
          created_at: string
          feasibility_score: number | null
          feedback: string | null
          id: string
          impact_score: number | null
          improvements: string | null
          innovation_score: number | null
          is_final: boolean | null
          judge_id: string
          strengths: string | null
          total_score: number | null
          updated_at: string
          ux_score: number | null
          venture_id: string
        }
        Insert: {
          created_at?: string
          feasibility_score?: number | null
          feedback?: string | null
          id?: string
          impact_score?: number | null
          improvements?: string | null
          innovation_score?: number | null
          is_final?: boolean | null
          judge_id: string
          strengths?: string | null
          total_score?: number | null
          updated_at?: string
          ux_score?: number | null
          venture_id: string
        }
        Update: {
          created_at?: string
          feasibility_score?: number | null
          feedback?: string | null
          id?: string
          impact_score?: number | null
          improvements?: string | null
          innovation_score?: number | null
          is_final?: boolean | null
          judge_id?: string
          strengths?: string | null
          total_score?: number | null
          updated_at?: string
          ux_score?: number | null
          venture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "venture_scores_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_tech_blocks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          tech_details: Json | null
          title: string
          updated_at: string
          venture_id: string
          visibility: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          tech_details?: Json | null
          title: string
          updated_at?: string
          venture_id: string
          visibility?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          tech_details?: Json | null
          title?: string
          updated_at?: string
          venture_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_tech_blocks_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      ventures: {
        Row: {
          business_model: string | null
          cover_image_url: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          funding_goal: number | null
          funding_raised: number | null
          github_url: string | null
          hackathon_cohort: string | null
          hackathon_name: string | null
          id: string
          industry: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_fundraising: boolean | null
          logo_url: string | null
          market_size: string | null
          name: string
          pitch_video_thumbnail: string | null
          pitch_video_url: string | null
          problem_statement: string | null
          review_status: string | null
          solution: string | null
          stage: Database["public"]["Enums"]["venture_stage"]
          tagline: string
          tech_stack: string[] | null
          traction: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          business_model?: string | null
          cover_image_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          funding_goal?: number | null
          funding_raised?: number | null
          github_url?: string | null
          hackathon_cohort?: string | null
          hackathon_name?: string | null
          id?: string
          industry?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_fundraising?: boolean | null
          logo_url?: string | null
          market_size?: string | null
          name: string
          pitch_video_thumbnail?: string | null
          pitch_video_url?: string | null
          problem_statement?: string | null
          review_status?: string | null
          solution?: string | null
          stage?: Database["public"]["Enums"]["venture_stage"]
          tagline: string
          tech_stack?: string[] | null
          traction?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          business_model?: string | null
          cover_image_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          funding_goal?: number | null
          funding_raised?: number | null
          github_url?: string | null
          hackathon_cohort?: string | null
          hackathon_name?: string | null
          id?: string
          industry?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_fundraising?: boolean | null
          logo_url?: string | null
          market_size?: string | null
          name?: string
          pitch_video_thumbnail?: string | null
          pitch_video_url?: string | null
          problem_statement?: string | null
          review_status?: string | null
          solution?: string | null
          stage?: Database["public"]["Enums"]["venture_stage"]
          tagline?: string
          tech_stack?: string[] | null
          traction?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_private: boolean
          is_verified: boolean | null
          like_count: number | null
          likes: number
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
          views: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          is_verified?: boolean | null
          like_count?: number | null
          likes?: number
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          is_verified?: boolean | null
          like_count?: number | null
          likes?: number
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "top_talent"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          skill_category: string | null
          skills: string[] | null
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          skill_category?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          skill_category?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      top_talent: {
        Row: {
          avatar_url: string | null
          best_video_title: string | null
          display_name: string | null
          like_count: number | null
          profile_verified: boolean | null
          user_id: string | null
          video_id: string | null
          video_url: string | null
          video_verified: boolean | null
        }
        Relationships: []
      }
      videos_public: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          likes: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          likes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          likes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_all_public_profiles: {
        Args: never
        Returns: {
          avatar: string
          bio: string
          created_at: string
          id: string
          is_verified: boolean
          skill_category: string
          skills: string[]
          user_type: string
          username: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar: string
          bio: string
          created_at: string
          id: string
          is_verified: boolean
          skill_category: string
          skills: string[]
          user_type: string
          username: string
        }[]
      }
      get_public_videos: {
        Args: { page_offset?: number; page_size?: number }
        Returns: {
          created_at: string
          creator_avatar: string
          creator_id: string
          creator_is_verified: boolean
          creator_skill_category: string
          creator_skills: string[]
          creator_username: string
          description: string
          id: string
          likes: number
          thumbnail_url: string
          title: string
          video_url: string
          views: number
        }[]
      }
      get_user_private_videos: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          likes: number
          thumbnail_url: string
          title: string
          video_url: string
          views: number
        }[]
      }
      get_user_public_videos: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          likes: number
          thumbnail_url: string
          title: string
          video_url: string
          views: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_job_application_status: {
        Args: { p_application_id: string; p_status: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { new_role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      update_venture_review_status: {
        Args: { p_status: string; p_venture_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "talent" | "employer" | "investor" | "judge" | "founder"
      intro_status:
        | "pending"
        | "founder_approved"
        | "founder_declined"
        | "connected"
      venture_stage: "idea" | "prototype" | "mvp" | "growth" | "scale"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["talent", "employer", "investor", "judge", "founder"],
      intro_status: [
        "pending",
        "founder_approved",
        "founder_declined",
        "connected",
      ],
      venture_stage: ["idea", "prototype", "mvp", "growth", "scale"],
    },
  },
} as const
