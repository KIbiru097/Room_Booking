import { render, screen, waitFor } from "@testing-library/react"
import FadeContent from "@/components/FadeContent"

// jsdom has no IntersectionObserver and framer-motion's useInView needs one.
// The stub reports every observed element as visible, synchronously.
class ImmediateIntersectionObserver {
  private callback: IntersectionObserverCallback
  root = null
  rootMargin = ""
  thresholds: number[] = []

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [] as IntersectionObserverEntry[]
  }
}

describe("FadeContent", () => {
  beforeAll(() => {
    window.IntersectionObserver =
      (ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)
  })

  afterAll(() => {
    delete (window as { IntersectionObserver?: typeof IntersectionObserver })
      .IntersectionObserver
  })

  beforeEach(() => {
    localStorage.clear()
  })

  it("renders its children", () => {
    render(
      <FadeContent>
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    expect(screen.getByText("Fading paragraph")).toBeInTheDocument()
  })

  it("applies the wrapper class name", () => {
    const { container } = render(
      <FadeContent className="extra-class">
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    expect((container.firstElementChild as HTMLElement).className).toContain(
      "extra-class",
    )
  })

  it("starts hidden below and fades in when it enters the viewport", async () => {
    const { container } = render(
      <FadeContent>
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    const box = container.firstElementChild as HTMLElement
    expect(box.style.opacity).toBe("0")
    expect(box.style.transform).toBe("translateY(24px)")

    // framer-motion's frame loop only ticks against real timers in jsdom, and it
    // drops a zeroed translation to `none` once the animation settles.
    await waitFor(
      () => {
        expect(box.style.opacity).toBe("1")
        expect(box.style.transform).toBe("none")
        expect(box.style.filter).toBe("blur(0px)")
      },
      { timeout: 3000 },
    )
  })

  it("fades in from above for the down direction", async () => {
    const { container } = render(
      <FadeContent direction="down" distance={40}>
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    const box = container.firstElementChild as HTMLElement
    expect(box.style.transform).toBe("translateY(-40px)")

    await waitFor(() => expect(box.style.transform).toBe("none"), {
      timeout: 3000,
    })
  })

  it("does not offset vertically for direction none", () => {
    const { container } = render(
      <FadeContent direction="none">
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    const box = container.firstElementChild as HTMLElement
    expect(box.style.transform).toBe("none")
  })

  it("applies the blur filter while hidden when blur is enabled", async () => {
    const { container } = render(
      <FadeContent blur>
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    const box = container.firstElementChild as HTMLElement
    expect(box.style.filter).toBe("blur(8px)")

    await waitFor(() => expect(box.style.filter).toBe("blur(0px)"), {
      timeout: 3000,
    })
  })

  it("keeps the blur filter neutral when blur is disabled", () => {
    const { container } = render(
      <FadeContent blur={false}>
        <p>Fading paragraph</p>
      </FadeContent>,
    )

    expect((container.firstElementChild as HTMLElement).style.filter).toBe(
      "blur(0px)",
    )
  })
})
