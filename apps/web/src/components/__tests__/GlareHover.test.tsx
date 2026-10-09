import { render, screen, fireEvent } from "@testing-library/react"
import GlareHover from "@/components/GlareHover"

// jsdom's CSS parser drops comma-separated `background-position` values, so the
// component's glare position would silently vanish. Recording the property on
// CSSStyleDeclaration keeps the assertion behavioural without touching source.
let recordedPositions: string[]
let originalDescriptor: PropertyDescriptor | undefined

function getOverlay(container: HTMLElement): HTMLElement {
  const root = container.firstElementChild as HTMLElement
  return root.children[0] as HTMLElement
}

describe("GlareHover", () => {
  beforeAll(() => {
    originalDescriptor = Object.getOwnPropertyDescriptor(
      CSSStyleDeclaration.prototype,
      "backgroundPosition",
    )
  })

  afterAll(() => {
    if (originalDescriptor) {
      Object.defineProperty(
        CSSStyleDeclaration.prototype,
        "backgroundPosition",
        originalDescriptor,
      )
    }
  })

  beforeEach(() => {
    recordedPositions = []
    Object.defineProperty(CSSStyleDeclaration.prototype, "backgroundPosition", {
      configurable: true,
      get() {
        return recordedPositions[recordedPositions.length - 1] ?? ""
      },
      set(value: string) {
        recordedPositions.push(String(value))
      },
    })
  })

  it("renders its children", () => {
    render(
      <GlareHover>
        <span>Card content</span>
      </GlareHover>,
    )

    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("applies the wrapper classes", () => {
    const { container } = render(
      <GlareHover className="extra">
        <span>Card content</span>
      </GlareHover>,
    )

    expect((container.firstElementChild as HTMLElement).className).toContain(
      "extra",
    )
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "relative overflow-hidden",
    )
  })

  it("starts with the glare hidden using the default white color", () => {
    const { container } = render(
      <GlareHover>
        <span>Card content</span>
      </GlareHover>,
    )

    const overlay = getOverlay(container)
    expect(overlay.style.backgroundPosition).toBe("-100% -100%, 0 0")
    expect(overlay.style.background).toContain("rgba(255, 255, 255, 0.3)")
    expect(overlay.style.background).toContain("linear-gradient(-45deg")
    expect(overlay.style.backgroundSize).toBe("250% 250%, 100% 100%")
    expect(overlay.style.pointerEvents).toBe("none")
    expect(overlay.style.zIndex).toBe("10")
  })

  it("reveals the glare on mouse enter", () => {
    const { container } = render(
      <GlareHover>
        <span>Card content</span>
      </GlareHover>,
    )

    fireEvent.mouseOver(container.firstElementChild as HTMLElement)

    const overlay = getOverlay(container)
    expect(recordedPositions[0]).toBe("-100% -100%, 0 0")
    expect(recordedPositions[recordedPositions.length - 2]).toBe(
      "-100% -100%, 0 0",
    )
    expect(recordedPositions[recordedPositions.length - 1]).toBe(
      "100% 100%, 0 0",
    )
    expect(overlay.style.transition).toBe("600ms ease")
  })

  it("hides the glare again on mouse leave", () => {
    const { container } = render(
      <GlareHover>
        <span>Card content</span>
      </GlareHover>,
    )

    const root = container.firstElementChild as HTMLElement
    fireEvent.mouseOver(root)
    fireEvent.mouseOut(root)

    const overlay = getOverlay(container)
    expect(recordedPositions[recordedPositions.length - 1]).toBe(
      "-100% -100%, 0 0",
    )
    expect(overlay.style.transition).toBe("600ms ease")
  })

  it("honours custom glare color, opacity, angle, size and duration", () => {
    const { container } = render(
      <GlareHover
        glareColor="#ff0000"
        glareOpacity={0.5}
        glareAngle={90}
        glareSize={50}
        transitionDuration={300}
      >
        <span>Card content</span>
      </GlareHover>,
    )

    const overlay = getOverlay(container)
    expect(overlay.style.background).toContain("linear-gradient(90deg")
    expect(overlay.style.background).toContain("rgba(255, 0, 0, 0.5)")
    expect(overlay.style.backgroundSize).toBe("50% 50%, 100% 100%")

    fireEvent.mouseOver(container.firstElementChild as HTMLElement)
    expect(overlay.style.transition).toBe("300ms ease")
    expect(overlay.style.backgroundPosition).toBe("100% 100%, 0 0")
  })

  it("leaves non-hex glare colors untouched", () => {
    const { container } = render(
      <GlareHover glareColor="red" glareOpacity={0.75}>
        <span>Card content</span>
      </GlareHover>,
    )

    expect(getOverlay(container).style.background).toContain("red 70%")
  })

  it("does not animate when the pointer never enters", () => {
    const { container } = render(
      <GlareHover>
        <span>Card content</span>
      </GlareHover>,
    )

    const overlay = getOverlay(container)
    expect(overlay.style.transition).toBe("")
    expect(overlay.style.backgroundPosition).toBe("-100% -100%, 0 0")
    expect(recordedPositions).not.toContain("100% 100%, 0 0")
  })
})
