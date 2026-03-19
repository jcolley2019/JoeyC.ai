interface LogoProps {
  size?: number
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark rounded square */}
      <rect width="40" height="40" rx="8" fill="#0a0a0f" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="7.5" stroke="#1e2a3e" />

      {/* Terminal bracket left */}
      <path
        d="M8 12l5 8-5 8"
        stroke="#4a6fa5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* JC monogram — offset, overlapping */}
      <text
        x="22"
        y="25.5"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#e8edf5"
        letterSpacing="-0.5"
      >
        JC
      </text>

      {/* Terminal bracket right */}
      <path
        d="M32 12l-2 2"
        stroke="#1e3a5f"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Dot accent */}
      <circle cx="35" cy="28" r="2" fill="#4a6fa5" />
    </svg>
  )
}
