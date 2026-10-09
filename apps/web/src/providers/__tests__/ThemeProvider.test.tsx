import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider"

const STORAGE_KEY = "luxstay-theme"
const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
  window.localStorage.clear()
  document.documentElement.classList.remove("dark")
  document.documentElement.style.colorScheme = ""
})

function Probe() {
  const { theme, isDark, toggleTheme } = useTheme()
  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <p data-testid="is-dark">{String(isDark)}</p>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

function rootStyles() {
  const root = document.documentElement
  return {
    hasDarkClass: root.classList.contains("dark"),
    colorScheme: root.style.colorScheme,
    stored: window.localStorage.getItem(STORAGE_KEY),
  }
}

describe("ThemeProvider", () => {
  it("starts on the light theme without stored preferences", () => {
    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
    expect(screen.getByTestId("is-dark")).toHaveTextContent("false")
    expect(rootStyles()).toEqual({
      hasDarkClass: false,
      colorScheme: "light",
      stored: "light",
    })
  })

  it("restores a stored dark theme", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark")

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(screen.getByTestId("is-dark")).toHaveTextContent("true")
    expect(rootStyles()).toEqual({
      hasDarkClass: true,
      colorScheme: "dark",
      stored: "dark",
    })
  })

  it("ignores an invalid stored value and follows the system preference", () => {
    window.localStorage.setItem(STORAGE_KEY, "purple")
    window.matchMedia = (jest
      .fn()
      .mockReturnValue({
        matches: true,
      }) as unknown as typeof window.matchMedia)

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(rootStyles().hasDarkClass).toBe(true)
  })

  it("falls back to light when nothing matches", () => {
    window.localStorage.setItem(STORAGE_KEY, "purple")

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
    expect(rootStyles()).toEqual({
      hasDarkClass: false,
      colorScheme: "light",
      stored: "light",
    })
  })

  it("toggles to dark and persists it", async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByText("toggle"))

    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(screen.getByTestId("is-dark")).toHaveTextContent("true")
    expect(rootStyles()).toEqual({
      hasDarkClass: true,
      colorScheme: "dark",
      stored: "dark",
    })
  })

  it("toggles back to light", async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByText("toggle"))
    await user.click(screen.getByText("toggle"))

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
    expect(screen.getByTestId("is-dark")).toHaveTextContent("false")
    expect(rootStyles()).toEqual({
      hasDarkClass: false,
      colorScheme: "light",
      stored: "light",
    })
  })

  it("throws when useTheme is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      "useTheme must be used inside ThemeProvider",
    )
  })
})
