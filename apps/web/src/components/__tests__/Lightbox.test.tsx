import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Lightbox from "@/components/Lightbox"

const IMAGES = ["/images/one.jpg", "/images/two.jpg", "/images/three.jpg"]

function backdrop(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement
}

describe("Lightbox", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders the counter, the main image, thumbnails and aria labels", () => {
    const { container } = render(
      <Lightbox images={IMAGES} onClose={jest.fn()} />,
    )

    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    expect(screen.getByAltText("Hotel image 1")).toHaveAttribute(
      "src",
      IMAGES[0],
    )
    expect(
      screen.getByRole("button", { name: "Close lightbox" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Previous image" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Next image" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Thumbnail 1" }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /Thumbnail \d/ }),
    ).toHaveLength(3)
    expect(backdrop(container).className).toContain("fixed inset-0")
  })

  it("honours startIndex and a custom alt text", () => {
    render(
      <Lightbox
        images={IMAGES}
        startIndex={2}
        alt="Suite photo"
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByText("3 / 3")).toBeInTheDocument()
    expect(screen.getByAltText("Suite photo 3")).toHaveAttribute(
      "src",
      IMAGES[2],
    )
    expect(
      screen.getByRole("button", { name: "Thumbnail 3" }).className,
    ).toContain("ring-2")
    expect(
      screen.getByRole("button", { name: "Thumbnail 1" }).className,
    ).not.toContain("ring-2")
  })

  it("hides navigation and thumbnails for a single image", () => {
    render(<Lightbox images={["/images/only.jpg"]} onClose={jest.fn()} />)

    expect(screen.getByText("1 / 1")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Previous image" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Next image" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Thumbnail/ }),
    ).not.toBeInTheDocument()
  })

  it("wraps around with the next and previous buttons", async () => {
    const user = userEvent.setup()
    render(<Lightbox images={IMAGES} onClose={jest.fn()} />)
    const next = screen.getByRole("button", { name: "Next image" })
    const previous = screen.getByRole("button", { name: "Previous image" })

    await user.click(next)
    expect(screen.getByText("2 / 3")).toBeInTheDocument()

    await user.click(next)
    expect(screen.getByText("3 / 3")).toBeInTheDocument()

    await user.click(next)
    expect(screen.getByText("1 / 3")).toBeInTheDocument()

    await user.click(previous)
    expect(screen.getByText("3 / 3")).toBeInTheDocument()
  })

  it("swaps the main image source when the index changes", async () => {
    const user = userEvent.setup()
    render(<Lightbox images={IMAGES} onClose={jest.fn()} />)

    await user.click(screen.getByRole("button", { name: "Next image" }))

    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    await waitFor(
      () => {
        const main = screen.getAllByAltText("Hotel image 2")
        expect(main).toHaveLength(1)
        expect(main[0]).toHaveAttribute("src", IMAGES[1])
      },
      { timeout: 3000 },
    )
  })

  it("navigates with ArrowLeft and ArrowRight", async () => {
    const user = userEvent.setup()
    render(<Lightbox images={IMAGES} onClose={jest.fn()} />)

    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("2 / 3")).toBeInTheDocument()

    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("3 / 3")).toBeInTheDocument()

    await user.keyboard("{ArrowLeft}")
    expect(screen.getByText("2 / 3")).toBeInTheDocument()

    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(screen.getByText("3 / 3")).toBeInTheDocument()
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<Lightbox images={IMAGES} onClose={onClose} />)

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes from the close button", async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<Lightbox images={IMAGES} onClose={onClose} />)

    await user.click(screen.getByRole("button", { name: "Close lightbox" }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes when the backdrop is clicked but not from its children", async () => {
    const onClose = jest.fn()
    const { container } = render(<Lightbox images={IMAGES} onClose={onClose} />)

    fireEvent.click(screen.getByText("1 / 3"))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByAltText("Hotel image 1"))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Next image" }))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(backdrop(container))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("selects an image from the thumbnail strip", async () => {
    const user = userEvent.setup()
    render(<Lightbox images={IMAGES} onClose={jest.fn()} />)

    await user.click(screen.getByRole("button", { name: "Thumbnail 3" }))

    expect(screen.getByText("3 / 3")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Thumbnail 3" }).className,
    ).toContain("ring-2")
    expect(
      screen.getByRole("button", { name: "Thumbnail 1" }).className,
    ).not.toContain("ring-2")
  })

  it("locks and restores the body scroll", () => {
    const { unmount } = render(<Lightbox images={IMAGES} onClose={jest.fn()} />)

    expect(document.body.style.overflow).toBe("hidden")

    unmount()
    expect(document.body.style.overflow).toBe("")
  })

  it("stops listening for keys after unmounting", async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { unmount } = render(<Lightbox images={IMAGES} onClose={onClose} />)

    unmount()
    await user.keyboard("{Escape}{ArrowRight}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("enters from the side given by the navigation direction", async () => {
    const user = userEvent.setup()
    render(<Lightbox images={IMAGES} onClose={jest.fn()} />)

    const first = screen.getByAltText("Hotel image 1")
    await waitFor(
      () => {
        expect(first.style.opacity).toBe("0")
        expect(first.style.transform).toContain("-100%")
      },
      { timeout: 2000 },
    )

    await waitFor(
      () => {
        expect(first.style.opacity).toBe("1")
        expect(first.style.transform).toBe("none")
      },
      { timeout: 3000 },
    )

    await user.click(screen.getByRole("button", { name: "Next image" }))

    // framer-motion paints the enter variant on the following frame, which can
    // lag behind the click when the suite runs in parallel.
    let incoming: HTMLElement = screen.getAllByAltText("Hotel image 2")[0]
    await waitFor(
      () => {
        incoming = screen.getAllByAltText("Hotel image 2")[0]
        expect(incoming.style.transform).toContain("100%")
      },
      { timeout: 2000 },
    )

    await waitFor(
      () => {
        expect(incoming.style.opacity).toBe("1")
        expect(incoming.style.transform).toBe("none")
      },
      { timeout: 3000 },
    )
  })
})
