import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CountdownTimer } from "@/components/domain/CountdownTimer"

describe("CountdownTimer", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const getTimer = () => screen.getByRole("timer")

  it("renders the remaining time as mm:ss", () => {
    render(<CountdownTimer initialSeconds={300} />)

    expect(getTimer()).toHaveTextContent("05:00")
    expect(getTimer()).toHaveTextContent("Room Locked for Reservation")
    expect(getTimer()).toHaveTextContent(
      "This room is reserved exclusively for you",
    )
  })

  it("counts down one second at a time", () => {
    render(<CountdownTimer initialSeconds={300} />)

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(getTimer()).toHaveTextContent("04:59")

    act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(getTimer()).toHaveTextContent("04:56")
  })

  it("pads single-digit seconds and minutes", () => {
    render(<CountdownTimer initialSeconds={65} />)

    expect(getTimer()).toHaveTextContent("01:05")

    act(() => {
      jest.advanceTimersByTime(6000)
    })
    expect(getTimer()).toHaveTextContent("00:59")
  })

  it("enters the urgent state when less than two minutes remain", () => {
    render(<CountdownTimer initialSeconds={119} />)

    expect(getTimer()).toHaveTextContent("Hold Expiring Soon")
    expect(getTimer()).toHaveTextContent("01:59")
    expect(getTimer().className).toContain("animate-pulse")

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(getTimer()).toHaveTextContent("Hold Expiring Soon")
  })

  it("keeps the calm state exactly at two minutes", () => {
    render(<CountdownTimer initialSeconds={120} />)

    expect(getTimer()).toHaveTextContent("Room Locked for Reservation")
    expect(getTimer()).not.toHaveTextContent("Hold Expiring Soon")
  })

  it("expires at zero and notifies onExpire", () => {
    const onExpire = jest.fn()
    render(<CountdownTimer initialSeconds={2} onExpire={onExpire} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(getTimer()).toHaveTextContent("Room Hold Expired")
    expect(getTimer()).toHaveTextContent("Your 15-minute room hold has lapsed")
    expect(getTimer().textContent).not.toMatch(/\d{2}:\d{2}/)
    expect(onExpire).toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(getTimer()).toHaveTextContent("Room Hold Expired")
    expect(getTimer().textContent).not.toMatch(/\d{2}:\d{2}/)
  })

  it("calls onExpire immediately when it starts expired", () => {
    const onExpire = jest.fn()
    render(<CountdownTimer initialSeconds={0} onExpire={onExpire} />)

    expect(getTimer()).toHaveTextContent("Room Hold Expired")
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("renders a re-check button when onRefresh is supplied", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onRefresh = jest.fn()
    render(<CountdownTimer initialSeconds={1} onRefresh={onRefresh} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    const refreshButton = screen.getByRole("button", { name: /Re-check Hold/ })
    expect(refreshButton).toBeEnabled()

    await user.click(refreshButton)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("disables the re-check button while refreshing", () => {
    const onRefresh = jest.fn()
    render(
      <CountdownTimer initialSeconds={0} onRefresh={onRefresh} isRefreshing />,
    )

    expect(screen.getByRole("button", { name: /Re-check Hold/ })).toBeDisabled()
  })

  it("renders no refresh button once expired without onRefresh", () => {
    render(<CountdownTimer initialSeconds={0} />)

    expect(getTimer()).toHaveTextContent("Room Hold Expired")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("restarts when the initialSeconds prop changes", () => {
    const { rerender } = render(<CountdownTimer initialSeconds={10} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(getTimer()).toHaveTextContent("00:08")

    rerender(<CountdownTimer initialSeconds={90} />)
    expect(getTimer()).toHaveTextContent("01:30")
  })
})
