import { useState, useRef } from 'react'
import { brand, emailTemplates } from '../../lib/brand'

const colorEntries: { name: string; key: string; hex: string; role: string }[] = [
  { name: 'Primary', key: 'primary', hex: brand.colors.primary, role: 'Brand blue · CTAs · Links' },
  { name: 'Primary Hover', key: 'primaryHover', hex: brand.colors.primaryHover, role: 'Interactive hover state' },
  { name: 'Accent', key: 'accent', hex: brand.colors.accent, role: 'Deep blue · Gradients' },
  { name: 'Background', key: 'bg', hex: brand.colors.bg, role: 'Main background' },
  { name: 'Card', key: 'bgCard', hex: brand.colors.bgCard, role: 'Card surfaces' },
  { name: 'Section', key: 'bgSection', hex: brand.colors.bgSection, role: 'Alternate sections' },
  { name: 'Text Primary', key: 'textPrimary', hex: brand.colors.textPrimary, role: 'Headlines · Body text' },
  { name: 'Text Secondary', key: 'textSecondary', hex: brand.colors.textSecondary, role: 'Captions · Muted text' },
  { name: 'Border', key: 'border', hex: brand.colors.border, role: 'Card · Divider borders' },
  { name: 'Border Hover', key: 'borderHover', hex: brand.colors.borderHover, role: 'Interactive border state' },
  { name: 'Glow', key: 'glow', hex: brand.colors.glow, role: 'Neon glow effects' },
]

const statusColors = [
  { name: 'Success', hex: brand.colors.success },
  { name: 'Error', hex: brand.colors.error },
  { name: 'Warning', hex: brand.colors.warning },
]

const gradients = [
  { name: 'Hero Gradient', css: 'linear-gradient(90deg, #04133d 0%, #0a3aad 45%, #1a8fff 100%)' },
  { name: 'Button Gradient', css: 'linear-gradient(135deg, #0a3aad, #1a8fff)' },
  { name: 'Text / Animated', css: 'linear-gradient(135deg, #1a8fff, #0a3aad, #1a8fff)' },
  { name: 'Divider Line', css: 'linear-gradient(90deg, transparent 0%, #04133d 20%, #0a3aad 50%, #04133d 80%, transparent 100%)' },
  { name: 'Luxe Button', css: 'linear-gradient(135deg, #b8860b, #d4a017)' },
]

const luxeColors = [
  { name: 'Primary', hex: '#b8860b' },
  { name: 'Hover', hex: '#d4a017' },
  { name: 'Accent', hex: '#8b6914' },
  { name: 'Background', hex: '#faf6f0' },
  { name: 'Card', hex: '#f5efe6' },
  { name: 'Text', hex: '#1a1008' },
  { name: 'Text Sec.', hex: '#3d2b1f' },
  { name: 'Border', hex: '#d4c5a9' },
]

