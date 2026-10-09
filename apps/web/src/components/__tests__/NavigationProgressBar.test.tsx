import { render, fireEvent, act, screen } from "@testing-library/react"
import { NavigationProgressBar } from "@/components/NavigationProgressBar"

let mockPathname = "/"
const mockSearchParams = new URLSearchParams("")

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useParams: () => ({}),
}))

const getBar = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"]') as HTMLElement | null

const renderWithLink = (
  href: string,
  extraProps: Record<string, unknown> = {},
) => {
  const utils = render(
    <div>
      <NavigationProgressBar />
      <a href={href} {...extraProps}>
        navigate
      </a>
    </div>,
  )
  return { ...utils, link: screen.getByRole("link", { name: "navigate" }) }
}

describe("NavigationProgressBar", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPathname = "/"
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("renders nothing before any navigation starts", () => {
    const { container } = render(<NavigationProgressBar />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows progress for an internal link and hides it again", () => {
    const { container, link } = renderWithLink("/search")

    fireEvent.click(link)

    const bar = getBar(container)
    expect(bar).not.toBeNull()
    expect(bar!.style.opacity).toBe("1")
    expect((bar!.firstElementChild as HTMLElement).style.width).toBe("100%")

    act(() => {
      jest.advanceTimersByTime(150)
    })
    expect((bar!.firstElementChild as HTMLElement).style.width).toBe("65%")

    act(() => {
      jest.advanceTimersByTime(150)
    })
    expect(getBar(container)).toBeNull()
  })

  it("ignores external links", () => {
    const { container, link } = renderWithLink("https://example.com/docs")

    fireEvent.click(link)

    expect(getBar(container)).toBeNull()
  })

  it("ignores protocol-relative links", () => {
    const { container, link } = renderWithLink("//example.com/docs")

    fireEvent.click(link)

    expect(getBar(container)).toBeNull()
  })

  it("ignores links that open in another browsing context", () => {
    const { container, link } = renderWithLink("/search", { target: "_blank" })

    fireEvent.click(link)

    expect(getBar(container)).toBeNull()
  })

  it("ignores modified clicks and non-path hrefs", () => {
    const { container, link, rerender } = renderWithLink("/search")

    fireEvent.click(link, { ctrlKey: true })
    expect(getBar(container)).toBeNull()

    fireEvent.click(link, { metaKey: true })
    expect(getBar(container)).toBeNull()

    rerender(
      <div>
        <NavigationProgressBar />
        <a href="#section">navigate</a>
      </div>,
    )
    fireEvent.click(screen.getByRole("link", { name: "navigate" }))
    expect(getBar(container)).toBeNull()
  })

  it("ignores a click that targets the current URL", () => {
    const { container, link } = renderWithLink("/")

    fireEvent.click(link)

    expect(getBar(container)).toBeNull()
  })

  it("restarts the completion timer when the route actually changes", () => {
    const { container, link, rerender } = renderWithLink("/search")

    fireEvent.click(link)
    expect(getBar(container)).not.toBeNull()

    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(getBar(container)).not.toBeNull()

    mockPathname = "/search"
    rerender(
      <div>
        <NavigationProgressBar />
        <a href="/search">navigate</a>
      </div>,
    )

    expect(getBar(container)).not.toBeNull()
    expect(
      (getBar(container)!.firstElementChild as HTMLElement).style.width,
    ).toBe("100%")

    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(getBar(container)).not.toBeNull()

    act(() => {
      jest.advanceTimersByTime(50)
    })
    expect(getBar(container)).toBeNull()
  })
})
