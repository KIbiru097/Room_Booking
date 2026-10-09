import "@testing-library/jest-dom"
import { configure } from "@testing-library/react"

// The suite runs in parallel workers, so async assertions can be starved on a
// loaded machine. Give waitFor/find* more headroom than the 1s default.
configure({ asyncUtilTimeout: 5000 })

if (typeof window !== "undefined") {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList)

  if (!window.ResizeObserver) {
    window.ResizeObserver = (class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver)
  }
}
