import { act, render, screen } from "@testing-library/react"
import { MotionGlobalConfig } from "framer-motion"
import CountUp from "@/components/CountUp"

// framer-motion springs keep their own frame loop, which never ticks while jest
// fake timers own requestAnimationFrame. Return the source motion value instead
// so `motionValue.set(to)` notifies subscribers synchronously; the delay and
// formatting behaviour under test stay intact.
jest.mock("framer-motion", () => {
  const actual = jest.requireActual("framer-motion")
  return {
    ...actual,
    useSpring: (value: unknown) => value,
  }
})

// jsdom has no IntersectionObserver; framer-motion's useInView needs one.
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

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

describe("CountUp", () => {
  beforeAll(() => {
    // framer-motion springs do not progress under jest fake timers (the frame
    // loop keeps its pre-fake requestAnimationFrame). Skipping animations lets
    // each animation resolve to its final value on the next frame tick.
    MotionGlobalConfig.skipAnimations = true
    window.IntersectionObserver =
      (ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)
  })

  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false
    delete (window as { IntersectionObserver?: typeof IntersectionObserver })
      .IntersectionObserver
  })

  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('starts at the "from" value', () => {
    render(<CountUp from={10} to={200} />)

    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("animates up to the target value", () => {
    render(<CountUp from={0} to={2000} duration={1} />)

    advance(100)
    advance(5000)

    expect(screen.getByText("2,000")).toBeInTheDocument()
  })

  it("formats the target with the thousands separator", () => {
    render(<CountUp from={0} to={1234567} duration={1} />)

    advance(5000)

    expect(screen.getByText("1,234,567")).toBeInTheDocument()
  })

  it("supports a custom separator", () => {
    render(<CountUp from={0} to={1234567} duration={1} separator="." />)

    advance(5000)

    expect(screen.getByText("1.234.567")).toBeInTheDocument()
  })

  it("renders prefix and suffix around the value", () => {
    render(<CountUp from={0} to={500} duration={1} prefix="$" suffix="+" />)

    advance(5000)

    expect(screen.getByText("$500+")).toBeInTheDocument()
  })

  it("keeps decimal places from the target value", () => {
    render(<CountUp from={0} to={12.5} duration={1} />)

    advance(5000)

    expect(screen.getByText("12.5")).toBeInTheDocument()
  })

  it("waits for the configured delay before animating", () => {
    render(<CountUp from={0} to={100} duration={1} delay={2} />)

    advance(1000)
    expect(screen.getByText("0")).toBeInTheDocument()

    advance(1500)
    advance(5000)
    expect(screen.getByText("100")).toBeInTheDocument()
  })

  it("disables grouping when no separator is provided", () => {
    render(<CountUp from={0} to={1000000} duration={1} separator="" />)

    advance(5000)

    expect(screen.getByText("1000000")).toBeInTheDocument()
  })

  it("applies the className to its output element", () => {
    const { container } = render(
      <CountUp from={0} to={5} className="hero-number" />,
    )

    expect((container.firstElementChild as HTMLElement).className).toContain(
      "hero-number",
    )
  })

  it("stays at zero when from and to are equal", () => {
    render(<CountUp from={0} to={0} duration={1} />)

    advance(5000)

    expect(screen.getByText("0")).toBeInTheDocument()
  })
})
