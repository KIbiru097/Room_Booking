import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/ui/StatusBadge"

describe("StatusBadge", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders translated labels for booking statuses", () => {
    render(<StatusBadge status="CONFIRMED" />)
    expect(screen.getByText("Confirmed")).toBeInTheDocument()

    render(<StatusBadge status="CHECKED_IN" />)
    expect(screen.getByText("Checked In")).toBeInTheDocument()
  })

  it("maps payment statuses to their copy", () => {
    render(<StatusBadge status="SUCCEEDED" />)
    expect(screen.getByText("Paid")).toBeInTheDocument()

    render(<StatusBadge status="AWAITING_EXTERNAL_CONFIRMATION" />)
    expect(screen.getByText("Awaiting Payment")).toBeInTheDocument()
  })

  it("maps refund statuses", () => {
    render(<StatusBadge status="REFUNDED" />)
    expect(screen.getByText("Refunded")).toBeInTheDocument()

    render(<StatusBadge status="REFUND_FAILED" />)
    expect(screen.getByText("Refund Failed")).toBeInTheDocument()
  })

  it("normalizes lowercase input", () => {
    render(<StatusBadge status="confirmed" />)
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
  })

  it("falls back to the raw status for unknown values", () => {
    render(<StatusBadge status="WEIRD_STATUS" />)
    expect(screen.getByText("WEIRD STATUS")).toBeInTheDocument()
  })

  it("applies variant styles per status", () => {
    const { container } = render(<StatusBadge status="SUCCEEDED" />)
    const badge = container.firstElementChild as HTMLElement

    expect(badge.className).toContain("bg-emerald-50")
    expect(badge.className).toContain("text-emerald-700")
  })

  it("supports the compact size", () => {
    const { container } = render(<StatusBadge status="PENDING" size="sm" />)
    const badge = container.firstElementChild as HTMLElement

    expect(badge.className).toContain("text-[11px]")
    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("accepts extra class names", () => {
    const { container } = render(
      <StatusBadge status="CANCELLED" className="my-extra" />,
    )
    const badge = container.firstElementChild as HTMLElement

    expect(badge.className).toContain("my-extra")
    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })
})
