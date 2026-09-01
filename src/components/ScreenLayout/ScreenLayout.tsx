import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { useAdminGesture } from '../../admin/useAdminGesture'
import { useSettingsStore } from '../../store/settingsStore'
import type { ThemeBackgrounds } from '../../theme/theme.types'
import { BrandLogo } from '../BrandLogo'
import { ThemedBackground } from '../ThemedBackground'

interface ScreenLayoutProps {
  background: keyof ThemeBackgrounds
  scrim?: 'none' | 'soft' | 'strong'
  children: ReactNode
}

/**
 * Common shell for every screen: background stack, the event furniture,
 * and the enter/exit animation. Screens supply only their own content,
 * which is what keeps them short enough to read in one pass.
 */
export function ScreenLayout({ background, scrim = 'soft', children }: ScreenLayoutProps) {
  const eventTitle = useSettingsStore((state) => state.eventTitle)
  const adminTap = useAdminGesture()

  return (
    <ThemedBackground slot={background} scrim={scrim}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex h-full w-full flex-col"
      >
        <header className="flex shrink-0 items-center justify-between px-12 pt-10">
          <BrandLogo size="sm" onPress={adminTap} />
          <span className="text-lg tracking-wide text-text-secondary">
            {eventTitle}
          </span>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-12 py-8">
          {children}
        </main>
      </motion.div>
    </ThemedBackground>
  )
}
