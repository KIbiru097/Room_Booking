import { render, screen, waitFor } from "@testing-library/react"
import BlurText from "@/components/BlurText"

// jsdom has no IntersectionObserver, and BlurText observes its own root span.
// The stub reports every observed element as visible, synchronously, and keeps
// the options it was constructed with so the viewport props stay observable.
const ioOptions: IntersectionObserverInit[] = []

class ImmediateIntersectionObserver {
  private callback: IntersectionObserverCallback
  root = null
  rootMargin = ""
  thresholds: number[] = []

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback
    ioOptions.push(options ?? {})
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

// Never reports intersection, so the component has to stay in its hidden state.
class NeverIntersectionObserver {
  root = null
  rootMargin = ""
  thresholds: number[] = []

  constructor(
    _callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    ioOptions.push(options ?? {})
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [] as IntersectionObserverEntry[]
  }
}

function wrapperOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement
}

describe("BlurText", () => {
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
    ioOptions.length = 0
  })

  afterEach(() => {
    window.IntersectionObserver =
      (ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)
  })

  it("renders every word of the given text as its own span", () => {
    const { container } = render(<BlurText text="Sun set villa" />)

    const wrapper = wrapperOf(container)
    const words = Array.from(wrapper.children)

    expect(wrapper.tagName).toBe("SPAN")
    expect(words).toHaveLength(3)
    expect(words.map((word) => word.textContent)).toEqual([
      "Sun\u00A0",
      "set\u00A0",
      "villa",
    ])
    expect(wrapper.textContent).toBe("Sun\u00A0set\u00A0villa")
    expect(screen.getByText("Sun")).toBeInTheDocument()
    expect(screen.getByText("set")).toBeInTheDocument()
    expect(screen.getByText("villa")).toBeInTheDocument()
  })

  it("renders every character when animateBy is letters", () => {
    const { container } = render(<BlurText text="a b" animateBy="letters" />)

    const wrapper = wrapperOf(container)
    const letters = Array.from(wrapper.children)

    expect(letters).toHaveLength(3)
    expect(letters.map((letter) => letter.textContent)).toEqual([
      "a",
      "\u00A0",
      "b",
    ])
    expect(wrapper.textContent).toBe("a\u00A0b")
    expect(screen.getByText("b")).toBeInTheDocument()
  })

  it("appends the extra word separator only between words", () => {
    const { container } = render(<BlurText text="one" />)

    expect(wrapperOf(container).textContent).toBe("one")
    expect(Array.from(wrapperOf(container).children)).toHaveLength(1)
  })

  it("applies the custom class name next to the layout classes", () => {
    const { container } = render(
      <BlurText text="Hello" className="hero-title" />,
    )

    expect(wrapperOf(container).className).toContain("hero-title")
    expect(wrapperOf(container).className).toContain("inline-flex flex-wrap")
  })

  it("starts blurred and settles into the revealed state", async () => {
    const { container } = render(<BlurText text="Hello" />)

    const segment = wrapperOf(container).children[0] as HTMLElement
    expect(segment.style.display).toBe("inline-block")
    expect(segment.style.opacity).toBe("0")
    expect(segment.style.filter).toBe("blur(12px)")
    expect(segment.style.transform).toBe("translateY(30px)")

    await waitFor(
      () => {
        expect(segment.style.opacity).toBe("1")
        expect(segment.style.filter).toBe("blur(0px)")
        expect(segment.style.transform).toBe("none")
      },
      { timeout: 3000 },
    )
  })

  it("offsets upward when the direction is top", async () => {
    const { container } = render(<BlurText text="Hello" direction="top" />)

    const segment = wrapperOf(container).children[0] as HTMLElement
    expect(segment.style.transform).toBe("translateY(-30px)")

    await waitFor(() => expect(segment.style.transform).toBe("none"), {
      timeout: 3000,
    })
  })

  it("keeps the text hidden until the viewport says otherwise", () => {
    window.IntersectionObserver =
      (NeverIntersectionObserver as unknown as typeof IntersectionObserver)

    const { container } = render(<BlurText text="Hidden" />)

    const segment = wrapperOf(container).children[0] as HTMLElement
    expect(segment.style.opacity).toBe("0")
    expect(segment.style.filter).toBe("blur(12px)")
    expect(segment.style.transform).toBe("translateY(30px)")
    expect(ioOptions[0]).toEqual(
      expect.objectContaining({ threshold: 0.1, rootMargin: "0px" }),
    )
  })

  it("forwards the threshold and root margin to IntersectionObserver", () => {
    render(<BlurText text="Hi" />)
    expect(ioOptions[0]).toEqual(
      expect.objectContaining({ threshold: 0.1, rootMargin: "0px" }),
    )

    render(<BlurText text="Hi" threshold={0.4} rootMargin="20px" />)
    expect(ioOptions[1]).toEqual(
      expect.objectContaining({ threshold: 0.4, rootMargin: "20px" }),
    )
  })

  it("fires onAnimationComplete once the last segment finishes", async () => {
    const onAnimationComplete = jest.fn()
    render(<BlurText text="Bye" onAnimationComplete={onAnimationComplete} />)

    await waitFor(() => expect(onAnimationComplete).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    })
  })

  it("finishes the animation with custom delay, easing and step duration", async () => {
    const onAnimationComplete = jest.fn()
    render(
      <BlurText
        text="Quick"
        delay={0}
        easing="linear"
        stepDuration={0.05}
        onAnimationComplete={onAnimationComplete}
      />,
    )

    await waitFor(() => expect(onAnimationComplete).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    })
  })

  it("renders an empty string without crashing", () => {
    const { container } = render(<BlurText />)

    const wrapper = wrapperOf(container)
    expect(wrapper.tagName).toBe("SPAN")
    expect(wrapper.textContent).toBe("")
    expect(Array.from(wrapper.children)).toHaveLength(1)
  })
})
