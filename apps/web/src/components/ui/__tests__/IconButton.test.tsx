import { createRef } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconButton } from "@/components/ui/IconButton"

describe("IconButton", () => {
  const icon = <span data-testid="icon" />

  it("renders its icon inside a button labelled for screen readers", () => {
    render(<IconButton aria-label="Close dialog" icon={icon} />)

    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument()
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("uses the default variant and size", () => {
    render(<IconButton aria-label="Settings" icon={icon} />)

    expect(screen.getByRole("button", { name: "Settings" })).toHaveClass(
      "bg-[#0b1528]",
      "text-white",
      "w-11",
      "min-w-[44px]",
    )
  })

  it.each([
    ["gold", ["bg-[#e4bd55]", "text-[#07111f]"]],
    ["ghost", ["hover:bg-slate-100", "text-[#475569]"]],
    ["outline", ["bg-white/70", "border", "text-[#0b1528]"]],
  ] as const)("applies the %s variant styles", (variant, classes) => {
    render(<IconButton aria-label="Action" variant={variant} icon={icon} />)

    expect(screen.getByRole("button", { name: "Action" })).toHaveClass(
      ...classes,
    )
  })

  it.each([
    ["sm", "w-9"],
    ["md", "w-11"],
    ["lg", "w-13"],
  ] as const)("applies the %s size styles", (size, widthClass) => {
    render(<IconButton aria-label="Action" size={size} icon={icon} />)

    expect(screen.getByRole("button", { name: "Action" })).toHaveClass(
      widthClass,
    )
  })

  it("fires onClick", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()

    render(<IconButton aria-label="Refresh" icon={icon} onClick={onClick} />)
    await user.click(screen.getByRole("button", { name: "Refresh" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("ignores clicks while disabled", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()

    render(
      <IconButton
        aria-label="Refresh"
        icon={icon}
        disabled
        onClick={onClick}
      />,
    )
    const button = screen.getByRole("button", { name: "Refresh" })

    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("applies disabled affordances", () => {
    render(<IconButton aria-label="Refresh" icon={icon} disabled />)

    expect(screen.getByRole("button", { name: "Refresh" })).toHaveClass(
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
      "focus-visible:ring-2",
    )
  })

  it("merges custom class names", () => {
    render(<IconButton aria-label="Action" icon={icon} className="my-extra" />)

    expect(screen.getByRole("button", { name: "Action" })).toHaveClass(
      "my-extra",
      "rounded-xl",
    )
  })

  it("forwards native button attributes", () => {
    render(
      <IconButton
        aria-label="Save"
        icon={icon}
        type="submit"
        form="booking-form"
      />,
    )

    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toHaveAttribute("type", "submit")
    expect(button).toHaveAttribute("form", "booking-form")
  })

  it("forwards its ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>()

    render(<IconButton ref={ref} aria-label="Save" icon={icon} />)

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }))
  })
})
