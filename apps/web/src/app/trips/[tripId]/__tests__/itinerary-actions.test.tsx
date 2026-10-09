import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TripDetailPage from "@/app/trips/[tripId]/page"
import { tripApi } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import type { Trip, TripItem } from "@/lib/services"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/trips/trip-1",
  useParams: () => ({ tripId: "trip-1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

jest.mock("@/lib/services", () => ({
  tripApi: {
    get: jest.fn(),
    list: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    buildDay: jest.fn(),
  },
}))

const mockGet = tripApi.get as jest.Mock
const mockAddItem = tripApi.addItem as jest.Mock
const mockUpdateItem = tripApi.updateItem as jest.Mock
const mockRemoveItem = tripApi.removeItem as jest.Mock
const mockBuildDay = tripApi.buildDay as jest.Mock

const COFFEE: TripItem = {
  id: "i1",
  tripId: "trip-1",
  dayDate: "2026-02-01",
  startTime: "09:00",
  durationMin: 120,
  itemType: "CUSTOM",
  title: "Coffee ceremony at Tomoca",
  costAmount: 500,
  currency: "ETB",
  status: "PLANNED",
  createdBy: "USER",
}

const MUSEUM: TripItem = {
  id: "i2",
  tripId: "trip-1",
  dayDate: "2026-02-02",
  startTime: "14:00",
  itemType: "CUSTOM",
  title: "Visit National Museum",
  costAmount: 1000,
  currency: "ETB",
  status: "DONE",
  createdBy: "USER",
}

const TRIP: Trip = {
  id: "trip-1",
  title: "Addis Weekend",
  startDate: "2026-02-01T00:00:00.000Z",
  endDate: "2026-02-03T00:00:00.000Z",
  timezone: "Africa/Addis_Ababa",
  items: [COFFEE, MUSEUM],
}

async function renderReadyTrip() {
  render(<TripDetailPage />)
  await screen.findByRole("heading", { name: "Addis Weekend" })
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  useAuth.setState({
    user: {
      id: "u1",
      email: "guest@example.com",
      fullName: "Guest One",
      role: "CUSTOMER",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    tokens: { accessToken: "a", refreshToken: "r" },
    loading: false,
    isInitialized: true,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: true,
  })
  mockGet.mockResolvedValue(TRIP)
  mockAddItem.mockResolvedValue({
    item: {
      id: "i4",
      tripId: "trip-1",
      dayDate: "2026-02-01",
      startTime: "09:30",
      durationMin: 120,
      itemType: "PLACE",
      title: "Ethiopian National Museum",
      costAmount: 300,
      currency: "ETB",
      status: "PLANNED",
      createdBy: "AI",
    } as TripItem,
    hasConflict: false,
    conflictWith: [],
  })
  mockUpdateItem.mockResolvedValue({
    item: { ...COFFEE, status: "DONE" },
    hasConflict: false,
    conflictWith: [],
  })
  mockRemoveItem.mockResolvedValue({ deleted: true })
  mockBuildDay.mockResolvedValue({
    tripId: "trip-1",
    dayDate: "2026-02-01",
    duration: "HALF_DAY",
    scope: "city_interests",
    cityId: "addis",
    cityName: "Addis Ababa",
    interestsApplied: ["HERITAGE"],
    proposal: [
      {
        placeId: "ph1",
        title: "Ethiopian National Museum",
        dayDate: "2026-02-01",
        startTime: "09:30",
        durationMin: 120,
        category: "HERITAGE",
        notes: null,
        estimatedCostEtb: 300,
        place: {
          id: "ph1",
          name: "Ethiopian National Museum",
          category: "HERITAGE",
          address: "Arat Kilo, Addis Ababa",
        },
      },
    ],
    totalDurationMin: 120,
    estimatedBudgetEtb: 300,
  })
})

describe("trip itinerary actions", () => {
  it("adds a custom activity and appends it to the timeline", async () => {
    const user = userEvent.setup()
    const newItem: TripItem = {
      id: "i3",
      tripId: "trip-1",
      dayDate: "2026-02-01",
      startTime: "16:00",
      durationMin: 60,
      itemType: "CUSTOM",
      title: "Fresh fruit market",
      costAmount: 250,
      currency: "ETB",
      status: "PLANNED",
      createdBy: "USER",
    }
    mockAddItem.mockResolvedValue({
      item: newItem,
      hasConflict: false,
      conflictWith: [],
    })

    await renderReadyTrip()
    await user.click(screen.getByRole("button", { name: "Add Activity" }))

    await user.type(
      screen.getByPlaceholderText("e.g. Visit National Museum & Lucy"),
      "Fresh fruit market",
    )
    await user.type(screen.getByPlaceholderText("e.g. 500"), "250")
    await user.type(
      screen.getByText("Start Time (Optional)")
        .nextElementSibling as HTMLInputElement,
      "16:00",
    )
    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith("trip-1", {
        dayDate: "2026-02-01",
        title: "Fresh fruit market",
        itemType: "CUSTOM",
        startTime: "16:00",
        durationMin: 60,
        costAmount: 250,
        currency: "ETB",
        notes: undefined,
      }),
    )
    expect(
      await screen.findByRole("heading", { name: "Fresh fruit market" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Add Itinerary Activity" }),
    ).not.toBeInTheDocument()
  })

  it("shows a schedule overlap banner and can auto-adjust the new activity", async () => {
    const user = userEvent.setup()
    const newItem: TripItem = {
      id: "i9",
      tripId: "trip-1",
      dayDate: "2026-02-01",
      startTime: "10:00",
      durationMin: 60,
      itemType: "CUSTOM",
      title: "Bole coffee walk",
      status: "PLANNED",
      createdBy: "USER",
    }
    mockAddItem.mockResolvedValue({
      item: newItem,
      hasConflict: true,
      conflictWith: [
        {
          id: "i1",
          title: "Coffee ceremony at Tomoca",
          timeWindow: "09:00 - 11:00",
        },
      ],
    })
    mockUpdateItem.mockResolvedValue({
      item: { ...newItem, startTime: "11:15" },
      hasConflict: false,
      conflictWith: [],
    })

    await renderReadyTrip()
    await user.click(screen.getByRole("button", { name: "Add Activity" }))
    await user.type(
      screen.getByPlaceholderText("e.g. Visit National Museum & Lucy"),
      "Bole coffee walk",
    )
    await user.type(
      screen.getByText("Start Time (Optional)")
        .nextElementSibling as HTMLInputElement,
      "10:00",
    )
    await user.click(screen.getByRole("button", { name: "Add to Itinerary" }))

    expect(
      await screen.findByText("Schedule Overlap Detected"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "“Bole coffee walk” overlaps with “Coffee ceremony at Tomoca” (09:00 - 11:00).",
      ),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Auto-adjust to 11:15/ }),
    )

    await waitFor(() =>
      expect(mockUpdateItem).toHaveBeenCalledWith("trip-1", "i9", {
        startTime: "11:15",
      }),
    )
    expect(
      screen.queryByText("Schedule Overlap Detected"),
    ).not.toBeInTheDocument()
  })

  it("updates the status of an activity", async () => {
    const user = userEvent.setup()
    await renderReadyTrip()

    const museumArticle = screen
      .getByRole("heading", { name: "Visit National Museum" })
      .closest("article") as HTMLElement
    const coffeeArticle = screen
      .getByRole("heading", { name: "Coffee ceremony at Tomoca" })
      .closest("article") as HTMLElement

    expect(within(museumArticle).getByRole("combobox")).toHaveValue("DONE")
    expect(within(coffeeArticle).getByRole("combobox")).toHaveValue("PLANNED")

    await user.selectOptions(
      within(coffeeArticle).getByRole("combobox"),
      "DONE",
    )

    await waitFor(() =>
      expect(mockUpdateItem).toHaveBeenCalledWith("trip-1", "i1", {
        status: "DONE",
      }),
    )
    expect(await within(coffeeArticle).findByRole("combobox")).toHaveValue(
      "DONE",
    )
  })

  it("removes an activity from the itinerary", async () => {
    const user = userEvent.setup()
    await renderReadyTrip()
    const coffeeArticle = screen
      .getByRole("heading", { name: "Coffee ceremony at Tomoca" })
      .closest("article") as HTMLElement

    await user.click(within(coffeeArticle).getByTitle("Remove activity"))

    await waitFor(() =>
      expect(mockRemoveItem).toHaveBeenCalledWith("trip-1", "i1"),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Coffee ceremony at Tomoca" }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("heading", { name: "Visit National Museum" }),
    ).toBeInTheDocument()
  })

  it("generates a day-plan draft and confirms it into the itinerary", async () => {
    const user = userEvent.setup()
    await renderReadyTrip()

    await user.click(screen.getByRole("button", { name: /Build My Day/ }))
    expect(
      screen.getByRole("heading", { name: "Build My Day" }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Heritage & culture" }),
    ).toHaveAttribute("aria-pressed", "false")
    await user.click(screen.getByRole("button", { name: "Heritage & culture" }))
    expect(
      screen.getByRole("button", { name: "Heritage & culture" }),
    ).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: /Generate draft/ }))

    await waitFor(() =>
      expect(mockBuildDay).toHaveBeenCalledWith("trip-1", {
        dayDate: "2026-02-01",
        duration: "HALF_DAY",
        startTime: "09:00",
        interests: ["HERITAGE"],
      }),
    )

    expect(
      await screen.findByText("1 verified stops · 120 minutes"),
    ).toBeInTheDocument()
    expect(screen.getByText("Estimated ETB 300")).toBeInTheDocument()
    expect(
      screen.getByText("09:30 · 120 min · Arat Kilo, Addis Ababa"),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /Confirm & Add to Trip/ }),
    )

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith("trip-1", {
        dayDate: "2026-02-01",
        itemType: "PLACE",
        placeId: "ph1",
        title: "Ethiopian National Museum",
        startTime: "09:30",
        durationMin: 120,
        costAmount: 300,
        currency: "ETB",
        createdBy: "AI",
        userConfirmed: true,
      }),
    )
    expect(
      await screen.findByRole("heading", { name: "Ethiopian National Museum" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Build My Day" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("AI Drafted")).toBeInTheDocument()
  })

  it("surfaces a failure when the day plan cannot be generated", async () => {
    const user = userEvent.setup()
    mockBuildDay.mockRejectedValue(new Error("Could not build the day"))
    await renderReadyTrip()

    await user.click(screen.getByRole("button", { name: /Build My Day/ }))
    await user.click(screen.getByRole("button", { name: /Generate draft/ }))

    expect(
      await screen.findByText("Could not build the day"),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("1 verified stops · 120 minutes"),
    ).not.toBeInTheDocument()
  })
})
