import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HeroSearchBar from "@/app/HeroSearchBar"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useParams: () => ({ id: "1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

function today() {
  return new Date().toISOString().slice(0, 10)
}

describe("HeroSearchBar", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ""
    mockPush.mockClear()
  })

  it("renders the four labelled search fields", () => {
    render(<HeroSearchBar />)

    expect(screen.getByLabelText("Destination / City")).toBeInTheDocument()
    expect(screen.getByLabelText("Check-in Date")).toBeInTheDocument()
    expect(screen.getByLabelText("Check-out Date")).toBeInTheDocument()
    expect(screen.getByText("Guests")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("e.g. Addis Ababa, Paris, Dubai"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Find Luxury Stays" }),
    ).toBeInTheDocument()
  })

  it("pushes the default two-guest search when the form is empty", async () => {
    const user = userEvent.setup()
    render(<HeroSearchBar />)

    await user.click(screen.getByRole("button", { name: "Find Luxury Stays" }))

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/search?guests=2")
  })

  it("serialises destination and dates into the search query", async () => {
    const user = userEvent.setup()
    render(<HeroSearchBar />)

    await user.type(screen.getByLabelText("Destination / City"), "Addis Ababa")
    fireEvent.change(screen.getByLabelText("Check-in Date"), {
      target: { value: "2026-11-01" },
    })
    fireEvent.change(screen.getByLabelText("Check-out Date"), {
      target: { value: "2026-11-05" },
    })

    await user.click(screen.getByRole("button", { name: "Find Luxury Stays" }))

    expect(mockPush).toHaveBeenCalledWith(
      "/search?city=Addis+Ababa&checkIn=2026-11-01&checkOut=2026-11-05&guests=2",
    )
  })

  it("trims surrounding whitespace from the destination", async () => {
    const user = userEvent.setup()
    render(<HeroSearchBar />)

    await user.type(screen.getByLabelText("Destination / City"), "  Gondar  ")
    await user.click(screen.getByRole("button", { name: "Find Luxury Stays" }))

    expect(mockPush).toHaveBeenCalledWith("/search?city=Gondar&guests=2")
  })

  it("counts guests chosen in the guest selector", async () => {
    const user = userEvent.setup()
    render(<HeroSearchBar />)

    await user.click(screen.getByRole("button", { name: /2 Adults/ }))
    await user.click(screen.getByRole("button", { name: "Increase adults" }))
    await user.click(screen.getByRole("button", { name: "Increase children" }))
    expect(screen.getByRole("button", { name: /3 Adults/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /1 Child/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Find Luxury Stays" }))

    expect(mockPush).toHaveBeenCalledWith("/search?guests=4")
  })

  it("clears an invalid check-out date when check-in moves past it", () => {
    render(<HeroSearchBar />)
    const checkIn = screen.getByLabelText("Check-in Date")
    const checkOut = screen.getByLabelText("Check-out Date")

    fireEvent.change(checkOut, { target: { value: "2026-11-05" } })
    expect(checkOut).toHaveValue("2026-11-05")

    fireEvent.change(checkIn, { target: { value: "2026-11-08" } })

    expect(checkOut).toHaveValue("")
  })

  it("keeps a check-out date that is still after check-in", () => {
    render(<HeroSearchBar />)
    const checkIn = screen.getByLabelText("Check-in Date")
    const checkOut = screen.getByLabelText("Check-out Date")

    fireEvent.change(checkOut, { target: { value: "2026-11-20" } })
    fireEvent.change(checkIn, { target: { value: "2026-11-08" } })

    expect(checkOut).toHaveValue("2026-11-20")
  })

  it("bounds the date fields to today and the chosen check-in", () => {
    render(<HeroSearchBar />)

    expect(screen.getByLabelText("Check-in Date")).toHaveAttribute(
      "min",
      today(),
    )
    expect(screen.getByLabelText("Check-out Date")).toHaveAttribute(
      "min",
      today(),
    )
  })
})
