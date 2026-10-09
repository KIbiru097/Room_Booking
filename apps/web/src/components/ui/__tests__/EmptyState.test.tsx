import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/ui/EmptyState"

const CustomIcon = (() => (
  <span data-testid="custom-icon" />
)) as unknown as LucideIcon

describe("EmptyState", () => {
  it("renders its title as a heading", () => {
    render(<EmptyState title="No rooms yet" />)

    expect(
      screen.getByRole("heading", { level: 4, name: "No rooms yet" }),
    ).toBeInTheDocument()
  })

  it("renders the default folder icon", () => {
    const { container } = render(<EmptyState title="Nothing here" />)

    expect(container.querySelector("svg")).toBeTruthy()
  })

  it("renders a custom icon instead of the default one", () => {
    const { container } = render(
      <EmptyState title="Nothing here" icon={CustomIcon} />,
    )

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
    expect(container.querySelector("svg")).toBeNull()
  })

  it("renders the optional description", () => {
    render(
      <EmptyState
        title="No bookings"
        description="Your trips will show up here."
      />,
    )

    expect(
      screen.getByText("Your trips will show up here."),
    ).toBeInTheDocument()
  })

  it("omits the description when it is not provided", () => {
    const { container } = render(<EmptyState title="No bookings" />)

    expect(container.querySelector("p")).toBeNull()
  })

  it("renders the gold action button and fires onAction", async () => {
    const onAction = jest.fn()
    const user = userEvent.setup()

    render(
      <EmptyState
        title="No rooms"
        actionLabel="Add room"
        onAction={onAction}
      />,
    )

    const button = screen.getByRole("button", { name: "Add room" })
    expect(button).toHaveClass("bg-[#e4bd55]")

    await user.click(button)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("hides the action when only actionLabel is given", () => {
    render(<EmptyState title="No rooms" actionLabel="Add room" />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("hides the action when only onAction is given", () => {
    render(<EmptyState title="No rooms" onAction={jest.fn()} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders extra children", () => {
    render(
      <EmptyState title="No rooms">
        <p>Custom footer</p>
      </EmptyState>,
    )

    expect(screen.getByText("Custom footer")).toBeInTheDocument()
  })

  it("merges custom class names", () => {
    const { container } = render(
      <EmptyState title="No rooms" className="my-extra" />,
    )

    expect(container.firstElementChild).toHaveClass("my-extra", "border-dashed")
  })
})
