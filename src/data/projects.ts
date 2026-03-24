import type { Project } from '../types'

export const projects: Project[] = [
  {
    title: 'Luxvibe.io',
    description:
      'AI-powered luxury hotel booking platform that matches travelers with curated stays using intelligent recommendations.',
    tech: ['React', 'LiteAPI', 'Claude AI'],
    link: 'https://luxvibe.io',
    initials: 'LV',
    gradient: ['#0a1628', '#1a3a5c'],
    image: '/photos/LUXVIBE-SCREENSHOT.png',
    video: '/videos/luxvibe-travel-website.mp4',
    videoStart: 5,
  },
  {
    title: 'Content Studio',
    description:
      'AI content generation command center — turn one idea into posts, blogs, threads, and video scripts across every platform.',
    tech: ['React', 'Claude API', 'Supabase'],
    link: '/command-center',
    initials: 'CS',
    gradient: ['#0f2040', '#1e4080'],
    image: `/photos/${encodeURIComponent('CONTENT STUDIO1.png')}`,
    video: '/videos/CONTENT-STUDIO.mp4',
  },
  {
    title: 'TitiActriz.com',
    description:
      'Actress portfolio and personal brand site with a cinematic aesthetic and dynamic content management.',
    tech: ['React', 'Supabase'],
    link: 'https://titiactriz.com',
    initials: 'TA',
    gradient: ['#1a0a0a', '#3a1a1a'],
    image: '/photos/TITIACRIZ-SCREENSHOT.png',
    video: '/videos/titiactriz-website.mp4',
    videoStart: 9,
  },
  {
    title: 'TitiLINKS',
    description:
      'Bio link SaaS built for TikTok creators — one link, every platform, fully customizable.',
    tech: ['React', 'Supabase', 'Framer Motion'],
    link: 'https://titilinks.com',
    initials: 'TL',
    gradient: ['#1a0a2e', '#2d1a4a'],
    image: '/photos/TITILINKS1.png',
    video: '/videos/titiLINKS-biolink-site.mp4',
    videoStart: 2,
    portraitVideo: true,
  },
  {
    title: 'Field Report AI',
    description:
      'AI-powered field reporting tool that turns raw observations into structured, professional reports.',
    tech: ['React', 'Claude API'],
    link: 'https://fieldreportai.app',
    initials: 'FR',
    gradient: ['#0a1a0a', '#1a3a1a'],
    image: '/photos/FIELDREPORTAI-1.png',
    video: '/videos/fieldreportai-1.mp4',
    video2: '/videos/fieldreportai-2.mp4',
    videoStart: 3,
    portraitVideo: true,
  },
  {
    title: 'Spanish Chat App',
    description:
      'Conversational Spanish learning app — practice real dialogue with an AI tutor that adapts to your level.',
    tech: ['React', 'AI', 'Lovable'],
    link: 'https://medellin-chatter.lovable.app',
    initials: 'SC',
    gradient: ['#1a1000', '#3a2800'],
    image: '/photos/SPANISH-APP1.png',
    video: '/videos/spanish-app2.mp4',
    videoStart: 2,
    portraitVideo: true,
  },
]
