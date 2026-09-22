import { useEffect, useState, type ReactNode } from 'react'

import { ClientContext, type ClientProfile } from './clientContext'
import { getClientId } from './clientId'

interface ClientProviderProps {
  children: ReactNode
  /** Injectable for tests; otherwise read from the URL and the database. */
  profile?: ClientProfile
}

interface Row {
  id: string
  name: string | null
  event_title: string | null
  logo_url: string | null
}

async function fetchProfile(id: string): Promise<ClientProfile | null> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) return null

  const headers: Record<string, string> = { apikey: key }
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`

  const response = await fetch(
    `${url.replace(/\/+$/, '')}/rest/v1/clients?id=eq.${encodeURIComponent(id)}&select=id,name,event_title,logo_url`,
    { headers },
  )
  if (!response.ok) return null
  const [row] = (await response.json()) as Row[]
  if (!row) return null

  return {
    id: row.id,
    name: row.name ?? undefined,
    eventTitle: row.event_title ?? undefined,
    logoUrl: row.logo_url ?? undefined,
  }
}

/**
 * Resolves the client for this screen. The id is known immediately from
 * the URL, so the game never waits on the network; the name, title and
 * logo arrive when the profile does, and a missing profile is harmless.
 */
export function ClientProvider({ children, profile }: ClientProviderProps) {
  const [client, setClient] = useState<ClientProfile>(() => profile ?? { id: getClientId() })

  useEffect(() => {
    if (profile) return
    let cancelled = false
    fetchProfile(client.id)
      .then((loaded) => {
        if (!cancelled && loaded) setClient(loaded)
      })
      .catch((error) => console.warn('[client] Could not load the client profile.', error))
    return () => {
      cancelled = true
    }
    // The id comes from the URL and never changes for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
