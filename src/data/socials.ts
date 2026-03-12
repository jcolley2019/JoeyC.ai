import { FaTiktok, FaInstagram, FaPinterest, FaYoutube, FaGlobe } from 'react-icons/fa6'
import type { SocialLink } from '../types'

export const socials: SocialLink[] = [
  {
    platform: 'TikTok',
    url: 'https://www.tiktok.com/@buildaiwithjoey',
    icon: FaTiktok,
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/gobuildai',
    icon: FaInstagram,
  },
  {
    platform: 'Pinterest',
    url: 'https://www.pinterest.com/buildaiwithjoey',
    icon: FaPinterest,
  },
  {
    platform: 'YouTube',
    url: '#',
    icon: FaYoutube,
    comingSoon: true,
  },
  {
    platform: 'Website',
    url: 'https://joeyc.ai',
    icon: FaGlobe,
  },
]
