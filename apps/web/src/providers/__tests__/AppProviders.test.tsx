import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-store"
import { getQueryClient } from "@/lib/query-client"
import { useToastStore } from "@/components/ui/Toast"
import { AppProviders } from "@/providers/AppProviders"

const originalLoadFromStorage = useAuth.getState().loadFromStorage
const originalRefreshAuth = useAuth.getState().refreshAuth

let loadSpy: jest.Mock
let refreshSpy: jest.Mock

beforeEach(() => {
  window.localStorage.clear()
  loadSpy = jest.fn(originalLoadFromStorage)
  refreshSpy = jest.fn(originalRefreshAuth)
  useAuth.setState({
    user: null,
    tokens: null,
    loading: false,
    isInitialized: false,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: false,
    loadFromStorage: loadSpy,
    refreshAuth: refreshSpy,
  })
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  useAuth.setState({
    loadFromStorage: originalLoadFromStorage,
    refreshAuth: originalRefreshAuth,
  })
  jest.restoreAllMocks()
  getQueryClient().clear()
  document.documentElement.classList.remove("dark")
  document.documentElement.style.colorScheme = ""
})

function Child() {
  return <p>child content</p>
}

function ClientProbe() {
  const client = useQueryClient()
  const data = client.getQueryData(["probe-key"])
  const sameAsShared = client === getQueryClient()
  return (
    <p data-testid="probe">{`${sameAsShared}:${JSON.stringify(data ?? null)}`}</p>
  )
}

describe("AppProviders", () => {
  it("renders its children", () => {
    render(
      <AppProviders>
        <Child />
      </AppProviders>,
    )

    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("restores the saved session on mount", () => {
    render(
      <AppProviders>
        <Child />
      </AppProviders>,
    )

    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it("refreshes the session every 14 minutes", () => {
    jest.useFakeTimers()
    try {
      render(
        <AppProviders>
          <Child />
        </AppProviders>,
      )

      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000 - 1)
      })
      expect(refreshSpy).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(1)
      })
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000)
      })
      expect(refreshSpy).toHaveBeenCalledTimes(2)
    } finally {
      jest.useRealTimers()
    }
  })

  it("stops refreshing once it unmounts", () => {
    jest.useFakeTimers()
    try {
      const { unmount } = render(
        <AppProviders>
          <Child />
        </AppProviders>,
      )

      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000)
      })
      expect(refreshSpy).toHaveBeenCalledTimes(1)

      unmount()

      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000)
      })
      expect(refreshSpy).toHaveBeenCalledTimes(1)
      expect(loadSpy).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })

  it("shares the browser query client with its descendants", () => {
    getQueryClient().setQueryData(["probe-key"], { ok: true })

    render(
      <AppProviders>
        <ClientProbe />
      </AppProviders>,
    )

    expect(screen.getByTestId("probe")).toHaveTextContent('true:{"ok":true}')
  })

  it("mounts the toast container", () => {
    render(
      <AppProviders>
        <Child />
      </AppProviders>,
    )

    expect(screen.queryByRole("status")).toBeNull()

    act(() => {
      useToastStore
        .getState()
        .addToast({ type: "success", title: "Saved", duration: 0 })
    })

    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Saved")).toBeInTheDocument()
  })
})
