import { useState } from 'react'

import { config } from '../app/config'
import { ScreenLayout } from '../components/ScreenLayout'
import { TouchButton } from '../components/TouchButton'
import { t } from '../i18n'
import { selectIsSolo, useGameStore } from '../store/gameStore'

type Errors = { one?: string; two?: string }

function checkName(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return t.registration.errorEmpty
  if (trimmed.length < config.player.minNameLength) {
    return t.registration.errorTooShort(config.player.minNameLength)
  }
  return undefined
}

/**
 * Rejects empty and too-short names, and — in a duel only — two players
 * entering the same name, which would make the results screen unreadable.
 */
function validate(one: string, two: string, solo: boolean): Errors {
  const errors: Errors = { one: checkName(one) }
  if (solo) return errors

  errors.two = checkName(two)

  if (!errors.one && !errors.two && one.trim() === two.trim()) {
    errors.two = t.registration.errorSameName
  }

  return errors
}

interface NameFieldProps {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}

function NameField({ label, value, error, onChange }: NameFieldProps) {
  return (
    <label className="flex w-full flex-col gap-4">
      <span className="text-display text-3xl text-accent">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={config.player.maxNameLength}
        placeholder={t.registration.namePlaceholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={[
          'h-24 w-full rounded-2xl border-2 bg-surface px-8 text-4xl text-text-primary',
          'placeholder:text-text-secondary/50 focus:outline-none focus:border-accent',
          error ? 'border-danger' : 'border-white/15',
        ].join(' ')}
      />
      <span className="min-h-8 text-xl text-danger">{error ?? ''}</span>
    </label>
  )
}

export function RegistrationScreen() {
  const registerPlayers = useGameStore((state) => state.registerPlayers)
  const solo = useGameStore(selectIsSolo)
  const [names, setNames] = useState({ one: '', two: '' })
  const [errors, setErrors] = useState<Errors>({})

  const submit = () => {
    const found = validate(names.one, names.two, solo)
    setErrors(found)
    if (found.one || found.two) return

    registerPlayers(...(solo ? [names.one] : [names.one, names.two]))
  }

  return (
    <ScreenLayout background="registration" scrim="strong">
      <div className="flex w-full max-w-5xl flex-col items-center gap-12">
        <h1 className="text-display text-[clamp(2.5rem,6vw,5rem)] text-text-primary">
          {solo ? t.registration.titleSolo : t.registration.title}
        </h1>

        <div
          className={`grid w-full gap-10 ${solo ? 'max-w-xl grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}
        >
          <NameField
            label={solo ? t.registration.playerName : t.registration.playerOne}
            value={names.one}
            error={errors.one}
            onChange={(one) => setNames((prev) => ({ ...prev, one }))}
          />
          {!solo && (
            <NameField
              label={t.registration.playerTwo}
              value={names.two}
              error={errors.two}
              onChange={(two) => setNames((prev) => ({ ...prev, two }))}
            />
          )}
        </div>

        <TouchButton size="xl" onClick={submit}>
          {t.common.startChallenge}
        </TouchButton>
      </div>
    </ScreenLayout>
  )
}
