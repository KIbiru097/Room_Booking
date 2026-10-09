import { act, render, screen } from "@testing-library/react"
import HeroAnimated from "@/app/HeroAnimated"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useParams: () => ({ id: "1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

// Aurora paints with WebGL; jsdom has no GL context.
jest.mock("@/components/Aurora", () => ({
  __esModule: true,
  default: () => <div data-testid="aurora" />,
}))

// jsdom has no IntersectionObserver; framer-motion's useInView needs one.
class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ""
  readonly thresholds: readonly number[] = []
  private readonly callback: IntersectionObserverCallback

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
      this,
    )
  }

  unobserve() {}
  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

describe("HeroAnimated", () => {
  beforeAll(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: TestIntersectionObserver,
    })
  })

  afterAll(() => {
    Reflect.deleteProperty(window, "IntersectionObserver")
  })

  async function renderHero() {
    const utils = render(<HeroAnimated />)
    // Flush the ssr:false dynamic import for Aurora inside act().
    await act(async () => {})
    return utils
  }

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ""
  })

  it("renders the layered hero copy", async () => {
    const { container } = await renderHero()

    expect(container.querySelector("section")).toBeInTheDocument()
    expect(screen.getByText("50,000+ properties worldwide")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Find Your Perfect" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Stay")).toBeInTheDocument()
    expect(
      screen.getByText(/Discover curated luxury hotels, boutique hideaways/),
    ).toBeInTheDocument()
  })

  it("shows the trust signals", async () => {
    await renderHero()

    expect(screen.getByText("Free cancellation")).toBeInTheDocument()
    expect(screen.getByText("Best price guarantee")).toBeInTheDocument()
    expect(screen.getByText("No booking fees")).toBeInTheDocument()
  })

  it("shows the animated headline stat labels", async () => {
    await renderHero()

    expect(screen.getByText("Properties")).toBeInTheDocument()
    expect(screen.getByText("Countries")).toBeInTheDocument()
    expect(screen.getByText("Happy guests")).toBeInTheDocument()
  })

  it("embeds the hero search form", async () => {
    await renderHero()

    expect(screen.getByLabelText("Destination / City")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Find Luxury Stays" }),
    ).toBeInTheDocument()
  })

  it("renders the background photo with its translated alt text", async () => {
    await renderHero()

    expect(screen.getByAltText("Luxury hotel lobby")).toBeInTheDocument()
  })
})
