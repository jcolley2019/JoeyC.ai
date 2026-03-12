import type { Project } from '../types'

export const projects: Project[] = [
  {
    title: 'AI Content Dashboard',
    description:
      'A dashboard that tracks social media analytics and suggests content ideas using AI. Built to streamline my own content workflow.',
    tech: ['React', 'OpenAI API', 'Tailwind CSS'],
    link: '#',
  },
  {
    title: 'Automated Lead Generator',
    description:
      'An automation that scrapes public data, qualifies leads with AI, and sends personalized outreach — all hands-free.',
    tech: ['n8n', 'Claude API', 'Google Sheets'],
    link: '#',
  },
  {
    title: 'AI Landing Page Builder',
    description:
      'A tool that generates full landing pages from a simple prompt. Describe your business and get a ready-to-deploy site.',
    tech: ['Next.js', 'Claude API', 'Vercel'],
    link: '#',
  },
]
