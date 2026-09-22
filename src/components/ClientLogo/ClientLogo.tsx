import { useClient } from '../../client/clientContext'
import { useImageAsset } from '../ThemedBackground/useImageAsset'

interface ClientLogoProps {
  className?: string
}

/**
 * The client's own mark, when its profile names one.
 *
 * Per the National Day guideline (§1.7) partner marks sit opposite the
 * National Day logo and at no more than half its size, so callers render
 * this smaller than `BrandLogo`. Nothing renders until the image loads.
 */
export function ClientLogo({ className = '' }: ClientLogoProps) {
  const client = useClient()
  const status = useImageAsset(client.logoUrl)
  if (!client.logoUrl || status !== 'ready') return null

  return (
    <img
      src={client.logoUrl}
      alt={client.name ?? ''}
      draggable={false}
      className={`w-auto object-contain ${className}`}
    />
  )
}
