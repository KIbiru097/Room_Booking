import { render, cleanup } from "@testing-library/react"
import AuthBootstrap from "@/components/AuthBootstrap"
import { useAuth } from "@/lib/auth-store"

const REFRESH_INTERVAL_MS = 14 * 60 * 1000

describe("AuthBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    localStorage.clear()
    useAuth.setState({
      user: null,
      tokens: null,
      loading: false,
      isInitialized: false,
      isAdmin: false,
      isManager: false,
      isStaff: false,
      isCustomer: false,
    })
  })

  afterEach(() => {
    cleanup()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("renders nothing", () => {
    const { container } = render(<AuthBootstrap />)
    expect(container).toBeEmptyDOMElement()
  })

  it("hydrates the session from storage on mount", () => {
    const loadFromStorage = jest.spyOn(useAuth.getState(), "loadFromStorage")

    render(<AuthBootstrap />)

    expect(loadFromStorage).toHaveBeenCalledTimes(1)
  })

  it("schedules a token refresh every 14 minutes", () => {
    const refreshAuth = jest.spyOn(
      useAuth.getState(),
      "refreshAuth",
    ) as jest.Mock
    refreshAuth.mockClear()

    render(<AuthBootstrap />)
    expect(refreshAuth).not.toHaveBeenCalled()

    jest.advanceTimersByTime(REFRESH_INTERVAL_MS - 1)
    expect(refreshAuth).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(refreshAuth).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(REFRESH_INTERVAL_MS)
    expect(refreshAuth).toHaveBeenCalledTimes(2)
  })

  it("clears the refresh interval when unmounted", () => {
    const refreshAuth = jest.spyOn(
      useAuth.getState(),
      "refreshAuth",
    ) as jest.Mock
    refreshAuth.mockClear()

    const { unmount } = render(<AuthBootstrap />)
    unmount()

    jest.advanceTimersByTime(REFRESH_INTERVAL_MS * 3)
    expect(refreshAuth).not.toHaveBeenCalled()
  })
})
