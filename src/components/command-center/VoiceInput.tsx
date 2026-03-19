import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { useState, useEffect, useCallback } from 'react'

interface VoiceInputProps {
  onTranscriptChange: (transcript: string) => void
}

export function VoiceInput({ onTranscriptChange }: VoiceInputProps) {
  const [transcript, setTranscript] = useState('')

  const onFinalTranscript = useCallback((text: string) => {
    setTranscript((prev) => (prev ? prev + ' ' + text : text))
  }, [])

  const {
    isRecording,
    interimText,
    error,
    isSupported,
    startRecording,
    stopRecording,
  } = useVoiceRecorder({ onFinalTranscript })

  useEffect(() => {
    if (transcript) onTranscriptChange(transcript)
  }, [transcript, onTranscriptChange])

  const clearTranscript = () => setTranscript('')

  if (!isSupported) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm">
          Speech recognition is not supported in your browser. Please use Chrome or Edge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse'
              : 'bg-primary/10 border-2 border-primary/30 text-primary hover:bg-primary/20'
          }`}
        >
          {isRecording ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {isRecording ? 'Recording... click to stop' : 'Click to start recording'}
          </p>
          <p className="text-xs text-text-secondary font-mono">
            {isRecording ? 'Speak clearly into your microphone' : 'Uses browser speech recognition'}
          </p>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

      {(transcript || interimText) && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono text-xs text-text-secondary">Transcript</p>
            {transcript && (
              <button
                onClick={clearTranscript}
                className="text-xs text-text-secondary hover:text-red-400 transition-colors font-mono"
              >
                Clear
              </button>
            )}
          </div>
          <div className="bg-bg-card border border-border rounded-lg p-3 min-h-[80px] text-sm text-text-primary leading-relaxed">
            {transcript}
            {interimText && <span className="text-text-secondary/50">{interimText}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
