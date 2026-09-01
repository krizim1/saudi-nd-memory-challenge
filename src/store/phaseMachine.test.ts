import { describe, expect, it } from 'vitest'

import type { GamePhase } from '../game/types'
import { canTransition, phaseTransitions } from './phaseMachine'

const allPhases = Object.keys(phaseTransitions) as GamePhase[]

describe('phase machine', () => {
  it('follows the full two-player script end to end', () => {
    const script: GamePhase[] = [
      'attract',
      'mode-select',
      'registration',
      'challenge-intro',
      'player-ready',
      'countdown',
      'playing',
      'level-complete',
      'player-complete',
      'player-switch',
      'player-ready',
      'countdown',
      'playing',
      'level-complete',
      'player-complete',
      'results',
      'winner',
      'leaderboard',
      'attract',
    ]

    for (let i = 0; i < script.length - 1; i += 1) {
      expect(canTransition(script[i]!, script[i + 1]!)).toBe(true)
    }
  })

  it('loops from level-complete back into the next countdown', () => {
    expect(canTransition('level-complete', 'countdown')).toBe(true)
  })

  it('lets a solo run reach the standings without a winner screen', () => {
    expect(canTransition('results', 'leaderboard')).toBe(true)
  })

  it('rejects skipping registration or jumping straight to a winner', () => {
    expect(canTransition('attract', 'playing')).toBe(false)
    expect(canTransition('attract', 'registration')).toBe(false)
    expect(canTransition('playing', 'winner')).toBe(false)
    expect(canTransition('registration', 'results')).toBe(false)
  })

  it('lets every phase except attract bail out to attract for a kiosk reset', () => {
    for (const phase of allPhases) {
      if (phase === 'attract') continue
      expect(canTransition(phase, 'attract')).toBe(true)
    }
  })

  it('names only known phases as targets', () => {
    for (const targets of Object.values(phaseTransitions)) {
      for (const target of targets) {
        expect(allPhases).toContain(target)
      }
    }
  })
})
