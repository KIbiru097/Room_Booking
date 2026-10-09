import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AdminPage from "@/app/admin/page"
import { useAuth } from "@/lib/auth-store"
import { adminApi, reviewApi, hotelApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      overview: jest.fn(),
      occupancy: jest.fn(),
      users: jest.fn(),
      hotels: jest.fn(),
      bookings: jest.fn(),
      payments: jest.fn(),
      reviews: jest.fn(),
      auditLogs: jest.fn(),
      coupons: jest.fn(),
      settings: jest.fn(),
      monthlyRevenue: jest.fn(),
      bookingTrends: jest.fn(),
      mostBookedHotels: jest.fn(),
      setUserActive: jest.fn(),
      setHotelStatus: jest.fn(),
      approveHotel: jest.fn(),
      rejectHotel: jest.fn(),
      createUser: jest.fn(),
      createHotel: jest.fn(),
      addHotelImages: jest.fn(),
      createCoupon: jest.fn(),
      updateCoupon: jest.fn(),
      deleteCoupon: jest.fn(),
      deleteSetting: jest.fn(),
      downloadReport: jest.fn(),
      upsertSetting: jest.fn(),
      reassignManager: jest.fn(),
    },
    reviewApi: { ...actual.reviewApi, remove: jest.fn() },
    hotelApi: { ...actual.hotelApi, countries: jest.fn() },
  }
})

const adm = adminApi as unknown as Record<string, jest.Mock>
const rev = reviewApi as unknown as Record<string, jest.Mock>
const hotelsApi = hotelApi as unknown as Record<string, jest.Mock>

const adminUser: User = {
  id: "u-admin",
  email: "root@luxstay.test",
  fullName: "Root Admin",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const percentCoupon = {
  id: "c1",
  code: "SUMMER25",
  discountType: "PERCENTAGE",
  value: 25,
  validFrom: "2026-06-01T00:00:00.000Z",
  validTo: "2026-08-31T00:00:00.000Z",
  timesUsed: 12,
  usageLimit: 100,
  isActive: true,
}

const fixedCoupon = {
  id: "c2",
  code: "FLAT500",
  discountType: "FIXED_AMOUNT",
  value: 500,
  validFrom: null,
  validTo: null,
  usageCount: 0,
  usageLimit: null,
  isActive: false,
}

const platformSettings = [
  {
    id: "s1",
    key: "COMMISSION_AND_TAX",
    value: {
      platformFeePercent: 12,
      vatRate: 15,
      defaultCurrency: "USD",
      minPayoutAmount: 7500,
      payoutSchedule: "BI_WEEKLY",
    },
    description: "Fee schedule",
  },
  {
    id: "s2",
    key: "BOOKING_POLICIES",
    value: {
      holdDurationMinutes: 45,
      cancellationGraceHours: 48,
      maxRoomsPerBooking: 5,
      autoConfirmBookings: false,
      allowEarlyCheckIn: false,
    },
    description: "",
  },
  {
    id: "s3",
    key: "SECURITY_AND_AUTH",
    value: {
      passwordMinLength: 10,
      require2FAForStaff: true,
      sessionTimeoutHours: 24,
      maxLoginAttempts: 3,
      enableAuditLogging: false,
    },
    description: "Security policy",
  },
  {
    id: "s4",
    key: "NOTIFICATIONS_GATEWAY",
    value: {
      supportEmail: "ops@luxstay.test",
      smsProvider: "TWILIO",
      emailDispatchMode: "SES",
      notifyOnBooking: false,
      notifyOnCancellation: false,
    },
    description: "",
  },
  {
    id: "s5",
    key: "PLATFORM_OPERATIONS",
    value: {
      maintenanceMode: true,
      maintenanceMessage: "Scheduled maintenance window",
      autoApproveHotels: true,
      maxUploadSizeMb: 25,
    },
    description: "Operations",
  },
  {
    id: "s6",
    key: "FEATURE_FLAGS",
    value: { betaDashboards: true },
    description: "Toggle features",
  },
]

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  jest.restoreAllMocks()
  useAuth.setState({
    user: null,
    tokens: null,
    loading: false,
    isInitialized: false,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: false,
  })

  adm.overview.mockResolvedValue({
    userCount: 120,
    hotelCount: 12,
    bookingCount: 340,
    totalRevenue: 987650,
  })
  adm.occupancy.mockResolvedValue({
    rooms: 40,
    occupiedRoomsToday: 20,
    occupancyRate: 0.5,
    breakdown: [],
  })
  adm.users.mockResolvedValue({ data: [] })
  adm.hotels.mockResolvedValue({ data: [] })
  adm.bookings.mockResolvedValue({ data: [] })
  adm.payments.mockResolvedValue({ data: [] })
  adm.reviews.mockResolvedValue({ data: [] })
  adm.auditLogs.mockResolvedValue([])
  adm.coupons.mockResolvedValue([percentCoupon, fixedCoupon])
  adm.settings.mockResolvedValue(platformSettings)
  adm.monthlyRevenue.mockResolvedValue([])
  adm.bookingTrends.mockResolvedValue([])
  adm.mostBookedHotels.mockResolvedValue([])
  adm.setUserActive.mockResolvedValue(undefined)
  adm.setHotelStatus.mockResolvedValue(undefined)
  adm.approveHotel.mockResolvedValue(undefined)
  adm.rejectHotel.mockResolvedValue(undefined)
  adm.createUser.mockResolvedValue(undefined)
  adm.createHotel.mockResolvedValue(undefined)
  adm.createCoupon.mockResolvedValue(undefined)
  adm.updateCoupon.mockResolvedValue(undefined)
  adm.deleteCoupon.mockResolvedValue(undefined)
  adm.deleteSetting.mockResolvedValue(undefined)
  adm.downloadReport.mockResolvedValue(undefined)
  adm.upsertSetting.mockResolvedValue(undefined)
  adm.reassignManager.mockResolvedValue(undefined)
  rev.remove.mockResolvedValue(undefined)
  hotelsApi.countries.mockResolvedValue([])

  useAuth
    .getState()
    .setSession({ user: adminUser, accessToken: "at", refreshToken: "rt" })
})

