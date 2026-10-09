import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Badge } from "@/components/ui/Badge"

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Deluxe Suite</Badge>)

    expect(screen.getByText("Deluxe Suite")).toBeInTheDocument()
  })

  it("applies the base layout classes", () => {
    render(<Badge>Base</Badge>)
    const badge = screen.getByText("Base")

    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "uppercase",
      "tracking-wider",
    )
  })

  it("uses the default variant when none is given", () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText("Default")

    expect(badge).toHaveClass(
      "bg-slate-100",
      "text-slate-700",
      "border-slate-200/60",
    )
  })

  it.each([
    ["sapphire", ["bg-[#0b1528]/10", "text-[#0b1528]"]],
    ["gold", ["bg-[#FEF9E7]", "text-[#92400E]"]],
    ["outline", ["bg-white/80", "backdrop-blur-sm"]],
    ["success", ["bg-emerald-50", "text-emerald-700"]],
    ["warning", ["bg-amber-50", "text-amber-700"]],
    ["danger", ["bg-red-50", "text-red-700"]],
  ] as const)("applies the %s variant styles", (variant, classes) => {
    render(<Badge variant={variant}>{variant}</Badge>)
    const badge = screen.getByText(variant)

    expect(badge).toHaveClass(...classes)
  })

  it("uses medium sizing by default", () => {
    render(<Badge>Medium</Badge>)

    expect(screen.getByText("Medium")).toHaveClass(
      "text-xs",
      "px-2.5",
      "py-1",
      "font-semibold",
    )
  })

  it("supports the compact sm size", () => {
    render(<Badge size="sm">Compact</Badge>)

    expect(screen.getByText("Compact")).toHaveClass(
      "text-[11px]",
      "px-2",
      "py-0.5",
      "font-medium",
    )
  })

  it("merges custom class names", () => {
    render(<Badge className="my-extra">Merged</Badge>)

    expect(screen.getByText("Merged")).toHaveClass("my-extra", "rounded-full")
  })

  it("forwards native span attributes and click handlers", async () => {
    const onClick = jest.fn()
    const user = userEvent.setup()

    render(
      <Badge
        variant="gold"
        data-testid="badge"
        title="Room status"
        onClick={onClick}
      >
        Paid
      </Badge>,
    )

    const badge = screen.getByTestId("badge")
    expect(badge).toHaveAttribute("title", "Room status")
    expect(badge.tagName).toBe("SPAN")

    await user.click(badge)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
