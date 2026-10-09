import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import EmergencyPage from "@/app/emergency/page"
import { discoverApi } from "@/lib/services"
import type { EmergencyContactItem } from "@/lib/services"
import { bookingService } from "@/services/booking.service"
import { useAuth } from "@/lib/auth-store"
import { writeCachedValue } from "@/lib/offline-cache"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/emergency",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  discoverApi: { emergency: jest.fn() },
}))

jest.mock("@/services/booking.service", () => ({
  bookingService: { getMyBookings: jest.fn() },
}))

const mockedDiscover = discoverApi as jest.Mocked<typeof discoverApi>
const mockedBookings = bookingService as jest.Mocked<typeof bookingService>

function makeContact(
  overrides: Partial<EmergencyContactItem> = {},
): EmergencyContactItem {
  return {
    id: "ec-1",
    kind: "HOSPITAL",
    name: "Nordic Medical Center",
    phone: "+251 929 105 653",
    city: "Addis Ababa",
    source: { id: "s1", name: "Ministry of Health" },
    lastVerifiedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <EmergencyPage />
    </QueryClientProvider>,
  )
}

describe("emergency page", () => {
  const printMock = jest.fn()
  const writeText = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, "print", {
      configurable: true,
      value: printMock,
    })
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    printMock.mockClear()
    writeText.mockClear()
    useAuth.setState({
      user: {
        id: "u1",
        email: "guest@example.com",
        fullName: "Betelhem Tadesse",
        role: "CUSTOMER",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      isInitialized: true,
      isCustomer: true,
    })
    mockedDiscover.emergency.mockReset()
    mockedBookings.getMyBookings.mockReset()
    mockedBookings.getMyBookings.mockResolvedValue({ data: [] })
  })

  it("opens with the verified directory header, safety notice and print action", () => {
    mockedDiscover.emergency.mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(
      screen.getByRole("heading", { name: "Emergency & Health Directory" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Verified Safety Directory")).toBeInTheDocument()
    expect(screen.getByText(/Official Sources Only/)).toBeInTheDocument()
    expect(
      screen.getByText(/Always dial emergency services directly/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Verified by Ministry of Tourism & City Administration · YayeTech Safety",
      ),
    ).toBeInTheDocument()

    const printButton = screen.getByRole("button", {
      name: /Print Pocket Taxi Card/,
    })
    printButton.click()
    expect(printMock).toHaveBeenCalledTimes(1)
  })

  it("exposes the four national hotlines as one-tap dial links", () => {
    mockedDiscover.emergency.mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(
      screen.getByRole("heading", {
        name: "National Emergency Hotlines (Toll-Free)",
      }),
    ).toBeInTheDocument()

    const hotlines = screen.getAllByRole("link", { name: /Call Now/ })
    expect(hotlines).toHaveLength(4)
    expect(hotlines[0]).toHaveAttribute("href", "tel:991")
    expect(hotlines[0]).toHaveTextContent("Police Emergency")
    expect(hotlines[1]).toHaveAttribute("href", "tel:907")
    expect(hotlines[2]).toHaveAttribute("href", "tel:939")
    expect(hotlines[3]).toHaveAttribute("href", "tel:945")
    expect(
      hotlines.map((node) => node.textContent?.match(/\d{3}/)?.[0]),
    ).toEqual(["991", "907", "939", "945"])
  })

  it("prints the active booking on the pocket card", async () => {
    mockedDiscover.emergency.mockReturnValue(new Promise(() => undefined))
    mockedBookings.getMyBookings.mockResolvedValue({
      data: [
        {
          id: "bk-99887766",
          userId: "u1",
          hotelId: "h1",
          hotel: { id: "h1", name: "Sheraton Addis", address: "Meskel Square" },
          checkIn: "2026-12-01",
          checkOut: "2026-12-05",
          status: "CONFIRMED",
          totalPrice: 4000,
          createdAt: "2026-11-01T00:00:00.000Z",
        },
      ],
    })

    renderPage()

    expect(await screen.findByText("Sheraton Addis")).toBeInTheDocument()
    expect(screen.getByText("ሆቴል Sheraton Addis")).toBeInTheDocument()
    expect(screen.getAllByText("Meskel Square")).toHaveLength(2)
    expect(screen.getByText("Betelhem Tadesse")).toBeInTheDocument()
    expect(screen.getByText("BK-99887")).toBeInTheDocument()

    const mapLink = screen.getByRole("link", { name: "Open hotel location" })
    expect(mapLink.getAttribute("href")).toContain(
      encodeURIComponent("Sheraton Addis, Meskel Square"),
    )
  })

  it("falls back to the placeholder hotel when the traveller has no booking", async () => {
    mockedDiscover.emergency.mockReturnValue(new Promise(() => undefined))
    mockedBookings.getMyBookings.mockResolvedValue({ data: [] })

    renderPage()

    expect(
      await screen.findByText("LuxStay Addis Ababa Partner Hotel"),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Ref:/)).not.toBeInTheDocument()
    const mapHref = screen
      .getByRole("link", { name: "Open hotel location" })
      .getAttribute("href")
    expect(decodeURIComponent(mapHref ?? "")).toContain(
      "LuxStay Addis Ababa Partner Hotel",
    )
  })

  it("shows skeletons while the directory loads, then the contacts", async () => {
    let resolveEmergency: (value: {
      total: number
      data: EmergencyContactItem[]
    }) => void = () => undefined
    mockedDiscover.emergency.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEmergency = resolve
        }) as never,
    )

    const { container } = renderPage()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2)
    expect(screen.queryByText("No contacts found")).not.toBeInTheDocument()

    resolveEmergency({ total: 1, data: [makeContact()] })

    const card = await screen.findByRole("article")
    expect(card).toHaveTextContent("Nordic Medical Center")
    expect(card).toHaveTextContent("+251 929 105 653")
    expect(card).toHaveTextContent("HOSPITAL")
    expect(card).toHaveTextContent("Source: Ministry of Health")
    expect(
      within(card).getByRole("link", { name: /\+251 929 105 653/ }),
    ).toHaveAttribute("href", "tel:+251 929 105 653")
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0)
    expect(mockedDiscover.emergency).toHaveBeenCalledWith({
      city: "Addis Ababa",
    })
  })

  it("narrows the directory with the search box", async () => {
    const user = userEvent.setup()
    mockedDiscover.emergency.mockResolvedValue({
      total: 3,
      data: [
        makeContact(),
        makeContact({
          id: "ec-2",
          kind: "EMBASSY",
          name: "United States Embassy",
          phone: "+251 11 130 6000",
          source: { id: "s2", name: "US State Department" },
        }),
        makeContact({
          id: "ec-3",
          kind: "POLICE",
          name: "Federal Police Central",
          phone: "991",
          city: "Addis Ababa",
          source: null,
        }),
      ],
    })

    renderPage()

    expect(await screen.findByText("United States Embassy")).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(3)

    const input = screen.getByPlaceholderText(
      "Search embassy, hospital, clinic…",
    )
    await user.type(input, "embassy")
    expect(screen.getAllByRole("article")).toHaveLength(1)
    expect(screen.getByText("United States Embassy")).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "zzzz")
    expect(screen.getByText("No contacts found")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Try adjusting your search query or switching categories.",
      ),
    ).toBeInTheDocument()
  })

  it("filters the directory by category tab", async () => {
    const user = userEvent.setup()
    mockedDiscover.emergency.mockResolvedValue({
      total: 3,
      data: [
        makeContact(),
        makeContact({
          id: "ec-2",
          kind: "EMBASSY",
          name: "United States Embassy",
        }),
        makeContact({
          id: "ec-3",
          kind: "POLICE",
          name: "Federal Police Central",
          phone: "991",
        }),
      ],
    })

    renderPage()

    expect(await screen.findByText("United States Embassy")).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(3)

    await user.click(
      screen.getByRole("button", { name: /Hospitals & 24\/7 Clinics/ }),
    )
    expect(screen.getAllByRole("article")).toHaveLength(1)
    expect(screen.getByText("Nordic Medical Center")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Embassies & Consulates/ }),
    )
    expect(screen.getAllByRole("article")).toHaveLength(1)
    expect(screen.getByText("United States Embassy")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Police & Security/ }))
    const policeCards = screen.getAllByRole("article")
    expect(policeCards).toHaveLength(1)
    expect(policeCards[0]).toHaveTextContent("Federal Police Central")

    await user.click(screen.getByRole("button", { name: /Hotel & Front Desk/ }))
    expect(screen.getByText("No contacts found")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /All Contacts/ }))
    expect(screen.getAllByRole("article")).toHaveLength(3)
  })

  it("copies a phone number and marks the card as copied", async () => {
    const user = userEvent.setup()
    mockedDiscover.emergency.mockResolvedValue({
      total: 1,
      data: [makeContact()],
    })

    renderPage()

    const card = await screen.findByRole("article")
    const copyButton = within(card).getByRole("button", {
      name: "Copy phone number",
    })

    await user.click(copyButton)

    await expect(window.navigator.clipboard.readText()).resolves.toBe(
      "+251 929 105 653",
    )
  })

  it("serves the cached directory and flags staleness when the network fails", async () => {
    const user = userEvent.setup()
    writeCachedValue("emergency:addis-ababa", [makeContact()])
    mockedDiscover.emergency.mockRejectedValueOnce(new Error("offline"))

    renderPage()

    expect(
      await screen.findByText(/Showing saved safety contacts from just now/),
    ).toBeInTheDocument()
    expect(screen.getByRole("article")).toHaveTextContent(
      "Nordic Medical Center",
    )
    expect(screen.queryByText("No contacts found")).not.toBeInTheDocument()
    expect(mockedDiscover.emergency).toHaveBeenCalledTimes(1)

    mockedDiscover.emergency.mockResolvedValueOnce({
      total: 1,
      data: [makeContact()],
    })
    await user.click(screen.getByRole("button", { name: "Refresh" }))

    await waitFor(() =>
      expect(mockedDiscover.emergency).toHaveBeenCalledTimes(2),
    )
    expect(
      screen.queryByText(/Showing saved safety contacts/),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("article")).toHaveTextContent(
      "Nordic Medical Center",
    )
  })

  it("empties the directory when the fetch fails with no offline copy", async () => {
    localStorage.clear()
    mockedDiscover.emergency.mockRejectedValue(new Error("offline"))

    renderPage()

    expect(await screen.findByText("No contacts found")).toBeInTheDocument()
  })
})