export function BrandGuide() {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [emailPreview, setEmailPreview] = useState<'invitation' | 'confirmation' | 'resetPassword' | 'magicLink'>('invitation')
  const emailPreviewRef = useRef<HTMLIFrameElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const handleDownloadPDF = () => {
    // Open the standalone brand page in a new tab for print/save-as-PDF
    const printWindow = window.open('/brand.html', '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500)
      })
    }
  }

  return (
    <div ref={guideRef} className="space-y-8">

      {/* ── Header + Download ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: brand.fonts.display }}>
            <span className="text-primary">{brand.name}</span> Brand Guide
          </h2>
          <p className="text-[14px] text-text-secondary mt-1">{brand.tagline}</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold rounded-lg text-sm hover:bg-primary-hover transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* ── Brand Identity ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 01 — Brand Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[12px] font-mono text-text-secondary mb-2">Brand Name</p>
            <p className="text-xl text-text-primary font-bold" style={{ fontFamily: brand.fonts.display }}>{brand.name}</p>
          </div>
          <div>
            <p className="text-[12px] font-mono text-text-secondary mb-2">Tagline</p>
            <p className="text-[15px] text-text-primary font-medium">{brand.tagline}</p>
          </div>
          <div>
            <p className="text-[12px] font-mono text-text-secondary mb-2">URL</p>
            <a href={brand.url} target="_blank" rel="noopener noreferrer" className="text-[15px] text-primary hover:text-primary-hover transition-colors font-mono">
              {brand.url}
            </a>
          </div>
        </div>

        {/* Favicon */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-[12px] font-mono text-text-secondary mb-3">Favicon / Mark</p>
          <div className="flex items-center gap-6">
            {[64, 40, 16].map(size => (
              <div key={size} className="text-center">
                <div className="inline-block p-3 rounded-lg border border-border bg-bg mb-2">
                  <img src="/favicon.svg" alt="JC favicon" width={size} height={size} />
                </div>
                <p className="text-[11px] font-mono text-text-secondary">{size}px</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Core Colors ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 02 — Core Color Palette</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {colorEntries.map(c => (
            <button
              key={c.key}
              onClick={() => copy(c.hex, c.key)}
              className="group text-left rounded-xl border border-border hover:border-primary/30 overflow-hidden transition-all"
            >
              <div className="h-16 border-b border-white/5" style={{ backgroundColor: c.hex }} />
              <div className="p-3">
                <p className="text-[13px] text-text-primary font-medium">{c.name}</p>
                <p className="text-[12px] font-mono text-text-secondary group-hover:text-primary transition-colors">
                  {copiedField === c.key ? 'Copied!' : c.hex}
                </p>
                <p className="text-[11px] text-text-secondary/60 mt-0.5">{c.role}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Status Colors */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-[12px] font-mono text-text-secondary mb-3">Status Colors</p>
          <div className="flex gap-3 flex-wrap">
            {statusColors.map(c => (
              <button
                key={c.name}
                onClick={() => copy(c.hex, `status-${c.name}`)}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border hover:border-primary/30 transition-all"
              >
                <div className="w-8 h-8 rounded-md border border-white/10" style={{ backgroundColor: c.hex }} />
                <div className="text-left">
                  <p className="text-[13px] text-text-primary font-medium">{c.name}</p>
                  <p className="text-[12px] font-mono text-text-secondary group-hover:text-primary transition-colors">
                    {copiedField === `status-${c.name}` ? 'Copied!' : c.hex}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Typography ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 03 — Typography</h3>
        <div className="space-y-4">

          {/* Orbitron */}
          <div className="p-5 rounded-lg border border-border bg-bg">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-[12px] font-mono text-primary tracking-[0.1em] uppercase">Orbitron</span>
              <span className="text-[11px] text-text-secondary bg-primary/8 px-2 py-1 rounded">Display · Headlines · Logo</span>
            </div>
            <p className="text-text-primary mb-3" style={{ fontFamily: brand.fonts.display, fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 2rem)' }}>
              Built Different. Built with AI.
            </p>
            <div className="flex gap-6">
              <div className="text-center">
                <p style={{ fontFamily: 'Orbitron', fontWeight: 400, fontSize: '1.25rem' }} className="text-text-primary">Aa</p>
                <p className="text-[10px] font-mono text-text-secondary">400</p>
              </div>
              <div className="text-center">
                <p style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '1.25rem' }} className="text-text-primary">Aa</p>
                <p className="text-[10px] font-mono text-text-secondary">700</p>
              </div>
            </div>
            <p className="text-text-secondary/50 mt-3" style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
            </p>
          </div>

          {/* Space Grotesk */}
          <div className="p-5 rounded-lg border border-border bg-bg">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-[12px] font-mono text-primary tracking-[0.1em] uppercase">Space Grotesk</span>
              <span className="text-[11px] text-text-secondary bg-primary/8 px-2 py-1 rounded">Body · UI · Paragraphs</span>
            </div>
            <p className="text-text-secondary leading-relaxed mb-3" style={{ fontFamily: brand.fonts.body, fontSize: '1rem' }}>
              Space Grotesk is used for all body copy, UI labels, and paragraph text. Its clean, modern geometry pairs perfectly with Orbitron's futuristic display weight.
            </p>
            <div className="flex gap-6">
              {[
                { w: 400, label: '400' },
                { w: 500, label: '500' },
                { w: 600, label: '600' },
                { w: 700, label: '700' },
              ].map(({ w, label }) => (
                <div key={w} className="text-center">
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: w, fontSize: '1.25rem' }} className="text-text-primary">Aa</p>
                  <p className="text-[10px] font-mono text-text-secondary">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* JetBrains Mono */}
          <div className="p-5 rounded-lg border border-border bg-bg">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-[12px] font-mono text-primary tracking-[0.1em] uppercase">JetBrains Mono</span>
              <span className="text-[11px] text-text-secondary bg-primary/8 px-2 py-1 rounded">Code · Labels · Technical</span>
            </div>
            <div className="p-4 rounded-md border border-border bg-bg-card font-mono text-[13px] leading-relaxed">
              <p className="text-text-secondary/50">{'// JoeyC.ai — built with code, powered by AI'}</p>
              <p><span className="text-primary">const</span> <span className="text-text-primary">brand</span> = {'{'}</p>
              <p className="pl-4"><span className="text-text-primary">name:</span> <span className="text-green-400">'JoeyC.ai'</span>,</p>
              <p className="pl-4"><span className="text-text-primary">primary:</span> <span className="text-primary">'#1a8fff'</span>,</p>
              <p>{'}'}</p>
            </div>
          </div>

          {/* Google Fonts URL copy */}
          <button
            onClick={() => copy(brand.fontsUrl, 'fontsUrl')}
            className="text-[13px] font-mono text-text-secondary hover:text-primary transition-colors"
          >
            {copiedField === 'fontsUrl' ? '✓ Copied Google Fonts URL' : '📋 Copy Google Fonts import URL'}
          </button>
        </div>
      </div>

      {/* ── Gradients ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 04 — Gradients</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gradients.map(g => (
            <button
              key={g.name}
              onClick={() => copy(g.css, `grad-${g.name}`)}
              className="group text-left rounded-xl border border-border hover:border-primary/30 overflow-hidden transition-all"
            >
              <div className="h-20" style={{ background: g.css }} />
              <div className="p-3">
                <p className="text-[13px] text-text-primary font-medium mb-1">{g.name}</p>
                <p className="text-[11px] font-mono text-text-secondary/70 break-all leading-relaxed group-hover:text-primary transition-colors">
                  {copiedField === `grad-${g.name}` ? 'Copied!' : g.css}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Glow & Effects ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 05 — Glow & Effects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Neon Text */}
          <div className="p-6 rounded-lg border border-border bg-bg text-center">
            <p
              className="text-xl font-bold mb-3"
              style={{
                fontFamily: brand.fonts.display,
                color: brand.colors.primary,
                textShadow: '0 0 20px rgba(26,143,255,0.5), 0 0 40px rgba(26,143,255,0.25), 0 0 80px rgba(10,58,173,0.15)',
              }}
            >
              JoeyC.ai
            </p>
            <p className="text-[11px] font-mono text-text-secondary">Neon Text Glow</p>
          </div>

          {/* Card Glow */}
          <div className="p-6 rounded-lg border border-border bg-bg text-center">
            <div
              className="p-4 rounded-lg border border-border-hover text-[13px] text-text-secondary mb-3"
              style={{ boxShadow: '0 0 30px rgba(26,143,255,0.08), 0 0 60px rgba(10,58,173,0.05)' }}
            >
              Card with ambient glow
            </div>
            <p className="text-[11px] font-mono text-text-secondary">Card Hover Glow</p>
          </div>

          {/* Button Glow */}
          <div className="p-6 rounded-lg border border-border bg-bg text-center">
            <button
              className="px-6 py-3 rounded-lg text-bg text-[13px] font-bold mb-3 cursor-default"
              style={{
                fontFamily: brand.fonts.display,
                background: 'linear-gradient(135deg, #0a3aad, #1a8fff)',
                boxShadow: '0 0 24px rgba(26,143,255,0.3), 0 0 60px rgba(10,58,173,0.15)',
                letterSpacing: '0.05em',
              }}
            >
              GET STARTED
            </button>
            <p className="text-[11px] font-mono text-text-secondary">Button Glow</p>
          </div>
        </div>
      </div>

      {/* ── Luxe Mode ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 06 — Luxe Mode (Alternate Theme)</h3>
        <div className="rounded-xl p-6" style={{ background: '#faf6f0', border: '1px solid #d4c5a9' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {luxeColors.map(c => (
              <button
                key={c.name}
                onClick={() => copy(c.hex, `luxe-${c.name}`)}
                className="group text-left rounded-lg overflow-hidden"
                style={{ border: '1px solid #d4c5a9' }}
              >
                <div className="h-12" style={{ background: c.hex }} />
                <div className="p-2" style={{ background: '#f5efe6' }}>
                  <p className="text-[12px] font-medium" style={{ color: '#1a1008' }}>{c.name}</p>
                  <p className="text-[11px] font-mono" style={{ color: '#3d2b1f' }}>
                    {copiedField === `luxe-${c.name}` ? 'Copied!' : c.hex}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-lg p-5" style={{ background: '#f5efe6', border: '1px solid #d4c5a9' }}>
            <p className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1008' }}>
              Cormorant Garamond
            </p>
            <p className="leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#3d2b1f', fontSize: '1rem' }}>
              The luxe alternate theme uses warm gold tones on cream backgrounds — an elegant serif that transforms the brand into a high-end editorial experience.
            </p>
            <button
              className="mt-4 px-5 py-2.5 rounded-lg text-[14px] font-bold cursor-default"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                color: '#faf6f0',
                letterSpacing: '0.08em',
              }}
            >
              EXPLORE LUXE
            </button>
          </div>
        </div>
      </div>

      {/* ── CSS Variables Quick Reference ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">// 07 — CSS Variables</h3>
        <div className="p-4 rounded-lg border border-border bg-bg font-mono text-[12px] leading-[1.8] overflow-x-auto">
          <p className="text-text-secondary/50">{'/* Tailwind @theme — paste into index.css */'}</p>
          <p><span className="text-primary">@theme</span> {'{'}</p>
          <p className="pl-4"><span className="text-primary">--font-sans</span>: <span className="text-green-400">"Space Grotesk"</span>, ui-sans-serif, system-ui, sans-serif;</p>
          <p className="pl-4"><span className="text-primary">--font-mono</span>: <span className="text-green-400">"JetBrains Mono"</span>, ui-monospace, monospace;</p>
          <p className="pl-4"><span className="text-primary">--font-display</span>: <span className="text-green-400">"Orbitron"</span>, ui-sans-serif, system-ui, sans-serif;</p>
          <p className="pl-4 mt-2"><span className="text-primary">--color-primary</span>: <span style={{ color: '#1a8fff' }}>#1a8fff</span>;</p>
          <p className="pl-4"><span className="text-primary">--color-accent</span>: <span style={{ color: '#0a3aad' }}>#0a3aad</span>;</p>
          <p className="pl-4"><span className="text-primary">--color-bg</span>: #0a0a0f;</p>
          <p className="pl-4"><span className="text-primary">--color-bg-card</span>: #0c1020;</p>
          <p className="pl-4"><span className="text-primary">--color-text-primary</span>: #e8edf5;</p>
          <p className="pl-4"><span className="text-primary">--color-text-secondary</span>: #8892a4;</p>
          <p className="pl-4"><span className="text-primary">--color-border</span>: #0f1a33;</p>
          <p className="pl-4"><span className="text-primary">--color-glow</span>: <span style={{ color: '#1a8fff' }}>#1a8fff</span>;</p>
          <p>{'}'}</p>
        </div>

        <div className="mt-3 p-4 rounded-lg border border-border bg-bg font-mono text-[12px] leading-[1.8] overflow-x-auto">
          <p className="text-text-secondary/50">{'/* Brand source of truth */'}</p>
          <p><span className="text-primary">import</span> {'{ brand }'} <span className="text-primary">from</span> <span className="text-green-400">'@/lib/brand'</span>;</p>
          <p className="mt-1">brand.colors.primary &nbsp;&nbsp;&nbsp;<span className="text-text-secondary/50">// #1a8fff</span></p>
          <p>brand.fonts.display &nbsp;&nbsp;&nbsp;<span className="text-text-secondary/50">// Orbitron</span></p>
          <p>brand.fonts.body &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-text-secondary/50">// Space Grotesk</span></p>
          <p>brand.fonts.mono &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-text-secondary/50">// JetBrains Mono</span></p>
          <p>brand.tagline &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-text-secondary/50">// Built Different. Built with AI.</span></p>
        </div>
      </div>

      {/* ── Email Templates ── */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-2">// 08 — Email Templates</h3>
        <p className="text-[13px] text-text-secondary mb-4">
          Copy these into Supabase → Authentication → Email Templates
        </p>

        <div className="flex gap-1 bg-bg border border-border rounded-lg p-1 mb-4">
          {(['invitation', 'confirmation', 'resetPassword', 'magicLink'] as const).map(tmpl => (
            <button
              key={tmpl}
              onClick={() => setEmailPreview(tmpl)}
              className={`flex-1 px-2 py-1.5 rounded-md text-[12px] font-mono transition-all capitalize ${
                emailPreview === tmpl
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {tmpl.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border overflow-hidden mb-4" style={{ height: 480 }}>
          <iframe
            ref={emailPreviewRef}
            srcDoc={emailTemplates[emailPreview]}
            title="Email preview"
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(emailTemplates[emailPreview])
            setCopiedField('email')
            setTimeout(() => setCopiedField(null), 2000)
          }}
          className="px-4 py-2 bg-primary text-bg font-semibold rounded-lg text-sm hover:bg-primary-hover transition-colors"
        >
          {copiedField === 'email' ? '✓ HTML Copied!' : `Copy ${emailPreview.replace(/([A-Z])/g, ' $1').trim()} HTML`}
        </button>
      </div>

    </div>
  )
}
