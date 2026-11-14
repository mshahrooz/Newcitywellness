export const motionPreferenceEvent = "ncw-motion-preference"
export const desktopMotionQuery = "(any-hover: hover) and (any-pointer: fine)"
export const reducedMotionQuery = "(prefers-reduced-motion: reduce)"
const preferenceKey = "ncw-desktop-motion-v1"

export function readMotionOverride() {
  try {
    return window.localStorage.getItem(preferenceKey) === "on"
  } catch {
    return false
  }
}

export function applyMotionOverride(enabled: boolean, persist = false) {
  if (persist) {
    try {
      if (enabled) window.localStorage.setItem(preferenceKey, "on")
      else window.localStorage.removeItem(preferenceKey)
    } catch {
      // The override still works in this tab when storage is blocked.
    }
  }
  if (enabled) document.documentElement.dataset.ncwMotion = "on"
  else delete document.documentElement.dataset.ncwMotion
  window.dispatchEvent(new Event(motionPreferenceEvent))
}

export function motionIsReduced(reduced: MediaQueryList, desktop: MediaQueryList) {
  return reduced.matches && !(desktop.matches && document.documentElement.dataset.ncwMotion === "on")
}
