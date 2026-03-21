import { useRef } from 'react'

const PRESET_COLORS = [
  '#2563eb', '#c9a84c', '#dc2626', '#7c3aed',
  '#10b981', '#f59e0b', '#ec4899', '#1a8fff',
  '#6366f1', '#0ea5e9',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      {label && (
        <span className="text-[13px] font-mono text-[#8892a4] uppercase tracking-[0.08em]">{label}</span>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
              value === color
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:border-white/30 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className={`w-7 h-7 rounded-full border-2 border-dashed transition-all duration-150 flex items-center justify-center ${
            !PRESET_COLORS.includes(value)
              ? 'border-white scale-110'
              : 'border-[#8892a4]/50 hover:border-white/30'
          }`}
          style={!PRESET_COLORS.includes(value) ? { backgroundColor: value } : undefined}
          title="Custom color"
        >
          {PRESET_COLORS.includes(value) && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8892a4" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  )
}
