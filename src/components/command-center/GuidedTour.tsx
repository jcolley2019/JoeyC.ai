import { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

interface TourStep {
  targetId: string
  titleKey: string
  bodyKey: string
  position: 'bottom' | 'top' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    targetId: 'tour-input',
    titleKey: 'tour.input.title',
    bodyKey: 'tour.input.body',
    position: 'bottom',
  },
  {
    targetId: 'tour-output',
    titleKey: 'tour.output.title',
    bodyKey: 'tour.output.body',
    position: 'bottom',
  },
  {
    targetId: 'tour-generate',
    titleKey: 'tour.generate.title',
    bodyKey: 'tour.generate.body',
    position: 'top',
  },
  {
    targetId: 'tour-drafts',
    titleKey: 'tour.drafts.title',
    bodyKey: 'tour.drafts.body',
    position: 'top',
  },
  {
    targetId: 'tour-history',
    titleKey: 'tour.history.title',
    bodyKey: 'tour.history.body',
    position: 'top',
  },
  {
    targetId: 'tour-settings',
    titleKey: 'tour.settings.title',
    bodyKey: 'tour.settings.body',
    position: 'bottom',
  },
]

interface GuidedTourProps {
  active: boolean
  onClose: () => void
}

export function GuidedTour({ active, onClose }: GuidedTourProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const currentStep = tourSteps[step]

  const updatePosition = useCallback(() => {
    if (!currentStep) return
    const el = document.getElementById(currentStep.targetId)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    })
    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentStep])

  useEffect(() => {
    if (!active) return
    setStep(0)
  }, [active])

  useEffect(() => {
    if (!active) return
    // Small delay to let scroll settle
    const timer = setTimeout(updatePosition, 300)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
    }
  }, [active, step, updatePosition])

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSkip = () => {
    onClose()
  }

  if (!active || !pos || !currentStep) return null

  // Calculate popover position
  const gap = 12
  let popoverStyle: React.CSSProperties = {}
  const popoverPosition = currentStep.position

  if (popoverPosition === 'bottom') {
    popoverStyle = {
      top: pos.top + pos.height + gap,
      left: pos.left + pos.width / 2,
      transform: 'translateX(-50%)',
    }
  } else if (popoverPosition === 'top') {
    popoverStyle = {
      top: pos.top - gap,
      left: pos.left + pos.width / 2,
      transform: 'translate(-50%, -100%)',
    }
  } else if (popoverPosition === 'right') {
    popoverStyle = {
      top: pos.top + pos.height / 2,
      left: pos.left + pos.width + gap,
      transform: 'translateY(-50%)',
    }
  } else {
    popoverStyle = {
      top: pos.top + pos.height / 2,
      left: pos.left - gap,
      transform: 'translate(-100%, -50%)',
    }
  }

  const isLast = step === tourSteps.length - 1

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[998] bg-black/50 transition-opacity"
        onClick={handleSkip}
      />

      {/* Highlight cutout — elevated above backdrop */}
      <div
        className="absolute z-[999] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300"
        style={{
          top: pos.top - 4,
          left: pos.left - 4,
          width: pos.width + 8,
          height: pos.height + 8,
        }}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="absolute z-[1000] w-80 bg-bg-card border border-primary/30 rounded-xl shadow-2xl shadow-black/40 p-5"
        style={popoverStyle}
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-primary/60">
            {step + 1} / {tourSteps.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('tour.skip')}
          </button>
        </div>

        {/* Content */}
        <h4 className="text-sm font-semibold text-text-primary mb-2">
          {t(currentStep.titleKey)}
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          {t(currentStep.bodyKey)}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('tour.prev')}
          </button>
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 text-xs font-mono font-medium bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors"
          >
            {isLast ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </div>
    </>
  )
}
