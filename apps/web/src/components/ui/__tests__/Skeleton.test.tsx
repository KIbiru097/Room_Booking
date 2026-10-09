import { render, screen } from "@testing-library/react"
import { Skeleton } from "@/components/ui/Skeleton"

describe("Skeleton", () => {
  it("renders a hidden pulsing placeholder", () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstElementChild as HTMLElement

    expect(skeleton).toHaveAttribute("aria-hidden", "true")
    expect(skeleton).toHaveClass("animate-pulse", "bg-slate-200/80")
    expect(skeleton.tagName).toBe("DIV")
  })

  it("uses the rounded variant by default", () => {
    const { container } = render(<Skeleton />)

    expect(container.firstElementChild).toHaveClass("rounded-2xl")
  })

  it.each([
    ["text", ["h-4", "w-full", "rounded"]],
    ["circular", ["rounded-full"]],
    ["rectangular", ["rounded-none"]],
    ["rounded", ["rounded-2xl"]],
  ] as const)("applies the %s variant styles", (variant, classes) => {
    const { container } = render(<Skeleton variant={variant} />)

    expect(container.firstElementChild).toHaveClass(...classes)
  })

  it("merges custom class names and forwards native props", () => {
    render(
      <Skeleton
        className="h-20 w-40"
        data-testid="skeleton"
        role="presentation"
      />,
    )

    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveClass("h-20", "w-40", "animate-pulse")
    expect(skeleton).toHaveAttribute("role", "presentation")
  })
})
