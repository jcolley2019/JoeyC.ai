import type { IconType } from 'react-icons'

export interface Project {
  title: string
  description: string
  tech: string[]
  link: string
  initials: string
  gradient: [string, string]
  image?: string
  video?: string
  video2?: string
  videoStart?: number
  portraitVideo?: boolean
}

export interface SocialLink {
  platform: string
  url: string
  icon: IconType
  comingSoon?: boolean
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published'
  tags: string[]
  cover_image: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface ContentGeneration {
  id: string
  user_id: string
  input_type: 'youtube' | 'text' | 'voice'
  input_text: string
  output_format: OutputFormat
  platform: string | null
  generated_content: string
  created_at: string
}

export type OutputFormat = 'social' | 'blog' | 'thread' | 'video'
export type Platform = 'tiktok' | 'instagram' | 'pinterest' | 'linkedin' | 'youtube'

export interface GenerationUsage {
  input_tokens: number
  output_tokens: number
  model: string
  web_search_used: boolean
}

export interface GenerationLimits {
  daily_used: number
  daily_limit: number
}

export interface GenerationResponse {
  content: string
  usage: GenerationUsage
  limits: GenerationLimits
}

export interface UserRole {
  id: string
  user_id: string
  role: 'master_admin' | 'user'
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  accepted_at: string | null
}

export interface ActivityLogEntry {
  id: string
  user_id: string
  action: string
  metadata: {
    input_type?: string
    output_format?: string
    platforms?: string[]
    platform?: string | null
    cascade?: boolean
    method?: string
  }
  created_at: string
  // Joined from auth.users via edge function
  user_email?: string
  user_name?: string
}

export type StylePreset = 'modern' | 'luxury' | 'editorial' | 'tech'

export interface BrandProfile {
  id: string
  user_id: string
  display_name: string | null
  title: string | null
  bio: string | null
  website_url: string | null
  tiktok_handle: string | null
  instagram_handle: string | null
  pinterest_handle: string | null
  youtube_handle: string | null
  linkedin_handle: string | null
  style_preset: StylePreset
  accent_color: string
  logo_url: string | null
  has_branding_kit: boolean
  brand_kit_notes: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}
