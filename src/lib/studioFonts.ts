/**
 * Google Fonts families used only behind login (Studio style presets, luxe mode, the
 * brand guide). They are not in index.html (P1 / L1-04) so public pages never pay for
 * them; call this once from any component that renders them.
 */
const STUDIO_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap'

const LINK_ID = 'studio-fonts'

export function ensureStudioFonts(): void {
  if (typeof document === 'undefined' || document.getElementById(LINK_ID)) return
  const link = document.createElement('link')
  link.id = LINK_ID
  link.rel = 'stylesheet'
  link.href = STUDIO_FONTS_HREF
  document.head.appendChild(link)
}
