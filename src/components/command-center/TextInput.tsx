interface TextInputProps {
  value: string
  onChange: (value: string) => void
}

export function TextInput({ value, onChange }: TextInputProps) {
  return (
    <div>
      <label className="block font-mono text-xs text-text-secondary mb-2">Brain Dump</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste your raw thoughts, notes, ideas... Claude will transform them into polished content."
        rows={8}
        className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none text-sm leading-relaxed"
      />
      <p className="text-xs text-text-secondary mt-1 font-mono">
        {value.length} characters
      </p>
    </div>
  )
}
