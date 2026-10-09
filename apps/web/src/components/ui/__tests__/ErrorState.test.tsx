import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ErrorState } from "@/components/ui/ErrorState"

describe("ErrorState", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders an alert region with the message", () => {
    render(<ErrorState message="Network unreachable" />)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Network unreachable")
  })

  it("falls back to the translated default heading", () => {
    render(<ErrorState message="Network unreachable" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong")
  })

  it("prefers a custom title over the default heading", () => {
    render(<ErrorState title="Payment failed" message="Try another card." />)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Payment failed")
    expect(alert).not.toHaveTextContent("Something went wrong")
  })

  it("shows the retry button and fires onRetry", async () => {
    const onRetry = jest.fn()
    const user = userEvent.setup()

    render(<ErrorState message="Boom" onRetry={onRetry} />)

    const button = screen.getByRole("button", { name: "Try Again" })
    expect(button).toHaveClass("border", "text-xs")

    await user.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("omits the retry button when onRetry is missing", () => {
    render(<ErrorState message="Boom" />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders the alert icon", () => {
    const { container } = render(<ErrorState message="Boom" />)

    expect(container.querySelector("svg")).toBeTruthy()
  })

  it("merges custom class names", () => {
    const { container } = render(
      <ErrorState message="Boom" className="my-extra" />,
    )

    expect(container.firstElementChild).toHaveClass(
      "my-extra",
      "border-red-200",
    )
  })
})
