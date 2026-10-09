import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ManagerCouponsPage from "@/app/manager/coupons/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/manager/coupons",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    managerApi: {
      ...actual.managerApi,
      coupons: jest.fn(),
      createCoupon: jest.fn(),
      updateCoupon: jest.fn(),
      deactivateCoupon: jest.fn(),
    },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>

const managerUser: User = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const welcomeCoupon = {
  id: "c1",
  code: "WELCOME10",
  discountType: "PERCENTAGE",
  value: 10,
  validFrom: "2026-01-01T00:00:00.000Z",
  validTo: "2026-12-31T23:59:59.000Z",
  usageLimit: 100,
  timesUsed: 12,
  isActive: true,
  minBookingAmount: 1000,
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  jest.spyOn(window, "confirm").mockReturnValue(true)
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
  mgr.coupons.mockResolvedValue([welcomeCoupon])
  mgr.createCoupon.mockResolvedValue({})
  mgr.updateCoupon.mockResolvedValue({})
  mgr.deactivateCoupon.mockResolvedValue({ deactivated: true })
  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

afterEach(() => jest.restoreAllMocks())

const fillCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByPlaceholderText("Code (e.g. WELCOME10)"),
    "RAKE10",
  )
  await user.type(screen.getByPlaceholderText("Discount value"), "10")
  await user.type(screen.getByLabelText("Valid from"), "2026-03-01")
  await user.type(screen.getByLabelText("Valid to"), "2026-04-01")
}

describe("Manager hotel coupons", () => {
  it("creates a hotel-scoped coupon with the chosen validity window", async () => {
    const user = userEvent.setup()
    render(<ManagerCouponsPage />)
    await screen.findByText("WELCOME10")

    await fillCreateForm(user)
    await user.click(screen.getByRole("button", { name: "Create coupon" }))

    await waitFor(() => expect(mgr.createCoupon).toHaveBeenCalledTimes(1))
    const payload = mgr.createCoupon.mock.calls[0][0]
    expect(payload.code).toBe("RAKE10")
    expect(payload.discountType).toBe("PERCENTAGE")
    expect(payload.value).toBe(10)
    expect(payload.usageLimit).toBe(100)
    expect(payload.minBookingAmount).toBeUndefined()
    expect(new Date(payload.validTo).getTime()).toBeGreaterThan(
      new Date(payload.validFrom).getTime(),
    )
    expect(
      await screen.findByText("Coupon created for your hotel."),
    ).toBeInTheDocument()
  })

  it("prefills the form and patches the coupon when editing", async () => {
    const user = userEvent.setup()
    render(<ManagerCouponsPage />)
    await screen.findByText("WELCOME10")

    await user.click(screen.getByRole("button", { name: "Edit WELCOME10" }))

    expect(
      await screen.findByRole("heading", { name: "Edit hotel coupon" }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Code (e.g. WELCOME10)")).toHaveValue(
      "WELCOME10",
    )
    expect(screen.getByPlaceholderText("Usage limit")).toHaveValue(100)
    expect(
      screen.getByPlaceholderText("Minimum booking (optional)"),
    ).toHaveValue(1000)

    await user.clear(screen.getByPlaceholderText("Usage limit"))
    await user.type(screen.getByPlaceholderText("Usage limit"), "250")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(mgr.updateCoupon).toHaveBeenCalledTimes(1))
    expect(mgr.updateCoupon).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ code: "WELCOME10", usageLimit: 250 }),
    )
    expect(mgr.createCoupon).not.toHaveBeenCalled()
    expect(await screen.findByText("Coupon updated.")).toBeInTheDocument()
  })

  it("deactivates an active coupon", async () => {
    const user = userEvent.setup()
    render(<ManagerCouponsPage />)
    await screen.findByText("WELCOME10")

    await user.click(
      screen.getByRole("button", { name: "Deactivate WELCOME10" }),
    )

    await waitFor(() => expect(mgr.deactivateCoupon).toHaveBeenCalledWith("c1"))
    expect(window.confirm).toHaveBeenCalled()
  })
})