const openTab = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  render(<AdminPage />)
  await screen.findByRole("heading", { name: "Platform Operations" })
  await user.click(screen.getByRole("button", { name }))
}

describe("Coupons tab", () => {
  it("lists coupons with discount, usage, and status", async () => {
    const user = userEvent.setup()
    await openTab(user, "Coupons")

    expect(
      await screen.findByRole("heading", { name: "Promotional Coupons" }),
    ).toBeInTheDocument()
    expect(screen.getByText("SUMMER25")).toBeInTheDocument()
    expect(screen.getByText("25% Off")).toBeInTheDocument()
    expect(screen.getByText("FLAT500")).toBeInTheDocument()
    expect(screen.getByText("12 / 100")).toBeInTheDocument()
    expect(screen.getByText("0 / ∞")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Disabled")).toBeInTheDocument()
    expect(screen.getByText(/Now → Indefinite/)).toBeInTheDocument()
  })

  it("enables and disables coupons", async () => {
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getByRole("button", { name: "Disable" }))
    await waitFor(() =>
      expect(adm.updateCoupon).toHaveBeenCalledWith("c1", { isActive: false }),
    )
    expect(
      await screen.findByText("Coupon SUMMER25 updated."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Enable" }))
    await waitFor(() =>
      expect(adm.updateCoupon).toHaveBeenCalledWith("c2", { isActive: true }),
    )
    expect(
      await screen.findByText("Coupon FLAT500 updated."),
    ).toBeInTheDocument()
  })

  it("deletes a coupon after confirmation", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    await waitFor(() => expect(adm.deleteCoupon).toHaveBeenCalledWith("c1"))
    expect(await screen.findByText("Coupon deleted.")).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this coupon?",
    )
  })

  it("skips coupon deletion when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    expect(adm.deleteCoupon).not.toHaveBeenCalled()
  })

  it("reports coupon deletion failures", async () => {
    adm.deleteCoupon.mockRejectedValueOnce(new Error("coupon in use"))
    jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    expect(await screen.findByText("coupon in use")).toBeInTheDocument()
  })

  it("creates a fixed amount coupon with a minimum spend", async () => {
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getByRole("button", { name: "+ Create Coupon" }))
    expect(
      await screen.findByRole("heading", { name: "Create Coupon" }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("e.g. LUXSTAY20"), {
      target: { value: "flat700" },
    })
    fireEvent.change(screen.getByDisplayValue("Percentage (%)"), {
      target: { value: "FIXED_AMOUNT" },
    })
    const valueInput = screen.getByDisplayValue("15")
    fireEvent.change(valueInput, { target: { value: "700" } })
    fireEvent.change(screen.getByPlaceholderText("Optional"), {
      target: { value: "1000" },
    })

    await user.click(screen.getByRole("button", { name: "Create Coupon" }))

    await waitFor(() =>
      expect(adm.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FLAT700",
          discountType: "FIXED_AMOUNT",
          value: 700,
          minBookingAmount: 1000,
        }),
      ),
    )
    expect(
      await screen.findByText("Coupon FLAT700 created!"),
    ).toBeInTheDocument()
  })

  it("reports coupon creation failures", async () => {
    adm.createCoupon.mockRejectedValueOnce(new Error("code already used"))
    const user = userEvent.setup()
    await openTab(user, "Coupons")
    await screen.findByRole("heading", { name: "Promotional Coupons" })

    await user.click(screen.getByRole("button", { name: "+ Create Coupon" }))
    await screen.findByRole("heading", { name: "Create Coupon" })
    fireEvent.change(screen.getByPlaceholderText("e.g. LUXSTAY20"), {
      target: { value: "dup" },
    })
    await user.click(screen.getByRole("button", { name: "Create Coupon" }))

    expect(await screen.findByText("code already used")).toBeInTheDocument()
  })

  it("shows the empty coupon state", async () => {
    adm.coupons.mockResolvedValue([])
    const user = userEvent.setup()
    await openTab(user, "Coupons")

    expect(
      await screen.findByText(/No coupons created yet/),
    ).toBeInTheDocument()
  })
})

