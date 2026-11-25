import type { Destination } from './api'

// Links carry trip identifiers. The session and API address come from the app.
export function readDestination(link: string | null, trustedOrigin?: string): Destination | null {
  if (!link) return null
  try {
    const url = new URL(link)
    if (url.username || url.password || url.hash) return null
    let path: string
    if (url.protocol === 'waymark:' && url.hostname === 'trips' && !url.port) {
      path = '/trips' + url.pathname
    } else if (trustedOrigin && ['http:', 'https:'].includes(url.protocol) && url.origin === new URL(trustedOrigin).origin) {
      path = url.pathname
    } else {
      return null
    }
    if (url.search && url.search !== '?join=1') return null
    const match = /^\/trips\/([^/]+)(?:\/proposals\/([^/]+))?\/?$/.exec(path)
    if (!match) return null
    const ids = match.slice(1).filter(Boolean).map(decodeURIComponent)
    if (ids.some(id => id === '.' || id === '..' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(id))) return null
    return { tripId: ids[0], ...(ids[1] && { proposalId: ids[1] }), ...(url.search && { join: true }) }
  } catch {
    return null
  }
}
