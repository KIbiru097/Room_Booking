import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@/components/ui/Button"

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Book now</Button>)

    expect(screen.getByRole("button", { name: "Book now" })).toBeInTheDocument()
  })

  it("fires onClick", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Reserve</Button>)
    await user.click(screen.getByRole("button", { name: "Reserve" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("disables itself while loading and shows a spinner", () => {
    render(
      <Button loading leftIcon={<span data-testid="icon" />}>
        Saving
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Saving" })
    expect(button).toBeDisabled()
    expect(button.querySelector("svg")).toBeTruthy()
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument()
  })

  it("respects the disabled attribute", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()

    render(
      <Button disabled onClick={onClick}>
        Blocked
      </Button>,
    )
    await user.click(screen.getByRole("button", { name: "Blocked" }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it("merges custom classes and keeps icons while idle", () => {
    render(
      <Button className="extra" rightIcon={<span data-testid="icon" />}>
        Cancel
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Cancel" })
    expect(button.className).toContain("extra")
    expect(button.className).toContain("rounded-xl")
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("forwards native button attributes", () => {
    render(
      <Button type="submit" aria-label="submit-booking">
        Go
      </Button>,
    )

    const button = screen.getByRole("button", { name: "submit-booking" })
    expect(button).toHaveAttribute("type", "submit")
  })
})
