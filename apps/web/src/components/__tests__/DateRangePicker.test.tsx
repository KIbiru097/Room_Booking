import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DateRangePicker from "@/components/DateRangePicker"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const NOW = new Date()
const NEXT_MONTH = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1)

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`
}

function headerLabel(container: HTMLElement): string {
  const span = Array.from(container.querySelectorAll("span")).find((s) =>
    /^[A-Za-z]+ \d{4}$/.test(s.textContent?.trim() ?? ""),
  )
  return span?.textContent?.trim() ?? ""
}

function chevron(
  container: HTMLElement,
  side: "left" | "right",
): HTMLButtonElement {
  const svg = container.querySelector(`.lucide-chevron-${side}`)
  expect(svg).not.toBeNull()
  return (svg as Element).closest("button") as HTMLButtonElement
}

function iso(day: number): string {
  return new Date(NEXT_MONTH.getFullYear(), NEXT_MONTH.getMonth(), day)
    .toISOString()
    .slice(0, 10)
}

function display(day: number): string {
  return new Date(
    NEXT_MONTH.getFullYear(),
    NEXT_MONTH.getMonth(),
    day,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface HarnessProps {
  onSelect: (checkIn: string, checkOut: string) => void
  checkIn?: string
  checkOut?: string
  minDate?: Date
}

// The picker is fully controlled, so a harness replays onSelect back into props
// the way a real parent booking form would.
function Harness({ onSelect, ...props }: HarnessProps) {
  const [range, setRange] = useState<{ checkIn?: string ;checkOut?: string }>({
    checkIn: props.checkIn,
    checkOut: props.checkOut,
  })

  return (
    <DateRangePicker
      checkIn={range.checkIn}
      checkOut={range.checkOut}
      minDate={props.minDate}
      onSelect={(checkIn, checkOut) => {
        setRange({ checkIn, checkOut })
        onSelect(checkIn, checkOut)
      }}
    />
  )
}

describe("DateRangePicker", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders the summary bar, weekday headers, instruction and custom class", () => {
    const { container } = render(
      <DateRangePicker onSelect={jest.fn()} className="custom-picker" />,
    )

    expect(screen.getByText("Check-in")).toBeInTheDocument()
    expect(screen.getByText("Check-out")).toBeInTheDocument()
    expect(screen.getAllByText("Select date")).toHaveLength(2)
    expect(screen.getByText("Select your check-in date")).toBeInTheDocument()
    expect(headerLabel(container)).toBe(
      monthLabel(NOW.getFullYear(), NOW.getMonth()),
    )
    for (const day of ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "custom-picker",
    )
  })

  it("keeps the previous-month chevron disabled on the minimum month", () => {
    const { container } = render(<DateRangePicker onSelect={jest.fn()} />)

    expect(chevron(container, "left")).toBeDisabled()
    expect(chevron(container, "right")).toBeEnabled()
  })

  it("moves to the next month and back again", async () => {
    const user = userEvent.setup()
    const { container } = render(<DateRangePicker onSelect={jest.fn()} />)
    const before = headerLabel(container)

    await user.click(chevron(container, "right"))

    expect(headerLabel(container)).toBe(
      monthLabel(NEXT_MONTH.getFullYear(), NEXT_MONTH.getMonth()),
    )
    expect(headerLabel(container)).not.toBe(before)
    expect(chevron(container, "left")).toBeEnabled()

    await user.click(chevron(container, "left"))

    expect(headerLabel(container)).toBe(before)
    expect(chevron(container, "left")).toBeDisabled()
  })

  it("crosses the year boundary forwards and backwards", async () => {
    const user = userEvent.setup()
    const { container } = render(<DateRangePicker onSelect={jest.fn()} />)

    for (let i = NOW.getMonth(); i < 11; i++) {
      await user.click(chevron(container, "right"))
    }

    expect(headerLabel(container)).toBe(monthLabel(NOW.getFullYear(), 11))

    await user.click(chevron(container, "right"))
    expect(headerLabel(container)).toBe(monthLabel(NOW.getFullYear() + 1, 0))
    expect(chevron(container, "left")).toBeEnabled()

    await user.click(chevron(container, "left"))
    expect(headerLabel(container)).toBe(monthLabel(NOW.getFullYear(), 11))
  })

  it("shows a pre-selected range coming from props", () => {
    render(
      <DateRangePicker
        checkIn="2030-06-10"
        checkOut="2030-06-15"
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByText("Jun 10, 2030")).toBeInTheDocument()
    expect(screen.getByText("Jun 15, 2030")).toBeInTheDocument()
    expect(screen.getByText("Total stay")).toBeInTheDocument()
    expect(screen.getByText("5 nights")).toBeInTheDocument()
    expect(screen.getByText("Select your check-in date")).toBeInTheDocument()
  })

  it("selects a start day, then a later end day", async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    const { container } = render(<Harness onSelect={onSelect} />)

    await user.click(chevron(container, "right"))
    await user.click(screen.getByRole("button", { name: "10" }))

    expect(onSelect).toHaveBeenLastCalledWith(iso(10), "")
    expect(
      screen.getByText("Now select your check-out date"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: `Check-in ${display(10)}` }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Total stay")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "15" }))

    expect(onSelect).toHaveBeenLastCalledWith(iso(10), iso(15))
    expect(screen.getByText("Select your check-in date")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: `Check-out ${display(15)}` }),
    ).toBeInTheDocument()
    expect(screen.getByText("Total stay")).toBeInTheDocument()
    expect(screen.getByText("5 nights")).toBeInTheDocument()

    expect(screen.getByRole("button", { name: "10" }).className).toContain(
      "bg-[#1E3A8A]",
    )
    expect(screen.getByRole("button", { name: "15" }).className).toContain(
      "bg-[#1E3A8A]",
    )
    expect(screen.getByRole("button", { name: "12" }).className).toContain(
      "bg-[#DBEAFE]",
    )
    expect(screen.getByRole("button", { name: "20" }).className).not.toContain(
      "bg-[#DBEAFE]",
    )
  })

  it("reports a one-night stay in the singular", async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    const { container } = render(<Harness onSelect={onSelect} />)

    await user.click(chevron(container, "right"))
    await user.click(screen.getByRole("button", { name: "10" }))
    await user.click(screen.getByRole("button", { name: "11" }))

    expect(onSelect).toHaveBeenLastCalledWith(iso(10), iso(11))
    expect(screen.getByText("1 night")).toBeInTheDocument()
    expect(screen.queryByText("1 nights")).not.toBeInTheDocument()
  })

  it("rejects a reversed range by restarting from the earlier day", async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    const { container } = render(<Harness onSelect={onSelect} />)

    await user.click(chevron(container, "right"))
    await user.click(screen.getByRole("button", { name: "15" }))
    await user.click(screen.getByRole("button", { name: "5" }))

    expect(onSelect).toHaveBeenLastCalledWith(iso(5), "")
    for (const [checkIn, checkOut] of onSelect.mock
      .calls as [string, string][]) {
      if (checkOut) expect(checkIn < checkOut).toBe(true)
    }
    expect(
      screen.getByText("Now select your check-out date"),
    ).toBeInTheDocument()
  })

  it("disables days before minDate and ignores clicks on them", () => {
    const onSelect = jest.fn()
    render(
      <Harness
        onSelect={onSelect}
        minDate={new Date(NOW.getFullYear(), NOW.getMonth(), 15)}
      />,
    )

    const blocked = screen.getByRole("button", { name: "5" })
    expect(blocked).toBeDisabled()
    expect(screen.getByRole("button", { name: "15" })).toBeEnabled()

    fireEvent.click(blocked)

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("switches the active selection target from the summary bar", async () => {
    const user = userEvent.setup()
    render(<Harness onSelect={jest.fn()} />)

    const checkOutSlot = screen.getByRole("button", { name: /Check-out/ })
    await user.click(checkOutSlot)

    expect(
      screen.getByText("Now select your check-out date"),
    ).toBeInTheDocument()
    expect(checkOutSlot.className).toContain("bg-[#EFF6FF]")

    const checkInSlot = screen.getByRole("button", { name: /Check-in/ })
    await user.click(checkInSlot)

    expect(screen.getByText("Select your check-in date")).toBeInTheDocument()
    expect(checkInSlot.className).toContain("bg-[#EFF6FF]")
    expect(checkOutSlot.className).not.toContain("bg-[#EFF6FF]")
  })

  it("previews the in-between days while hovering during check-out selection", async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness onSelect={jest.fn()} />)

    await user.click(chevron(container, "right"))
    await user.click(screen.getByRole("button", { name: "10" }))

    const middle = screen.getByRole("button", { name: "15" })
    const hoverTarget = screen.getByRole("button", { name: "20" })
    expect(middle.className).not.toContain("bg-[#DBEAFE]")

    await user.hover(hoverTarget)
    expect(middle.className).toContain("bg-[#DBEAFE]")

    await user.unhover(hoverTarget)
    expect(middle.className).not.toContain("bg-[#DBEAFE]")
  })

  it("highlights today's date", () => {
    render(<DateRangePicker onSelect={jest.fn()} />)

    expect(
      screen.getByRole("button", { name: String(NOW.getDate()) }).className,
    ).toContain("border-[#1E3A8A]")

    const otherDay = NOW.getDate() === 1 ? 2 : 1
    expect(
      screen.getByRole("button", { name: String(otherDay) }).className,
    ).not.toContain("border-[#1E3A8A]")
  })

  it("activates a day with the keyboard", async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    const { container } = render(<Harness onSelect={onSelect} />)

    await user.click(chevron(container, "right"))

    const day = screen.getByRole("button", { name: "10" })
    day.focus()
    expect(day).toHaveFocus()

    await user.keyboard("{Enter}")

    expect(onSelect).toHaveBeenLastCalledWith(iso(10), "")
    expect(
      screen.getByText("Now select your check-out date"),
    ).toBeInTheDocument()
  })
})
