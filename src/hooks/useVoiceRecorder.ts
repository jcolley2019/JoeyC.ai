import { useState, useRef, useCallback } from 'react'

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface UseVoiceRecorderOptions {
  onFinalTranscript: (text: string) => void
}

export function useVoiceRecorder({ onFinalTranscript }: UseVoiceRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onFinalRef = useRef(onFinalTranscript)
  onFinalRef.current = onFinalTranscript

  // Track which results we've already processed
  const processedIndexRef = useRef(0)

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const createRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinal = ''
      let interim = ''

      for (let i = processedIndexRef.current; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += result[0].transcript
          processedIndexRef.current = i + 1
        } else {
          interim += result[0].transcript
        }
      }

      if (newFinal) {
        onFinalRef.current(newFinal.trim())
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: { error: string }) => {
      // Ignore 'aborted' errors from intentional stops
      if (event.error === 'aborted') return
      setError(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
      setIsPaused(false)
    }

    recognition.onend = () => {
      // If we're still supposed to be recording (browser auto-stopped), restart
      if (recognitionRef.current && !isPausedRef.current && isRecordingRef.current) {
        try {
          processedIndexRef.current = 0
          recognition.start()
        } catch {
          // Already started, ignore
        }
        return
      }
      setInterimText('')
    }

    return recognition
  }, [])

  // Refs to track state in callbacks
  const isPausedRef = useRef(false)
  const isRecordingRef = useRef(false)

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.')
      return
    }

    setError(null)
    processedIndexRef.current = 0
    const recognition = createRecognition()
    recognitionRef.current = recognition
    isRecordingRef.current = true
    isPausedRef.current = false
    setIsRecording(true)
    setIsPaused(false)

    try {
      recognition.start()
    } catch {
      setError('Failed to start recording')
    }
  }, [isSupported, createRecognition])

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    isPausedRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
    setIsPaused(false)
    setInterimText('')
    processedIndexRef.current = 0
  }, [])

  const pauseRecording = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    recognitionRef.current?.stop()
    setInterimText('')
  }, [])

  const resumeRecording = useCallback(() => {
    if (!recognitionRef.current && !isSupported) return

    setError(null)
    processedIndexRef.current = 0
    isPausedRef.current = false
    setIsPaused(false)

    const recognition = createRecognition()
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setError('Failed to resume recording')
    }
  }, [isSupported, createRecognition])

  return {
    isRecording,
    isPaused,
    interimText,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  }
}
