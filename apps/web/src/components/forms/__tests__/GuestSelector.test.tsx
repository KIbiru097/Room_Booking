import { useState } from "react"
import { render, screen, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  GuestSelector,
  type GuestCount,
} from "@/components/forms/GuestSelector"

function Harness({
  initial = { adults: 2, children: 1 },
  maxGuests,
}: {
  initial?: GuestCount
  maxGuests?: number
}) {
  const [value, setValue] = useState<GuestCount>(initial)
  return (
    <GuestSelector value={value} onChange={setValue} maxGuests={maxGuests} />
  )
}

describe("GuestSelector", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("shows a summary of the current guest counts", () => {
    render(<Harness initial={{ adults: 2, children: 1 }} />)

    expect(
      screen.getByRole("button", { name: /2 Adults, 1 Child/ }),
    ).toBeInTheDocument()
  })

  it("uses singular labels for a single guest", () => {
    render(<Harness initial={{ adults: 1, children: 0 }} />)

    const trigger = screen.getByRole("button", { name: /1 Adult/ })
    expect(trigger).toBeInTheDocument()
    expect(trigger).not.toHaveTextContent("Child")
  })

  it("toggles the popover dialog", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole("button", { name: /2 Adults/ })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })
    expect(within(dialog).getByText("Adults")).toBeInTheDocument()
    expect(within(dialog).getByText("Ages 13 or above")).toBeInTheDocument()
    expect(within(dialog).getByText("Children")).toBeInTheDocument()
    expect(within(dialog).getByText("Ages 0–12")).toBeInTheDocument()
  })

  it("increments and decrements the adult counter", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 2, children: 1 }} />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    await user.click(
      within(dialog).getByRole("button", { name: "Increase adults" }),
    )
    expect(within(dialog).getByText("3")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /3 Adults, 1 Child/ }),
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "Decrease adults" }),
    )
    expect(within(dialog).getByText("2")).toBeInTheDocument()
  })

  it("never lets the adult counter drop below one", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 1, children: 0 }} />)

    await user.click(screen.getByRole("button", { name: /1 Adult/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    expect(
      within(dialog).getByRole("button", { name: "Decrease adults" }),
    ).toBeDisabled()

    await user.click(
      within(dialog).getByRole("button", { name: "Decrease adults" }),
    )
    expect(within(dialog).getByText("1")).toBeInTheDocument()
  })

  it("never lets the children counter drop below zero", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 2, children: 0 }} />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    expect(
      within(dialog).getByRole("button", { name: "Decrease children" }),
    ).toBeDisabled()

    await user.click(
      within(dialog).getByRole("button", { name: "Decrease children" }),
    )
    expect(within(dialog).getByText("0")).toBeInTheDocument()
  })

  it("caps the total against the default maximum of 10 guests", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 9, children: 1 }} />)

    await user.click(screen.getByRole("button", { name: /9 Adults, 1 Child/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    expect(
      within(dialog).getByRole("button", { name: "Increase adults" }),
    ).toBeDisabled()
    expect(
      within(dialog).getByRole("button", { name: "Increase children" }),
    ).toBeDisabled()

    await user.click(
      within(dialog).getByRole("button", { name: "Increase adults" }),
    )
    expect(within(dialog).getByText("9")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /9 Adults, 1 Child/ }),
    ).toBeInTheDocument()
  })

  it("respects a custom maxGuests ceiling for both counters", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 2, children: 0 }} maxGuests={3} />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    await user.click(
      within(dialog).getByRole("button", { name: "Increase children" }),
    )
    expect(within(dialog).getByText("1")).toBeInTheDocument()

    // total is now 3 === maxGuests, so both steppers lock
    expect(
      within(dialog).getByRole("button", { name: "Increase adults" }),
    ).toBeDisabled()
    expect(
      within(dialog).getByRole("button", { name: "Increase children" }),
    ).toBeDisabled()
  })

  it("keeps children bounded by maxGuests minus adults", async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ adults: 3, children: 0 }} maxGuests={4} />)

    await user.click(screen.getByRole("button", { name: /3 Adults/ }))
    const dialog = screen.getByRole("dialog", {
      name: "Select number of guests",
    })

    await user.click(
      within(dialog).getByRole("button", { name: "Increase children" }),
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Increase children" }),
    )

    expect(within(dialog).getByText("1")).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Increase children" }),
    ).toBeDisabled()
    expect(
      screen.getByRole("button", { name: /3 Adults, 1 Child/ }),
    ).toBeInTheDocument()
  })

  it("closes the popover from the Done button", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /2 Adults/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("closes the popover when clicking outside", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">outside</button>
        <Harness />
      </div>,
    )

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "outside" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("keeps the popover open when clicking inside the container", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    fireEvent.mouseDown(screen.getByRole("dialog"))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
