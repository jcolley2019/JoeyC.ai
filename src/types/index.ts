import type { IconType } from 'react-icons'

export interface Project {
  title: string
  description: string
  tech: string[]
  link: string
}

export interface SocialLink {
  platform: string
  url: string
  icon: IconType
  comingSoon?: boolean
}