describe("Settings tab", () => {
  it("renders every settings category and the maintenance broadcast banner", async () => {
    const user = userEvent.setup()
    await openTab(user, "Settings")

    expect(
      await screen.findByRole("heading", {
        name: "Platform Settings & Governance",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Commission & Financials")).toBeInTheDocument()
    expect(screen.getByText("Booking & Stay Policies")).toBeInTheDocument()
    expect(screen.getByText("Security & Authentication")).toBeInTheDocument()
    expect(screen.getByText("Notification Gateways")).toBeInTheDocument()
    expect(
      screen.getByText("Platform Operations & Maintenance"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Platform Maintenance Mode is Currently Active"),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Scheduled maintenance window/).length,
    ).toBeGreaterThan(0)
    expect(screen.getByDisplayValue("ops@luxstay.test")).toBeInTheDocument()
    expect(screen.getAllByDisplayValue("12").length).toBeGreaterThan(0)
    expect(screen.getAllByDisplayValue("45").length).toBeGreaterThan(0)
  })

  it("persists edits for all five settings categories", async () => {
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    const specs: Array<[string, string, Record<string, unknown>]> = [
      [
        "Save Financials",
        "COMMISSION_AND_TAX",
        { platformFeePercent: 12, defaultCurrency: "USD" },
      ],
      [
        "Save Booking Policies",
        "BOOKING_POLICIES",
        { holdDurationMinutes: 45, maxRoomsPerBooking: 5 },
      ],
      [
        "Save Security Controls",
        "SECURITY_AND_AUTH",
        { passwordMinLength: 10, maxLoginAttempts: 3 },
      ],
      [
        "Save Gateways",
        "NOTIFICATIONS_GATEWAY",
        { supportEmail: "ops@luxstay.test", smsProvider: "TWILIO" },
      ],
      [
        "Save Operational Controls",
        "PLATFORM_OPERATIONS",
        { maintenanceMode: true, maxUploadSizeMb: 25 },
      ],
    ]

    for (const [label, key, subset] of specs) {
      await user.click(screen.getByRole("button", { name: label }))
      await waitFor(() =>
        expect(adm.upsertSetting).toHaveBeenCalledWith(key, {
          value: expect.objectContaining(subset),
        }),
      )
      await waitFor(() =>
        expect(screen.getByRole("button", { name: label })).toBeEnabled(),
      )
    }

    expect(
      await screen.findByText("Operation Settings updated successfully!"),
    ).toBeInTheDocument()
  })

  it("resets a category to its defaults after confirmation", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(screen.getAllByRole("button", { name: "Defaults" })[0])

    await waitFor(() =>
      expect(adm.upsertSetting).toHaveBeenCalledWith("COMMISSION_AND_TAX", {
        value: {
          platformFeePercent: 10,
          vatRate: 15,
          defaultCurrency: "ETB",
          minPayoutAmount: 5000,
          payoutSchedule: "WEEKLY",
        },
      }),
    )
    expect(
      await screen.findByText(
        "Commission Settings reset to standard defaults!",
      ),
    ).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalledWith(
      "Reset Commission Settings to standard platform defaults?",
    )

    confirmSpy.mockReturnValue(false)
    await user.click(screen.getAllByRole("button", { name: "Defaults" })[1])
    expect(adm.upsertSetting).toHaveBeenCalledTimes(1)
  })

  it("reports category save failures", async () => {
    adm.upsertSetting.mockRejectedValueOnce(new Error("settings store offline"))
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(screen.getByRole("button", { name: "Save Financials" }))

    expect(
      await screen.findByText("settings store offline"),
    ).toBeInTheDocument()
  })

  it("edits and removes raw settings through the database explorer", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true)
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(
      screen.getByRole("button", { name: /Raw Database Explorer/ }),
    )
    expect(
      await screen.findByRole("heading", {
        name: "Raw Key-Value Database Explorer",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("6 total keys")).toBeInTheDocument()
    expect(screen.getByText("FEATURE_FLAGS")).toBeInTheDocument()
    expect(screen.getByText("Toggle features")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Edit Raw" })[0])
    expect(
      await screen.findByRole("heading", { name: "Platform Setting" }),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("COMMISSION_AND_TAX")).toBeInTheDocument()

    const valueArea = screen.getByPlaceholderText(
      'e.g. 0.05 or { "enabled": true }',
    )
    fireEvent.change(valueArea, {
      target: { value: '{"platformFeePercent": 18}' },
    })
    await user.click(screen.getByRole("button", { name: "Save Setting" }))

    await waitFor(() =>
      expect(adm.upsertSetting).toHaveBeenCalledWith("COMMISSION_AND_TAX", {
        value: { platformFeePercent: 18 },
        description: "Fee schedule",
      }),
    )
    expect(
      await screen.findByText('Setting "COMMISSION_AND_TAX" saved!'),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])
    await waitFor(() =>
      expect(adm.deleteSetting).toHaveBeenCalledWith("COMMISSION_AND_TAX"),
    )
    expect(
      await screen.findByText('Setting "COMMISSION_AND_TAX" removed.'),
    ).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete setting "COMMISSION_AND_TAX"?',
    )
  })

  it("adds a custom key with a JSON value", async () => {
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(screen.getByRole("button", { name: /Add Custom Key/ }))
    expect(
      await screen.findByRole("heading", { name: "Platform Setting" }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("e.g. PLATFORM_FEE_PERCENT"), {
      target: { value: "feature_theme" },
    })
    fireEvent.change(
      screen.getByPlaceholderText('e.g. 0.05 or { "enabled": true }'),
      {
        target: { value: '"dark"' },
      },
    )
    await user.click(screen.getByRole("button", { name: "Save Setting" }))

    await waitFor(() =>
      expect(adm.upsertSetting).toHaveBeenCalledWith("FEATURE_THEME", {
        value: "dark",
        description: undefined,
      }),
    )
    expect(
      await screen.findByText('Setting "FEATURE_THEME" saved!'),
    ).toBeInTheDocument()
  })

  it("reports raw setting save and delete failures", async () => {
    adm.upsertSetting.mockRejectedValueOnce(new Error("read only store"))
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(screen.getByRole("button", { name: /Add Custom Key/ }))
    await screen.findByRole("heading", { name: "Platform Setting" })
    fireEvent.change(screen.getByPlaceholderText("e.g. PLATFORM_FEE_PERCENT"), {
      target: { value: "ANY_KEY" },
    })
    fireEvent.change(
      screen.getByPlaceholderText('e.g. 0.05 or { "enabled": true }'),
      {
        target: { value: "x" },
      },
    )
    await user.click(screen.getByRole("button", { name: "Save Setting" }))

    expect(await screen.findByText("read only store")).toBeInTheDocument()
  })

  it("shows the empty raw store when no settings exist", async () => {
    adm.settings.mockResolvedValue([])
    const user = userEvent.setup()
    await openTab(user, "Settings")
    await screen.findByRole("heading", {
      name: "Platform Settings & Governance",
    })

    await user.click(
      screen.getByRole("button", { name: /Raw Database Explorer/ }),
    )

    expect(
      await screen.findByText("No raw platform settings recorded."),
    ).toBeInTheDocument()
    expect(screen.getByText("0 total keys")).toBeInTheDocument()
    expect(
      screen.queryByText("Platform Maintenance Mode is Currently Active"),
    ).not.toBeInTheDocument()
  })
})
