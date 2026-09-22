import { useState, type ReactNode } from 'react'

import { config } from '../app/config'
import { levels } from '../game/levels'
import { useClient } from '../client/clientContext'
import { useLeaderboard, type ClearResult } from '../leaderboard/leaderboardContext'
import { t } from '../i18n'
import { useGameStore } from '../store/gameStore'
import { LIMITS, useSettingsStore } from '../store/settingsStore'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-display text-xl text-accent">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-lg text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

/** Operator controls are compact: this panel is used standing up, quickly. */
function PanelButton({
  onClick,
  children,
  tone = 'neutral',
}: {
  onClick: () => void
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'danger'
}) {
  const toneClass = {
    neutral: 'bg-white/10 text-text-primary',
    accent: 'bg-accent text-text-inverse',
    danger: 'bg-danger/80 text-text-primary',
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-14 rounded-xl px-6 text-lg ${toneClass}`}
    >
      {children}
    </button>
  )
}

function NumberStepper({
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <PanelButton onClick={() => onChange(Math.max(min, value - step))}>−</PanelButton>
      <span className="text-display w-28 text-center text-2xl text-text-primary">
        {value} {suffix}
      </span>
      <PanelButton onClick={() => onChange(Math.min(max, value + step))}>+</PanelButton>
    </div>
  )
}

/**
 * The event operator's panel.
 *
 * Reached only by the hidden logo gesture, and deliberately plain: it is
 * a control surface, not part of the show. Destructive actions ask for a
 * second tap, because the one thing an operator must not be able to do
 * by accident is wipe the standings mid-event.
 */
export function AdminPanel() {
  const setAdminOpen = useGameStore((state) => state.setAdminOpen)
  const resetGame = useGameStore((state) => state.resetGame)
  const jumpToLevel = useGameStore((state) => state.jumpToLevel)
  const { clear: clearLeaderboard, requiresPin } = useLeaderboard()
  const client = useClient()

  const settings = useSettingsStore()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [pin, setPin] = useState('')
  const [clearResult, setClearResult] = useState<ClearResult | null>(null)

  const close = () => setAdminOpen(false)

  const clearStandings = () => {
    if (!confirmingClear) {
      setConfirmingClear(true)
      return
    }
    setConfirmingClear(false)
    void clearLeaderboard(requiresPin ? pin : undefined).then((result) => {
      setClearResult(result)
      if (result === 'cleared') setPin('')
    })
  }

  const clearMessage: Record<ClearResult, string> = {
    cleared: t.admin.cleared,
    'invalid-pin': t.admin.invalidPin,
    locked: t.admin.locked,
    failed: t.admin.clearFailed,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8">
      <div className="flex max-h-full w-full max-w-4xl flex-col gap-6 overflow-y-auto rounded-3xl border border-white/15 bg-primary-deep p-8">
        <header className="flex items-center justify-between">
          <h2 className="text-display text-3xl text-text-primary">{t.admin.title}</h2>
          <PanelButton onClick={close}>{t.common.close}</PanelButton>
        </header>

        <Section title={t.admin.session}>
          <div className="flex flex-wrap gap-4">
            <PanelButton
              onClick={() => {
                resetGame()
                close()
              }}
            >
              {t.admin.resetGame}
            </PanelButton>

            <PanelButton onClick={clearStandings} tone={confirmingClear ? 'danger' : 'neutral'}>
              {confirmingClear ? t.admin.confirmClear : t.admin.resetLeaderboard}
            </PanelButton>
          </div>

          <Row label={t.admin.client(client.name ?? client.id)}>
            {requiresPin && (
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                aria-label={t.admin.pinLabel}
                placeholder={t.admin.pinPlaceholder}
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value)
                  setClearResult(null)
                }}
                className="h-14 w-56 rounded-xl border border-white/15 bg-black/30 px-4 text-lg text-text-primary"
              />
            )}
          </Row>

          {clearResult && (
            <p
              role="status"
              className={`text-lg ${clearResult === 'cleared' ? 'text-success' : 'text-danger'}`}
            >
              {clearMessage[clearResult]}
            </p>
          )}
        </Section>

        <Section title={t.admin.audio}>
          <Row label={t.admin.sound}>
            <PanelButton
              onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}
              tone={settings.soundEnabled ? 'accent' : 'neutral'}
            >
              {settings.soundEnabled ? t.admin.on : t.admin.off}
            </PanelButton>
          </Row>

          <Row label={t.admin.volume}>
            <NumberStepper
              value={Math.round(settings.masterVolume * 100)}
              min={0}
              max={100}
              step={10}
              suffix="%"
              onChange={(percent) => settings.setMasterVolume(percent / 100)}
            />
          </Row>
        </Section>

        <Section title={t.admin.timers}>
          {levels.map((level, index) => (
            <Row key={level.id} label={t.level.label(index + 1)}>
              <NumberStepper
                value={settings.levelTimeLimits[level.id] ?? level.timeLimit}
                min={LIMITS.timeLimit.min}
                max={LIMITS.timeLimit.max}
                step={5}
                suffix={t.common.seconds}
                onChange={(seconds) => settings.setLevelTimeLimit(level.id, seconds)}
              />
            </Row>
          ))}
        </Section>

        <Section title={t.admin.kiosk}>
          <Row label={t.admin.autoReset}>
            <NumberStepper
              value={Math.round(settings.autoResetMs / 1000)}
              min={LIMITS.autoResetSeconds.min}
              max={LIMITS.autoResetSeconds.max}
              step={5}
              suffix={t.common.seconds}
              onChange={(seconds) => settings.setAutoResetMs(seconds * 1000)}
            />
          </Row>

          <Row label={t.admin.showLeaderboard}>
            <PanelButton
              onClick={() => settings.setShowLeaderboard(!settings.showLeaderboard)}
              tone={settings.showLeaderboard ? 'accent' : 'neutral'}
            >
              {settings.showLeaderboard ? t.admin.on : t.admin.off}
            </PanelButton>
          </Row>
        </Section>

        <Section title={t.admin.branding}>
          <Row label={t.admin.gameTitle}>
            <input
              value={settings.gameTitle}
              onChange={(event) => settings.setGameTitle(event.target.value)}
              maxLength={LIMITS.titleLength}
              className="h-14 w-72 rounded-xl border border-white/15 bg-black/30 px-4 text-lg text-text-primary"
            />
          </Row>

          <Row label={t.admin.eventTitle}>
            <input
              value={settings.eventTitle}
              onChange={(event) => settings.setEventTitle(event.target.value)}
              maxLength={LIMITS.titleLength}
              className="h-14 w-72 rounded-xl border border-white/15 bg-black/30 px-4 text-lg text-text-primary"
            />
          </Row>
        </Section>

        <Section title={t.admin.testing}>
          <div className="flex flex-wrap gap-4">
            {config.levels.map((level, index) => (
              <PanelButton key={level.id} onClick={() => jumpToLevel(index)}>
                {t.admin.testLevel(index + 1)}
              </PanelButton>
            ))}
          </div>
        </Section>

        <PanelButton onClick={settings.resetSettings}>{t.admin.restoreDefaults}</PanelButton>
      </div>
    </div>
  )
}
