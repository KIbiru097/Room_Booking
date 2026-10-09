import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ToastContainer,
  toast,
  useToastStore,
  type ToastItem,
} from "@/components/ui/Toast"

const enqueue = (partial: Omit<ToastItem, "id">) => {
  useToastStore.getState().addToast(partial)
}

describe("Toast", () => {
  beforeEach(() => {
    localStorage.clear()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    jest.useRealTimers()
    useToastStore.setState({ toasts: [] })
  })

  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastContainer />)

    expect(container).toBeEmptyDOMElement()
  })

  it("announces toasts through a polite live region", () => {
    enqueue({
      type: "success",
      title: "Saved",
      message: "Room updated",
      duration: 0,
    })
    render(<ToastContainer />)

    const region = document.querySelector('[aria-live="polite"]') as HTMLElement
    expect(region).toHaveAttribute("aria-atomic", "true")
    expect(region).toHaveTextContent("Saved")
    expect(region).toHaveTextContent("Room updated")
    expect(region.querySelectorAll('[role="status"]')).toHaveLength(1)
  })

  it("renders the optional message only when present", () => {
    enqueue({ type: "info", title: "Heads up", duration: 0 })
    render(<ToastContainer />)

    expect(screen.getByRole("status")).toHaveTextContent("Heads up")
    expect(screen.getByRole("status").querySelector("p")).toBeNull()
  })

  it.each([
    ["success", "border-emerald-300", "text-emerald-600"],
    ["warning", "border-amber-300", "text-amber-600"],
    ["error", "border-red-300", "text-red-600"],
    ["info", "border-blue-300", "text-blue-600"],
  ] as const)(
    "renders %s toasts with their palette",
    (type, borderClass, iconClass) => {
      enqueue({ type, title: `A ${type} toast`, duration: 0 })
      render(<ToastContainer />)

      const item = screen.getByRole("status")
      expect(item).toHaveClass(borderClass)
      expect(item.querySelector("svg")).toHaveClass(iconClass)
    },
  )

  it("dismisses a toast through its button", async () => {
    const user = userEvent.setup()
    enqueue({ type: "error", title: "Failed", duration: 0 })
    enqueue({ type: "warning", title: "Careful", duration: 0 })
    render(<ToastContainer />)

    const dismissButtons = screen.getAllByRole("button", {
      name: "Dismiss toast",
    })
    expect(dismissButtons).toHaveLength(2)

    await user.click(dismissButtons[0])

    expect(screen.queryByText("Failed")).not.toBeInTheDocument()
    expect(screen.getByText("Careful")).toBeInTheDocument()
    expect(screen.getAllByRole("status")).toHaveLength(1)
  })

  it("keeps at most five toasts, dropping the oldest", () => {
    for (let index = 1; index <= 6; index += 1) {
      enqueue({ type: "info", title: `Toast ${index}`, duration: 0 })
    }
    render(<ToastContainer />)

    expect(screen.getAllByRole("status")).toHaveLength(5)
    expect(screen.queryByText("Toast 1")).not.toBeInTheDocument()
    expect(screen.getByText("Toast 6")).toBeInTheDocument()
  })

  it("auto-dismisses toasts after their duration", () => {
    jest.useFakeTimers()
    enqueue({ type: "info", title: "Temporary", duration: 2000 })
    render(<ToastContainer />)

    expect(screen.getByText("Temporary")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1999)
    })
    expect(screen.getByText("Temporary")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(screen.queryByText("Temporary")).not.toBeInTheDocument()
  })

  it("falls back to a four second duration", () => {
    jest.useFakeTimers()
    enqueue({ type: "info", title: "Default life" })
    render(<ToastContainer />)

    act(() => {
      jest.advanceTimersByTime(3999)
    })
    expect(screen.getByText("Default life")).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(screen.queryByText("Default life")).not.toBeInTheDocument()
  })

  it("never auto-dismisses toasts with a duration of zero", () => {
    jest.useFakeTimers()
    enqueue({ type: "info", title: "Sticky", duration: 0 })
    render(<ToastContainer />)

    act(() => {
      jest.advanceTimersByTime(600_000)
    })

    expect(screen.getByText("Sticky")).toBeInTheDocument()
  })

  it("removes toasts through the store", () => {
    enqueue({ type: "info", title: "Store removed", duration: 0 })
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    act(() => {
      useToastStore.getState().removeToast(toasts[0].id)
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it("enqueues toasts through the toast helpers", () => {
    jest.useFakeTimers()

    toast.success("Saved", "All good")
    toast.warning("Careful")
    toast.error("Failed")
    toast.info("Heads up")

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(4)
    expect(toasts.map((item) => item.type)).toEqual([
      "success",
      "warning",
      "error",
      "info",
    ])
    expect(toasts.map((item) => item.title)).toEqual([
      "Saved",
      "Careful",
      "Failed",
      "Heads up",
    ])
    expect(toasts[0]).toMatchObject({ message: "All good" })
    expect(toasts[1].message).toBeUndefined()
    expect(toasts[0].id).toMatch(/^toast-/)
  })
})
