import type { ComponentProps, ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Drawer } from "@/components/ui/Drawer"

describe("Drawer", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const renderDrawer = (
    overrides: Partial<Omit<ComponentProps<typeof Drawer>, "children">> = {},
    children: ReactNode = "Drawer body",
  ) => {
    const onClose = jest.fn()
    const utils = render(
      <Drawer isOpen onClose={onClose} title="Filters" {...overrides}>
        {children}
      </Drawer>,
    )
    return { onClose, ...utils }
  }

  it("renders nothing while closed", () => {
    const { container } = renderDrawer({ isOpen: false })

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("exposes a modal dialog with its title and content", () => {
    renderDrawer()

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(within(dialog).getByText("Filters")).toBeInTheDocument()
    expect(within(dialog).getByText("Drawer body")).toBeInTheDocument()
  })

  it("calls onClose from the header close button", async () => {
    const { onClose } = renderDrawer()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Close drawer" }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when the backdrop is clicked", async () => {
    const { onClose } = renderDrawer()
    const user = userEvent.setup()
    const dialog = screen.getByRole("dialog")
    const backdrop = dialog.firstElementChild as HTMLElement

    expect(backdrop).toHaveAttribute("aria-hidden", "true")
    await user.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes when Escape is pressed", async () => {
    const { onClose } = renderDrawer()
    const user = userEvent.setup()

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("ignores other keys", async () => {
    const { onClose } = renderDrawer()
    const user = userEvent.setup()

    await user.keyboard("{Enter}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("does not listen for Escape while closed", async () => {
    const { onClose } = renderDrawer({ isOpen: false })
    const user = userEvent.setup()

    await user.keyboard("{Escape}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("focuses the close button with Tab and closes on Enter", async () => {
    const { onClose } = renderDrawer()
    const user = userEvent.setup()
    const closeButton = screen.getByRole("button", { name: "Close drawer" })

    await user.tab()

    expect(closeButton).toHaveFocus()

    await user.keyboard("{Enter}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("locks body scroll while open and restores it when closed", () => {
    const { rerender, onClose } = renderDrawer()

    expect(document.body.style.overflow).toBe("hidden")

    rerender(
      <Drawer isOpen={false} onClose={onClose} title="Filters">
        Drawer body
      </Drawer>,
    )

    expect(document.body.style.overflow).toBe("")
  })

  it("restores body scroll on unmount", () => {
    const { unmount } = renderDrawer()

    expect(document.body.style.overflow).toBe("hidden")

    unmount()

    expect(document.body.style.overflow).toBe("")
  })

  it("renders the bottom sheet layout with a drag handle by default", () => {
    renderDrawer()

    const panel = screen.getByRole("dialog").lastElementChild as HTMLElement
    expect(panel).toHaveClass("mt-auto", "max-h-[85vh]", "rounded-t-3xl")
    expect(panel.querySelector(".w-12")).toBeTruthy()
  })

  it("renders the right-side layout without a handle", () => {
    renderDrawer({ position: "right" })

    const panel = screen.getByRole("dialog").lastElementChild as HTMLElement
    expect(panel).toHaveClass("ml-auto", "max-w-md", "border-l")
    expect(panel.querySelector(".w-12")).toBeNull()
  })

  it("renders children even without a title", () => {
    renderDrawer({ title: undefined })

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Drawer body")).toBeInTheDocument()
    expect(within(dialog).queryByText("Filters")).not.toBeInTheDocument()
  })
})
