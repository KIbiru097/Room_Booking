import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TransportationPage from "@/app/transportation/page"
import { transportationApi } from "@/lib/services"
import type { useToastStore } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/transportation",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  transportationApi: {
    services: jest.fn(),
    myBookings: jest.fn(),
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
  },
}))

jest.mock("@/app/transportation/TransportRouteMap", () => ({
  __esModule: true,
  default: ({
    onSelectRoute,
  }: {
    onSelectRoute?: (a: string, b: string) => void
  }) => (
    <div data-testid="transport-route-map">
      <button
        type="button"
        onClick={() => onSelectRoute?.("Bole Airport", "Sheraton Addis")}
      >
        select-route
      </button>
    </div>
  ),
}))

const mockedTransport =
  transportationApi as jest.Mocked<typeof transportationApi>

function makeService(overrides: Record<string, unknown> = {}) {
  return {
    id: "svc-1",
    name: "Bole Airport Taxi",
    serviceType: "AIRPORT_PICKUP",
    description: "Fixed price transfer with a verified driver",
    fixedPrice: 2500,
    dailyRate: null,
    currency: "ETB",
    passengerLimit: 3,
    luggageLimit: 2,
    durationMinutes: 45,
    depositAmount: null,
    mileagePolicyKm: null,
    advanceBookingMinutes: 120,
    provider: {
      id: "prov-1",
      businessName: "YayeTech Rides",
      phone: "+251 900 000 000",
      email: "rides@yayetech.example",
      verificationStatus: "VERIFIED",
      city: { id: "c1", name: "Addis Ababa" },
    },
    ...overrides,
  }
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "tb-1",
    bookingRef: "TR-1001",
    pickupAt: "2026-12-01T08:00:00.000Z",
    pickupLocation: "Bole International Airport",
    dropoffLocation: "Sheraton Addis",
    passengers: 2,
    priceAmount: 2500,
    currency: "ETB",
    status: "REQUESTED",
    paymentStatus: "PENDING",
    rentalStartDate: null,
    rentalEndDate: null,
    service: {
      name: "Bole Airport Taxi",
      serviceType: "AIRPORT_PICKUP",
      currency: "ETB",
    },
    provider: { businessName: "YayeTech Rides", phone: "+251 900 000 000" },
    vehicle: null,
    driver: { name: "Abebe Kebede", phone: "+251 911 111 111" },
    ...overrides,
  }
}

const guestState = {
  user: null,
  tokens: null,
  loading: false,
  isInitialized: true,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  isCustomer: false,
}

