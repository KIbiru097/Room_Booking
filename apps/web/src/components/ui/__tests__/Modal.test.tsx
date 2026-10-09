import type { ComponentProps, ReactNode } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Modal } from "@/components/ui/Modal"

describe("Modal", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const renderModal = (
    overrides: Partial<Omit<ComponentProps<typeof Modal>, "children">> = {},
    children: ReactNode = "Modal body",
  ) => {
    const onClose = jest.fn()
    const utils = render(
      <Modal isOpen onClose={onClose} title="Confirm booking" {...overrides}>
        {children}
      </Modal>,
    )
    return { onClose, ...utils }
  }

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false })

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("exposes a modal dialog with its title, description and content", () => {
    renderModal({ description: "This cannot be undone." })

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(
      within(dialog).getByRole("heading", { name: "Confirm booking" }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("This cannot be undone."),
    ).toBeInTheDocument()
    expect(within(dialog).getByText("Modal body")).toBeInTheDocument()
  })

  it("skips the description when there is no title", () => {
    renderModal({ title: undefined, description: "Orphan description" })

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByText("Orphan description")).not.toBeInTheDocument()
  })

  it("calls onClose from the close button", async () => {
    const { onClose } = renderModal()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Close modal" }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("hides the close button when showCloseButton is false", () => {
    renderModal({ showCloseButton: false })

    expect(
      screen.queryByRole("button", { name: "Close modal" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Modal body")).toBeInTheDocument()
  })

  it("calls onClose when the backdrop is clicked", async () => {
    const { onClose } = renderModal()
    const user = userEvent.setup()
    const dialog = screen.getByRole("dialog")
    const backdrop = dialog.firstElementChild as HTMLElement

    expect(backdrop).toHaveAttribute("aria-hidden", "true")
    await user.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes when Escape is pressed", async () => {
    const { onClose } = renderModal()
    const user = userEvent.setup()

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("ignores other keys", async () => {
    const { onClose } = renderModal()
    const user = userEvent.setup()

    await user.keyboard("{Enter}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("does not listen for Escape while closed", async () => {
    const { onClose } = renderModal({ isOpen: false })
    const user = userEvent.setup()

    await user.keyboard("{Escape}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("focuses the close button with Tab and closes on Enter", async () => {
    const { onClose } = renderModal()
    const user = userEvent.setup()
    const closeButton = screen.getByRole("button", { name: "Close modal" })

    await user.tab()

    expect(closeButton).toHaveFocus()

    await user.keyboard("{Enter}")

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("locks body scroll while open and restores it when closed", () => {
    const { rerender, onClose } = renderModal()

    expect(document.body.style.overflow).toBe("hidden")

    rerender(
      <Modal isOpen={false} onClose={onClose} title="Confirm booking">
        Modal body
      </Modal>,
    )

    expect(document.body.style.overflow).toBe("")
  })

  it("restores body scroll on unmount", () => {
    const { unmount } = renderModal()

    expect(document.body.style.overflow).toBe("hidden")

    unmount()

    expect(document.body.style.overflow).toBe("")
  })

  it.each([
    ["sm", "max-w-sm"],
    ["md", "max-w-md"],
    ["lg", "max-w-lg"],
    ["xl", "max-w-xl"],
    ["2xl", "max-w-2xl"],
  ] as const)("applies the %s max width", (maxWidth, widthClass) => {
    renderModal({ maxWidth })

    const card = screen.getByRole("dialog").lastElementChild as HTMLElement
    expect(card).toHaveClass(widthClass)
  })
})
