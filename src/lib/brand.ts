// ── JoeyC.ai Brand Constants ──────────────────────────────────
// Single source of truth for all brand values.
// Use these in components, email templates, and external assets.

export const brand = {
  name: 'JoeyC.ai',
  tagline: 'Built Different. Built with AI.',
  url: 'https://joeyc.ai',

  colors: {
    primary: '#1a8fff',
    primaryHover: '#3da0ff',
    accent: '#0a3aad',
    bg: '#0a0a0f',
    bgCard: '#0c1020',
    bgSection: '#080b16',
    textPrimary: '#e8edf5',
    textSecondary: '#8892a4',
    border: '#0f1a33',
    borderHover: '#1a3366',
    glow: '#1a8fff',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#eab308',
  },

  fonts: {
    display: 'Orbitron',
    body: 'Space Grotesk',
    mono: 'JetBrains Mono',
    // Luxe mode alternates
    luxeSerif: 'Cormorant Garamond',
    luxeDisplay: 'Playfair Display',
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Google Fonts import URL (for email templates & external use)
  fontsUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
} as const

// ── Email Template Generator ──────────────────────────────────
// Generates branded HTML email with inline styles (email-client safe)

export function generateEmailTemplate(options: {
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
}) {
  const { heading, body, ctaText, ctaUrl } = options
  const c = brand.colors

  const ctaBlock = ctaText && ctaUrl ? `
    <tr>
      <td style="padding: 32px 0 0;">
        <a href="${ctaUrl}" style="
          display: inline-block;
          background-color: ${c.primary};
          color: ${c.bg};
          font-family: '${brand.fonts.display}', Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
        ">${ctaText}</a>
      </td>
    </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${brand.fontsUrl}" rel="stylesheet">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${c.bg}; font-family: '${brand.fonts.body}', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.bg}; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 40px; text-align: center;">
              <span style="
                font-family: '${brand.fonts.display}', Arial, sans-serif;
                font-size: 28px;
                font-weight: 700;
                color: ${c.primary};
                letter-spacing: 0.08em;
              ">${brand.name}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color: ${c.bgCard};
              border: 1px solid ${c.border};
              border-radius: 12px;
              padding: 40px 36px;
            ">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Heading -->
                <tr>
                  <td style="
                    font-family: '${brand.fonts.display}', Arial, sans-serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: ${c.textPrimary};
                    letter-spacing: 0.02em;
                    padding-bottom: 16px;
                  ">${heading}</td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="
                    font-family: '${brand.fonts.body}', Arial, sans-serif;
                    font-size: 15px;
                    line-height: 1.7;
                    color: ${c.textSecondary};
                  ">${body}</td>
                </tr>

                <!-- CTA -->
                ${ctaBlock}

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="
                font-family: '${brand.fonts.mono}', monospace;
                font-size: 11px;
                color: ${c.textSecondary};
                letter-spacing: 0.15em;
                text-transform: uppercase;
                margin: 0;
              ">// ${brand.name}</p>
              <p style="
                font-family: '${brand.fonts.body}', Arial, sans-serif;
                font-size: 12px;
                color: ${c.textSecondary};
                margin: 8px 0 0;
                opacity: 0.6;
              ">${brand.tagline}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Pre-built templates for Supabase email settings
export const emailTemplates = {
  invitation: generateEmailTemplate({
    heading: "You're Invited",
    body: `You've been invited to join <strong style="color: #e8edf5;">JoeyC.ai Content Studio</strong> — an AI-powered content generation command center.<br><br>Click the button below to accept your invitation and create your account.`,
    ctaText: 'Accept Invitation',
    ctaUrl: '{{ .ConfirmationURL }}',
  }),

  confirmation: generateEmailTemplate({
    heading: 'Confirm Your Email',
    body: `Thanks for signing up for <strong style="color: #e8edf5;">JoeyC.ai Content Studio</strong>.<br><br>Click the button below to verify your email address and activate your account.`,
    ctaText: 'Confirm Email',
    ctaUrl: '{{ .ConfirmationURL }}',
  }),

  resetPassword: generateEmailTemplate({
    heading: 'Reset Your Password',
    body: `We received a request to reset your password for <strong style="color: #e8edf5;">JoeyC.ai Content Studio</strong>.<br><br>Click the button below to set a new password. This link expires in 24 hours.`,
    ctaText: 'Reset Password',
    ctaUrl: '{{ .ConfirmationURL }}',
  }),

  magicLink: generateEmailTemplate({
    heading: 'Your Login Link',
    body: `Click the button below to log in to <strong style="color: #e8edf5;">JoeyC.ai Content Studio</strong>. This link expires in 10 minutes.`,
    ctaText: 'Log In',
    ctaUrl: '{{ .ConfirmationURL }}',
  }),
}