const signedInState = {
  ...guestState,
  user: {
    id: "u1",
    email: "guest@example.com",
    fullName: "Betelhem Tadesse",
    role: "CUSTOMER" as const,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  isCustomer: true,
}

async function loadToasts() {
  const mod = await import("@/components/ui/Toast")
  return (mod.useToastStore as typeof useToastStore).getState().toasts
}

describe("transportation page", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({ ...guestState })
    mockedTransport.services.mockReset()
    mockedTransport.myBookings.mockReset()
    mockedTransport.createBooking.mockReset()
    mockedTransport.cancelBooking.mockReset()
    mockedTransport.services.mockResolvedValue({
      total: 1,
      page: 1,
      limit: 50,
      items: [makeService()],
    })
    mockedTransport.myBookings.mockResolvedValue([])
    mockedTransport.cancelBooking.mockResolvedValue({})
    mockedTransport.createBooking.mockResolvedValue({ bookingRef: "TR-2002" })
    import("@/components/ui/Toast").then(({ useToastStore }) => {
      useToastStore.setState({ toasts: [] })
    })
  })

  it("greets guests with the hero, trust signals and the sign-in notice", async () => {
    render(<TransportationPage />)

    expect(
      screen.getByRole("heading", { name: "Airport taxi & car rental" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Move with confidence")).toBeInTheDocument()
    expect(screen.getByText("Verified providers")).toBeInTheDocument()
    expect(screen.getByText("Scheduled pickup")).toBeInTheDocument()
    expect(screen.getByText("Fixed ETB prices")).toBeInTheDocument()

    const notice = screen.getByText(
      /You can browse services, but you must sign in to book./,
    )
    expect(notice).toBeInTheDocument()
    expect(
      within(notice.parentElement as HTMLElement).getByRole("link", {
        name: "Sign in",
      }),
    ).toHaveAttribute("href", "/auth?initialMode=login")
    expect(
      await screen.findByRole("heading", { name: "Bole Airport Taxi" }),
    ).toBeInTheDocument()
    expect(mockedTransport.myBookings).not.toHaveBeenCalled()
  })

  it("shows the service skeleton grid while the catalogue loads", () => {
    mockedTransport.services.mockReturnValue(new Promise(() => undefined))

    const { container } = render(<TransportationPage />)

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6)
    expect(
      screen.queryByRole("heading", { name: "Bole Airport Taxi" }),
    ).not.toBeInTheDocument()
  })

  it("keeps rentals out of the airport tab and shows the fixed price", async () => {
    mockedTransport.services.mockResolvedValue({
      total: 2,
      page: 1,
      limit: 50,
      items: [
        makeService(),
        makeService({
          id: "svc-2",
          name: "Toyota RAV4 Rental",
          serviceType: "CAR_RENTAL",
          fixedPrice: 3500,
          dailyRate: 3500,
        }),
      ],
    })

    render(<TransportationPage />)

    expect(
      await screen.findByRole("heading", { name: "Bole Airport Taxi" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Toyota RAV4 Rental" }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText("Airport → Hotel")).toHaveLength(2)
    expect(screen.getByText("YayeTech Rides · Addis Ababa")).toBeInTheDocument()
    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByText("Fixed price")).toBeInTheDocument()
    expect(screen.getByText("2,500 ETB")).toBeInTheDocument()
    expect(screen.getByText("Up to 3 pax")).toBeInTheDocument()
    expect(screen.getByText("2 bags")).toBeInTheDocument()
    expect(screen.getByText("~45 min")).toBeInTheDocument()
  })

  it("shows the empty catalogue message when nothing matches the tab", async () => {
    mockedTransport.services.mockResolvedValue({
      total: 1,
      page: 1,
      limit: 50,
      items: [
        makeService({
          id: "svc-3",
          name: "RAV4",
          serviceType: "CAR_RENTAL",
          dailyRate: 100,
        }),
      ],
    })

    render(<TransportationPage />)

    expect(
      await screen.findByText(
        "No verified Airport transfers services are available yet.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Try adjusting your filters or check back soon."),
    ).toBeInTheDocument()
  })

  it("reports a failed catalogue load and retries on demand", async () => {
    const user = userEvent.setup()
    mockedTransport.services.mockRejectedValue(new Error("service unavailable"))

    render(<TransportationPage />)

    expect(await screen.findByText("service unavailable")).toBeInTheDocument()
    mockedTransport.services.mockResolvedValue({
      total: 0,
      page: 1,
      limit: 50,
      items: [],
    })
    await user.click(screen.getByRole("button", { name: "Retry" }))

    await waitFor(() =>
      expect(mockedTransport.services).toHaveBeenCalledTimes(2),
    )
    expect(screen.queryByText("service unavailable")).not.toBeInTheDocument()
  })

  it("narrows the airport list with the transfer type selector", async () => {
    const user = userEvent.setup()
    mockedTransport.services.mockResolvedValue({
      total: 2,
      page: 1,
      limit: 50,
      items: [
        makeService(),
        makeService({
          id: "svc-4",
          name: "Hotel Shuttle",
          serviceType: "HOTEL_TRANSFER",
          fixedPrice: 1800,
        }),
      ],
    })

    render(<TransportationPage />)

    expect(
      await screen.findByRole("heading", { name: "Bole Airport Taxi" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Hotel Shuttle" }),
    ).toBeInTheDocument()
    const callsAfterLoad = mockedTransport.services.mock.calls.length

    const [transferTypeSelect] = screen.getAllByRole("combobox")
    await user.selectOptions(transferTypeSelect, "HOTEL_TRANSFER")

    expect(
      screen.queryByRole("heading", { name: "Bole Airport Taxi" }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Hotel Shuttle" }),
    ).toBeInTheDocument()
    expect(mockedTransport.services).toHaveBeenCalledTimes(callsAfterLoad)
  })

  it("re-queries the catalogue when the passenger filter changes", async () => {
    const user = userEvent.setup()
    render(<TransportationPage />)

    await screen.findByRole("heading", { name: "Bole Airport Taxi" })

    await user.type(screen.getByPlaceholderText("Any"), "4")

    await waitFor(() =>
      expect(mockedTransport.services).toHaveBeenLastCalledWith({
        serviceType: undefined,
        passengers: 4,
        maxPrice: undefined,
        limit: 50,
      }),
    )
  })

  it("switches to rentals with a day-count price preview", async () => {
    const user = userEvent.setup()
    mockedTransport.services.mockResolvedValue({
      total: 1,
      page: 1,
      limit: 50,
      items: [
        makeService({
          id: "svc-5",
          name: "Toyota RAV4 Rental",
          serviceType: "CAR_RENTAL",
          fixedPrice: 3500,
          dailyRate: 3500,
          depositAmount: 5000,
          mileagePolicyKm: 200,
        }),
      ],
    })

    render(<TransportationPage />)

    await user.click(screen.getByRole("button", { name: "Car rentals" }))

    expect(
      await screen.findByRole("heading", { name: "Toyota RAV4 Rental" }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(mockedTransport.services).toHaveBeenLastCalledWith(
        expect.objectContaining({ serviceType: "CAR_RENTAL" }),
      ),
    )
    expect(screen.getByText("Per day")).toBeInTheDocument()
    expect(screen.getByText(/3,500 ETB/)).toBeInTheDocument()
    expect(screen.getByText("Deposit: 5,000 ETB")).toBeInTheDocument()
    expect(screen.getByText("200 km/day")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Rental start"), {
      target: { value: "2026-12-01" },
    })
    fireEvent.change(screen.getByLabelText("Rental end"), {
      target: { value: "2026-12-05" },
    })

    const days = Math.ceil(
      (new Date("2026-12-05T23:59:00").getTime() -
        new Date("2026-12-01").getTime()) /
        (24 * 60 * 60 * 1000),
    )
    expect(
      await screen.findByText(
        `Total for ${days} day(s) — prices shown on cards below.`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(`${days} day(s)`)).toBeInTheDocument()
    expect(
      screen.getByText(`${(3500 * days).toLocaleString()} ETB`),
    ).toBeInTheDocument()
  })

  it("renders the interactive route map tab", async () => {
    const user = userEvent.setup()
    render(<TransportationPage />)

    await user.click(screen.getByRole("button", { name: "Route & Hubs Map" }))

    expect(await screen.findByTestId("transport-route-map")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Bole Airport Taxi" }),
    ).not.toBeInTheDocument()
  })

  it("blocks a guest from submitting a booking request", async () => {
    const user = userEvent.setup()
    render(<TransportationPage />)

    await user.click(await screen.findByRole("button", { name: "Book" }))

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Book airport taxi")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Pickup location")).toHaveValue(
      "Bole International Airport",
    )

    await user.type(
      within(dialog).getByLabelText("Drop-off location"),
      "Sheraton Addis",
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Submit request" }),
    )

    expect(mockedTransport.createBooking).not.toHaveBeenCalled()
    const toasts = (await loadToasts()).map((entry) => entry.title)
    expect(toasts).toContain("Sign in required")
  })

  it("submits a complete transfer request for a signed-in traveller", async () => {
    const user = userEvent.setup()
    useAuth.setState({ ...signedInState })

    render(<TransportationPage />)

    await user.click(await screen.findByRole("button", { name: "Book" }))
    const dialog = screen.getByRole("dialog")

    await user.type(
      within(dialog).getByLabelText("Drop-off location"),
      "Sheraton Addis",
    )
    await user.type(within(dialog).getByLabelText(/Flight number/), "ET352")
    await user.type(within(dialog).getByLabelText(/^Notes/), "Meet at arrivals")
    await user.click(
      within(dialog).getByRole("button", { name: "Submit request" }),
    )

    await waitFor(() =>
      expect(mockedTransport.createBooking).toHaveBeenCalledTimes(1),
    )
    expect(mockedTransport.createBooking).toHaveBeenCalledWith({
      serviceId: "svc-1",
      pickupAt: expect.any(String),
      pickupLocation: "Bole International Airport",
      dropoffLocation: "Sheraton Addis",
      passengers: 1,
      luggageCount: 0,
      customerNotes: "Flight: ET352 | Meet at arrivals",
    })

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    const toasts = (await loadToasts()).map((entry) => entry.title)
    expect(toasts).toContain("Booking submitted!")
    await waitFor(() =>
      expect(mockedTransport.services).toHaveBeenCalledTimes(2),
    )
  })

  it("rejects a blank drop-off location before calling the API", async () => {
    const user = userEvent.setup()
    useAuth.setState({ ...signedInState })

    render(<TransportationPage />)

    await user.click(await screen.findByRole("button", { name: "Book" }))
    const dialog = screen.getByRole("dialog")

    await user.type(within(dialog).getByLabelText("Drop-off location"), "   ")
    await user.click(
      within(dialog).getByRole("button", { name: "Submit request" }),
    )

    expect(mockedTransport.createBooking).not.toHaveBeenCalled()
    const toasts = (await loadToasts()).map((entry) => entry.title)
    expect(toasts).toContain("Locations required")
  })

  it("keeps the modal open when the provider rejects the request", async () => {
    const user = userEvent.setup()
    useAuth.setState({ ...signedInState })
    mockedTransport.createBooking.mockRejectedValue(
      new Error("provider unavailable"),
    )

    render(<TransportationPage />)

    await user.click(await screen.findByRole("button", { name: "Book" }))
    const dialog = screen.getByRole("dialog")

    await user.type(
      within(dialog).getByLabelText("Drop-off location"),
      "Sheraton Addis",
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Submit request" }),
    )

    await waitFor(() =>
      expect(mockedTransport.createBooking).toHaveBeenCalledTimes(1),
    )
    const toasts = (await loadToasts()).map((entry) => entry.title)
    expect(toasts).toContain("Booking failed")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("lists the traveller requests and cancels a pending one", async () => {
    const user = userEvent.setup()
    useAuth.setState({ ...signedInState })
    mockedTransport.myBookings.mockResolvedValue([makeBooking()] as never)

    render(<TransportationPage />)

    const heading = await screen.findByRole("heading", {
      name: "Your transport requests",
    })
    const panel = heading.closest("section") as HTMLElement
    expect(within(panel).getByText("TR-1001")).toBeInTheDocument()
    expect(within(panel).getByText("REQUESTED")).toBeInTheDocument()
    expect(within(panel).getByText("2,500 ETB")).toBeInTheDocument()
    expect(
      within(panel).getByText("Driver: Abebe Kebede · +251 911 111 111"),
    ).toBeInTheDocument()
    expect(mockedTransport.myBookings).toHaveBeenCalledTimes(1)

    await user.click(within(panel).getByRole("button", { name: "Cancel" }))

    await waitFor(() =>
      expect(mockedTransport.cancelBooking).toHaveBeenCalledWith("tb-1"),
    )
    const toasts = (await loadToasts()).map((entry) => entry.title)
    expect(toasts).toContain("Booking cancelled")
    await waitFor(() =>
      expect(mockedTransport.myBookings).toHaveBeenCalledTimes(2),
    )
  })

  it("hides the cancel action for a completed request", async () => {
    useAuth.setState({ ...signedInState })
    mockedTransport.myBookings.mockResolvedValue([
      makeBooking({ status: "COMPLETED" }),
    ] as never)

    render(<TransportationPage />)

    expect(await screen.findByText("TR-1001")).toBeInTheDocument()
    expect(screen.getByText("COMPLETED")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument()
  })
})
