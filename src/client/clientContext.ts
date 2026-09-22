import { createContext, useContext } from 'react'

import { useSettingsStore } from '../store/settingsStore'
import { DEFAULT_CLIENT } from './clientId'

/** A client's public profile, from the `clients` table. */
export interface ClientProfile {
  id: string
  name?: string
  /** Replaces the event title on every screen when set. */
  eventTitle?: string
  /** The client's own mark, shown opposite the National Day logo. */
  logoUrl?: string
}

export const ClientContext = createContext<ClientProfile>({ id: DEFAULT_CLIENT })

export function useClient(): ClientProfile {
  return useContext(ClientContext)
}

/** The client's event title if it has one, else the operator's setting. */
export function useEventTitle(): string {
  const client = useClient()
  const setting = useSettingsStore((state) => state.eventTitle)
  return client.eventTitle || setting
}
