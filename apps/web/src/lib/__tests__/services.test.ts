import { API_BASE_URL, api } from "@/lib/api"
import { useAuth } from "@/lib/auth-store"
import {
  adminApi,
  aiService,
  authApi,
  bookingApi,
  contactApi,
  discoverApi,
  disputeApi,
  downloadReportFile,
  favoriteApi,
  hotelApi,
  managerApi,
  notificationApi,
  paymentApi,
  profileApi,
  reviewApi,
  staffApi,
  transportationApi,
  tripApi,
} from "@/lib/services"

const TOKEN = "access-1"

const initialState = {
  user: null,
  tokens: null,
  loading: false,
  isInitialized: false,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  isCustomer: false,
}

interface Spies {
  get: jest.SpyInstance
  post: jest.SpyInstance
  patch: jest.SpyInstance
  put: jest.SpyInstance
  delete: jest.SpyInstance
  postForm: jest.SpyInstance
}

let spy: Spies

beforeEach(() => {
  window.localStorage.clear()
  useAuth.setState({
    ...initialState,
    tokens: { accessToken: TOKEN, refreshToken: "refresh-1" },
  })
  spy = {
    get: jest.spyOn(api, "get").mockResolvedValue({} as never),
    post: jest.spyOn(api, "post").mockResolvedValue({} as never),
    patch: jest.spyOn(api, "patch").mockResolvedValue({} as never),
    put: jest.spyOn(api, "put").mockResolvedValue({} as never),
    delete: jest.spyOn(api, "delete").mockResolvedValue({} as never),
    postForm: jest.spyOn(api, "postForm").mockResolvedValue({} as never),
  }
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe("query string building", () => {
  it("drops undefined and empty values", () => {
    hotelApi.search({ city: "Addis Ababa", promo: undefined, empty: "" })

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels?city=Addis+Ababa")
  })

  it("encodes numbers, booleans and spaces", () => {
    hotelApi.search({ page: 2, pets: true, q: "luxury suite" })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels?page=2&pets=true&q=luxury+suite",
    )
  })

  it("omits the question mark when every value is filtered out", () => {
    hotelApi.search({ promo: undefined, empty: "" })

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels")
  })

  it("builds a request path even without params", () => {
    hotelApi.search()

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels")
  })

  it("serialises discovery filters", () => {
    discoverApi.nearby({
      lat: 9.03,
      lng: 38.74,
      radiusKm: 10,
      category: "Museum",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/discover/nearby?lat=9.03&lng=38.74&radiusKm=10&category=Museum",
    )
  })

  it("applies scope and pagination filters elsewhere", () => {
    bookingApi.myBookings("upcoming")
    notificationApi.list(3)
    contactApi.listThreads("hotel-1")
    reviewApi.forHotel("hotel-1")
    managerApi.bookings({ page: 2, status: "PENDING" })

    expect(spy.get).toHaveBeenCalledWith("/bookings/my?scope=upcoming", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/notifications?page=3", TOKEN)
    expect(spy.get).toHaveBeenCalledWith(
      "/contact/threads?hotelId=hotel-1",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/hotels/hotel-1/reviews?page=1")
    expect(spy.get).toHaveBeenCalledWith(
      "/bookings/manage?page=2&status=PENDING",
      TOKEN,
    )
  })

  it("encodes path segments", async () => {
    await authApi.verifyEmail("token/with space")
    discoverApi.destination("city/1")
    tripApi.get("trip/1")

    expect(spy.post).toHaveBeenCalledWith(
      "/auth/verify-email/token%2Fwith%20space",
    )
    expect(spy.get).toHaveBeenCalledWith("/discover/destinations/city%2F1")
    expect(spy.get).toHaveBeenCalledWith("/trips/trip%2F1", TOKEN)
  })
})

describe("authApi", () => {
  it("posts registration and login payloads", async () => {
    const register = {
      email: "a@b.com",
      password: "secret1",
      fullName: "Abebe",
    }
    spy.post.mockResolvedValueOnce({ user: { id: "u1" }, accessToken: "t" })

    await expect(authApi.register(register)).resolves.toEqual({
      user: { id: "u1" },
      accessToken: "t",
    })
    await authApi.login({ email: "a@b.com", password: "secret1" })

    expect(spy.post).toHaveBeenCalledWith("/auth/register", register)
    expect(spy.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "secret1",
    })
  })

  it("routes the password recovery endpoints", () => {
    authApi.forgot("a@b.com")
    authApi.resetPassword({ token: "reset-1", password: "secret2" })
    authApi.resendVerification("a@b.com")

    expect(spy.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "a@b.com",
    })
    expect(spy.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-1",
      password: "secret2",
    })
    expect(spy.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "a@b.com",
    })
  })

  it("manages sessions and deactivation against the auth store token", async () => {
    authApi.listSessions()
    authApi.revokeSession("session-1")
    authApi.revokeAllOtherSessions()
    authApi.deactivate("moving abroad")

    expect(spy.get).toHaveBeenCalledWith("/auth/sessions", TOKEN)
    expect(spy.delete).toHaveBeenCalledWith("/auth/sessions/session-1", TOKEN)
    expect(spy.delete).toHaveBeenCalledWith("/auth/sessions", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/auth/me/deactivate",
      { reason: "moving abroad" },
      TOKEN,
    )
  })

  it("sends no credentials for anonymous auth calls", async () => {
    useAuth.setState({ tokens: null })

    authApi.listSessions()

    expect(spy.get).toHaveBeenCalledWith("/auth/sessions", undefined)
  })
})

describe("profileApi", () => {
  it("reads and patches the current profile with the session token", () => {
    profileApi.get()
    profileApi.update({ fullName: "Abebe Kebede", newPassword: "secret3" })

    expect(spy.get).toHaveBeenCalledWith("/auth/me", TOKEN)
    expect(spy.patch).toHaveBeenCalledWith(
      "/auth/me",
      { fullName: "Abebe Kebede", newPassword: "secret3" },
      TOKEN,
    )
  })

  it("uploads the avatar as form data", () => {
    const file = new File(["binary"], "me.png", { type: "image/png" })

    profileApi.uploadPhoto(file)

    expect(spy.postForm).toHaveBeenCalledTimes(1)
    const [path, form, token] = spy.postForm.mock.calls[0]
    expect(path).toBe("/auth/me/photo")
    expect(token).toBe(TOKEN)
    expect(form).toBeInstanceOf(FormData)
    expect((form as FormData).get("photo")).toBe(file)
  })
})

describe("hotelApi", () => {
  it("reads catalog resources", () => {
    hotelApi.getById("hotel-1")
    hotelApi.getRooms("hotel-1", { page: 2 })
    hotelApi.getPolicy("hotel-1")
    hotelApi.countries()
    hotelApi.cities("ET")
    hotelApi.amenities()

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels/hotel-1")
    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels/hotel-1/rooms?page=2")
    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/policy",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/catalog/countries")
    expect(spy.get).toHaveBeenCalledWith("/catalog/cities?country=ET")
    expect(spy.get).toHaveBeenCalledWith("/catalog/amenities")
  })

  it("omits the country filter when it is missing", () => {
    hotelApi.cities()

    expect(spy.get).toHaveBeenCalledWith("/catalog/cities")
  })
})

describe("bookingApi", () => {
  const checkout = {
    hotelId: "hotel-1",
    roomIds: ["room-1"],
    checkIn: "2026-05-01",
    checkOut: "2026-05-04",
    guests: { adults: 2, children: 0 },
  }

  it("quotes and creates bookings with the session token", async () => {
    spy.post.mockResolvedValueOnce({ total: 420 })

    await expect(bookingApi.checkout(checkout)).resolves.toEqual({ total: 420 })
    bookingApi.create(checkout)

    expect(spy.post).toHaveBeenCalledWith("/bookings/checkout", checkout, TOKEN)
    expect(spy.post).toHaveBeenCalledWith("/bookings", checkout, TOKEN)
  })

  it("cancels whole bookings and individual rooms", () => {
    bookingApi.cancel("booking-1")
    bookingApi.cancelRooms("booking-1", ["room-2"])

    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/cancel",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/cancel-rooms",
      { roomIds: ["room-2"] },
      TOKEN,
    )
  })

  it("manages room holds and stay requests", () => {
    const hold = {
      roomId: "room-1",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    }
    bookingApi.createHold(hold)
    bookingApi.releaseHold("hold-1")
    bookingApi.createStayRequest("booking-1", {
      type: "EARLY_CHECK_IN",
      requestedTime: "10:00",
    })
    bookingApi.getStayRequests("booking-1")

    expect(spy.post).toHaveBeenCalledWith("/bookings/holds", hold, TOKEN)
    expect(spy.delete).toHaveBeenCalledWith("/bookings/holds/hold-1", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/stay-requests",
      { type: "EARLY_CHECK_IN", requestedTime: "10:00" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/bookings/booking-1/stay-requests",
      TOKEN,
    )
  })

  it("quotes and applies booking modifications", () => {
    const modification = { checkIn: "2026-06-01", checkOut: "2026-06-05" }
    bookingApi.modifyQuote("booking-1", modification)
    bookingApi.modify("booking-1", modification)

    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/modify-quote",
      modification,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/modify",
      modification,
      TOKEN,
    )
  })

  it("builds the invoice URL from the API base", () => {
    expect(bookingApi.invoiceUrl("booking-1")).toBe(
      `${API_BASE_URL}/bookings/booking-1/invoice`,
    )
  })
})

describe("transportationApi", () => {
  it("lists, books and cancels transport", () => {
    transportationApi.services({
      serviceType: "AIRPORT_PICKUP",
      passengers: 2,
      page: 1,
    })
    transportationApi.createBooking({
      serviceId: "svc-1",
      pickupAt: "2026-05-01T09:00:00Z",
      pickupLocation: "Airport",
      dropoffLocation: "Bole",
      passengers: 2,
    })
    transportationApi.myBookings()
    transportationApi.cancelBooking("tb-1")

    expect(spy.get).toHaveBeenCalledWith(
      "/transportation/services?serviceType=AIRPORT_PICKUP&passengers=2&page=1",
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/transportation/bookings",
      {
        serviceId: "svc-1",
        pickupAt: "2026-05-01T09:00:00Z",
        pickupLocation: "Airport",
        dropoffLocation: "Bole",
        passengers: 2,
      },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/transportation/bookings", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/transportation/bookings/tb-1/cancel",
      undefined,
      TOKEN,
    )
  })
})

describe("paymentApi", () => {
  it("creates intents and lists payments with the session token", async () => {
    spy.post.mockResolvedValueOnce({ paymentId: "pay-1" })

    await expect(paymentApi.intent("booking-1", "TELEBIRR")).resolves.toEqual({
      paymentId: "pay-1",
    })
    paymentApi.mine()

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/booking-1/intent",
      { method: "TELEBIRR" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/payments/my", TOKEN)
  })

  it("calls the mock gateway with the shared secret header", () => {
    paymentApi.mockCallback("booking-1", { reference: "REF-1" })

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      { reference: "REF-1" },
      undefined,
      {
        headers: { "x-mock-payment-secret": "development-mock-payment-secret" },
      },
    )
  })

  it("accepts a custom mock secret and defaults the payload", () => {
    paymentApi.mockCallback("booking-1", undefined, "s3cret")

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/mock/booking-1",
      {},
      undefined,
      { headers: { "x-mock-payment-secret": "s3cret" } },
    )
  })

  it("supports cash capture and refunds", () => {
    paymentApi.markCashPaid("booking-1", "CASH-1")
    paymentApi.refund("booking-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/payments/booking-1/cash-paid",
      { reference: "CASH-1" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/payments/booking-1/refund",
      undefined,
      TOKEN,
    )
  })
})

describe("reviewApi, favoriteApi, notificationApi and contactApi", () => {
  it("creates and removes reviews", () => {
    reviewApi.create({ hotelId: "hotel-1", rating: 5, comment: "Great" })
    reviewApi.forHotel("hotel-1", 2)
    reviewApi.mine()
    reviewApi.remove("review-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/reviews",
      { hotelId: "hotel-1", rating: 5, comment: "Great" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/hotels/hotel-1/reviews?page=2")
    expect(spy.get).toHaveBeenCalledWith("/reviews/my", TOKEN)
    expect(spy.delete).toHaveBeenCalledWith("/reviews/review-1", TOKEN)
  })

  it("manages favorites", () => {
    favoriteApi.list()
    favoriteApi.add("hotel-1")
    favoriteApi.remove("hotel-1")

    expect(spy.get).toHaveBeenCalledWith("/favorites/my", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/favorites/hotel-1",
      undefined,
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/favorites/hotel-1", TOKEN)
  })

  it("marks notifications as read", () => {
    notificationApi.list()
    notificationApi.markRead("notification-1")
    notificationApi.markAllRead()

    expect(spy.get).toHaveBeenCalledWith("/notifications?page=1", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/notifications/notification-1/read",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/notifications/read-all",
      undefined,
      TOKEN,
    )
  })

  it("runs contact threads and messages", () => {
    contactApi.createThread("hotel-1", {
      subject: "Question",
      message: "Hello",
    })
    contactApi.listThreads()
    contactApi.getThread("thread-1")
    contactApi.sendMessage("thread-1", "Hi there")
    contactApi.updateStatus("thread-1", "CLOSED")

    expect(spy.post).toHaveBeenCalledWith(
      "/hotels/hotel-1/contact",
      { subject: "Question", message: "Hello" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/contact/threads", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/contact/threads/thread-1", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/contact/threads/thread-1/messages",
      { content: "Hi there" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/contact/threads/thread-1/status",
      { status: "CLOSED" },
      TOKEN,
    )
  })

  it("runs dispute workflows", () => {
    disputeApi.create({ bookingId: "b-1", reason: "Double charge" })
    disputeApi.listMine({ page: 1, pageSize: 10, status: "OPEN" })
    disputeApi.adminList({ page: 2, pageSize: 20 })
    disputeApi.markUnderReview("d-1")
    disputeApi.resolve("d-1", { resolution: "Refund issued" })
    disputeApi.close("d-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/disputes",
      { bookingId: "b-1", reason: "Double charge" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/disputes/mine?page=1&pageSize=10&status=OPEN",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/disputes?page=2&pageSize=20", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/disputes/d-1/review",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/disputes/d-1/resolve",
      { resolution: "Refund issued" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/disputes/d-1/close",
      undefined,
      TOKEN,
    )
  })
})

describe("managerApi", () => {
  it("manages the hotel record and its images", () => {
    managerApi.hotels()
    managerApi.createHotel({ name: "New Hotel" })
    managerApi.updateHotel("hotel-1", { name: "Renamed" })
    managerApi.deleteHotel("hotel-1")

    expect(spy.get).toHaveBeenCalledWith("/catalog/manager/hotels", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/catalog/hotels",
      { name: "New Hotel" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1",
      { name: "Renamed" },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/catalog/hotels/hotel-1", TOKEN)

    const files = [new File(["a"], "a.jpg"), new File(["b"], "b.jpg")]
    managerApi.addHotelImages("hotel-1", files)
    const [path, form, token] = spy.postForm.mock.calls[0]
    expect(path).toBe("/catalog/hotels/hotel-1/images")
    expect(token).toBe(TOKEN)
    expect((form as FormData).getAll("images")).toHaveLength(2)

    managerApi.setPrimaryHotelImage("hotel-1", "image-1")
    managerApi.removeHotelImage("hotel-1", "image-1")

    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/images/image-1/primary",
      undefined,
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/images/image-1",
      TOKEN,
    )
  })

  it("manages rooms, pricing and availability", () => {
    managerApi.createRoom("hotel-1", { name: "Deluxe" })
    managerApi.updateRoom("room-1", { price: 120 })
    managerApi.deleteRoom("room-1")
    managerApi.setPrimaryRoomImage("room-1", "image-1")
    managerApi.removeRoomImage("room-1", "image-1")
    managerApi.upsertSeasonalPricing("room-1", { season: "HIGH", price: 200 })
    managerApi.deleteSeasonalPricing("room-1", "pricing-1")
    managerApi.setAvailability("room-1", {
      dates: ["2026-05-01"],
      isAvailable: false,
    })
    managerApi.blockMaintenance({
      roomId: "room-1",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
    })

    expect(spy.post).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms",
      { name: "Deluxe" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/rooms/room-1",
      { price: 120 },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/catalog/rooms/room-1", TOKEN)
    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/images/image-1/primary",
      undefined,
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/images/image-1",
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/seasonal-pricing",
      { season: "HIGH", price: 200 },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/seasonal-pricing/pricing-1",
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/availability",
      { dates: ["2026-05-01"], isAvailable: false },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/catalog/maintenance/block",
      { roomId: "room-1", startDate: "2026-05-01", endDate: "2026-05-02" },
      TOKEN,
    )
  })

  it("drives the operations dashboard", () => {
    managerApi.stats()
    managerApi.action("booking-1", "confirm")
    managerApi.createWalkIn({ hotelId: "hotel-1" })
    managerApi.noShow("booking-1")
    managerApi.earlyCheckIn("booking-1", { fee: 20, reason: "early flight" })
    managerApi.lateCheckOut("booking-1", {
      actualCheckOut: "2026-05-04T18:00:00Z",
    })
    managerApi.getOperationalRooms("hotel-1")
    managerApi.updateRoomStatus("room-1", "CLEANING")

    expect(spy.get).toHaveBeenCalledWith("/bookings/dashboard/stats", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/confirm",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/walk-in",
      { hotelId: "hotel-1" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/no-show",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/early-checkin",
      { fee: 20, reason: "early flight" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/late-checkout",
      { actualCheckOut: "2026-05-04T18:00:00Z" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms/operational",
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/status",
      { status: "CLEANING" },
      TOKEN,
    )
  })

  it("handles stay requests, relocation and reviews", () => {
    managerApi.listStayRequests("hotel-1")
    managerApi.decideStayRequest("stay-1", {
      decision: "APPROVED",
      decisionNote: "ok",
    })
    managerApi.relocateRoom("booking-1", {
      oldRoomId: "room-1",
      newRoomId: "room-2",
      reason: "AC broken",
    })
    managerApi.listReviews("hotel-1", 2)
    managerApi.respondToReview("hotel-1", "review-1", "Thanks!")
    managerApi.deleteReviewResponse("hotel-1", "review-1")

    expect(spy.get).toHaveBeenCalledWith(
      "/bookings/hotels/hotel-1/stay-requests",
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/stay-requests/stay-1/decide",
      { decision: "APPROVED", decisionNote: "ok" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/bookings/booking-1/relocate-room",
      { oldRoomId: "room-1", newRoomId: "room-2", reason: "AC broken" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reviews?page=2",
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reviews/review-1/response",
      { response: "Thanks!" },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reviews/review-1/response",
      TOKEN,
    )
  })

  it("keeps the policy document in sync", () => {
    managerApi.getPolicy("hotel-1")
    managerApi.upsertPolicy("hotel-1", { checkInTime: "14:00" })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/policy",
      TOKEN,
    )
    expect(spy.put).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/policy",
      { checkInTime: "14:00" },
      TOKEN,
    )
  })

  it("maps assignStaff onto the staff creation payload", () => {
    managerApi.assignStaff("hotel-1", {
      email: "staff@example.com",
      userId: "user-9",
      role: "STAFF",
    })
    managerApi.assignStaff("hotel-1", { staffId: "staff-3", role: "MANAGER" })

    expect(spy.post).toHaveBeenNthCalledWith(
      1,
      "/manager/hotels/hotel-1/staff",
      { staffId: "user-9", email: "staff@example.com", role: "STAFF" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenNthCalledWith(
      2,
      "/manager/hotels/hotel-1/staff",
      { staffId: "staff-3", email: undefined, role: "MANAGER" },
      TOKEN,
    )
  })

  it("creates, promotes and removes staff accounts", () => {
    managerApi.createStaff("hotel-1", {
      fullName: "Staff One",
      email: "staff@example.com",
      password: "secret1",
    })
    managerApi.listStaff("hotel-1")
    managerApi.updateStaffRole("hotel-1", "staff-1", "MANAGER")
    managerApi.updateStaffStatus("hotel-1", "staff-1", false)
    managerApi.removeStaff("hotel-1", "staff-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/staff",
      {
        fullName: "Staff One",
        email: "staff@example.com",
        password: "secret1",
      },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/manager/hotels/hotel-1/staff", TOKEN)
    expect(spy.patch).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/staff/staff-1/role",
      { role: "MANAGER" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/staff/staff-1/status",
      { isActive: false },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/staff/staff-1",
      TOKEN,
    )
  })

  it("builds report queries and export URLs", () => {
    managerApi.reportOverview("hotel-1")
    managerApi.reportOccupancy("hotel-1")
    managerApi.reportRevenue("hotel-1")
    managerApi.reportRevenue("hotel-1", 12)
    managerApi.reportTrends("hotel-1")
    managerApi.reportTrends("hotel-1", 7)

    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/overview",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/occupancy",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/monthly-revenue?months=6",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/monthly-revenue?months=12",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/booking-trends?days=30",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/manager/hotels/hotel-1/reports/booking-trends?days=7",
      TOKEN,
    )
    expect(managerApi.exportReportUrl("hotel-1", "occupancy", "pdf")).toBe(
      `${API_BASE_URL}/manager/hotels/hotel-1/reports/occupancy?format=pdf&period=monthly`,
    )
    expect(
      managerApi.exportReportUrl("hotel-1", "revenue", "excel", "weekly"),
    ).toBe(
      `${API_BASE_URL}/manager/hotels/hotel-1/reports/revenue?format=excel&period=weekly`,
    )
  })
})

describe("staffApi", () => {
  it("reuses the manager endpoints for staff accounts", () => {
    staffApi.assignedHotels()
    staffApi.operationalRooms("hotel-1")
    staffApi.updateRoomStatus("room-1", "MAINTENANCE")

    expect(spy.get).toHaveBeenCalledWith("/catalog/manager/hotels", TOKEN)
    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms/operational",
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/catalog/rooms/room-1/status",
      { status: "MAINTENANCE" },
      TOKEN,
    )
  })
})

describe("adminApi", () => {
  it("reads the platform overview", () => {
    adminApi.overview()
    adminApi.occupancy()
    adminApi.revenue()

    expect(spy.get).toHaveBeenCalledWith("/admin/reports/overview", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/reports/occupancy", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/reports/revenue", TOKEN)
  })

  it("defaults report windows and honours overrides", () => {
    adminApi.monthlyRevenue()
    adminApi.monthlyRevenue(3)
    adminApi.bookingTrends()
    adminApi.bookingTrends(14)
    adminApi.mostBookedHotels()
    adminApi.mostBookedHotels(5)

    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/monthly-revenue?months=12",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/monthly-revenue?months=3",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/booking-trends?days=30",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/booking-trends?days=14",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/most-booked-hotels?limit=10",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/reports/most-booked-hotels?limit=5",
      TOKEN,
    )
  })

  it("lists platform collections with filters", () => {
    adminApi.users()
    adminApi.users({ role: "MANAGER" })
    adminApi.bookings({ status: "PENDING" })
    adminApi.hotels()
    adminApi.payments({ status: "PAID" })
    adminApi.reviews({ rating: "5" })
    adminApi.auditLogs({ actor: "admin-1" })

    expect(spy.get).toHaveBeenCalledWith("/admin/users", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/users?role=MANAGER", TOKEN)
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/bookings?status=PENDING",
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/admin/hotels", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/payments?status=PAID", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/reviews?rating=5", TOKEN)
    expect(spy.get).toHaveBeenCalledWith(
      "/admin/audit-logs?actor=admin-1",
      TOKEN,
    )
  })

  it("creates users and moderates hotels", () => {
    adminApi.createUser({
      fullName: "New",
      email: "n@b.com",
      password: "secret1",
    })
    adminApi.setUserActive("user-1", false)
    adminApi.setHotelStatus("hotel-1", "SUSPENDED")
    adminApi.approveHotel("hotel-1")
    adminApi.rejectHotel("hotel-1", "fake listing")
    adminApi.reassignManager("hotel-1", "manager-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/admin/users",
      { fullName: "New", email: "n@b.com", password: "secret1" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/admin/users/user-1/active",
      { isActive: false },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/admin/hotels/hotel-1/status",
      { status: "SUSPENDED" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/admin/hotels/hotel-1/approve",
      undefined,
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/admin/hotels/hotel-1/reject",
      { reason: "fake listing" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/admin/hotels/hotel-1/manager",
      { managerId: "manager-1" },
      TOKEN,
    )
  })

  it("manages coupons and platform settings", () => {
    adminApi.coupons()
    adminApi.createCoupon({ code: "SAVE10" })
    adminApi.updateCoupon("coupon-1", { code: "SAVE20" })
    adminApi.deleteCoupon("coupon-1")
    adminApi.settings()
    adminApi.upsertSetting("currency", { value: "ETB" })
    adminApi.deleteSetting("currency")

    expect(spy.get).toHaveBeenCalledWith("/admin/coupons", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/admin/coupons",
      { code: "SAVE10" },
      TOKEN,
    )
    expect(spy.patch).toHaveBeenCalledWith(
      "/admin/coupons/coupon-1",
      { code: "SAVE20" },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/admin/coupons/coupon-1", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/admin/settings", TOKEN)
    expect(spy.put).toHaveBeenCalledWith(
      "/admin/settings/currency",
      { value: "ETB" },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/admin/settings/currency", TOKEN)
  })

  it("builds admin report export URLs", () => {
    expect(adminApi.exportReportUrl("occupancy", "pdf")).toBe(
      `${API_BASE_URL}/admin/reports/occupancy?format=pdf&period=monthly`,
    )
    expect(adminApi.exportReportUrl("revenue", "excel", "yearly")).toBe(
      `${API_BASE_URL}/admin/reports/revenue?format=excel&period=yearly`,
    )
  })
})

describe("aiService", () => {
  it("talks to the assistant endpoints", () => {
    aiService.chat({ message: "Show me hotels in Gondar", language: "en" })
    aiService.voice({ audioBase64: "AAAA", language: "am" })
    aiService.conversations()
    aiService.conversation("conv-1")
    aiService.deleteConversation("conv-1")

    expect(spy.post).toHaveBeenCalledWith(
      "/ai/chat",
      { message: "Show me hotels in Gondar", language: "en" },
      TOKEN,
    )
    expect(spy.post).toHaveBeenCalledWith(
      "/ai/voice",
      { audioBase64: "AAAA", language: "am" },
      TOKEN,
    )
    expect(spy.get).toHaveBeenCalledWith("/ai/conversations", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/ai/conversations/conv-1", TOKEN)
    expect(spy.delete).toHaveBeenCalledWith("/ai/conversations/conv-1", TOKEN)
  })
})

describe("discoverApi", () => {
  it("reads destinations, heritage and nearby places", () => {
    discoverApi.destinations()
    discoverApi.destinations(10)
    discoverApi.heritage({ cityId: "city-1", limit: 5 })
    discoverApi.heritageForCity("city-1")
    discoverApi.place("place-1")
    discoverApi.sources()

    expect(spy.get).toHaveBeenCalledWith("/discover/destinations?limit=50")
    expect(spy.get).toHaveBeenCalledWith("/discover/destinations?limit=10")
    expect(spy.get).toHaveBeenCalledWith(
      "/discover/heritage?cityId=city-1&limit=5",
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/discover/cities/city-1/heritage?limit=30",
    )
    expect(spy.get).toHaveBeenCalledWith("/discover/places/place-1")
    expect(spy.get).toHaveBeenCalledWith("/discover/sources")
  })

  it("reads a city history and timeline", () => {
    discoverApi.history("city-1")
    discoverApi.timeline("city-1")

    expect(spy.get).toHaveBeenCalledWith("/discover/cities/city-1/history")
    expect(spy.get).toHaveBeenCalledWith(
      "/discover/cities/city-1/heritage/timeline",
    )
  })

  it("searches places and links them to hotels", () => {
    discoverApi.search({ q: "coffee", limit: 3 })
    discoverApi.emergency({ city: "Addis Ababa" })
    discoverApi.nearbyHeritage("hotel-1", { radiusKm: 5 })
    discoverApi.nearbyHotels("place-1", { radiusKm: 5, limit: 4 })

    expect(spy.get).toHaveBeenCalledWith("/discover/search?q=coffee&limit=3")
    expect(spy.get).toHaveBeenCalledWith("/discover/emergency?city=Addis+Ababa")
    expect(spy.get).toHaveBeenCalledWith(
      "/discover/hotels/hotel-1/nearby-heritage?radiusKm=5",
    )
    expect(spy.get).toHaveBeenCalledWith(
      "/discover/places/place-1/nearby-hotels?radiusKm=5&limit=4",
    )
  })
})

describe("tripApi", () => {
  const trip = {
    title: "Northern route",
    startDate: "2026-05-01",
    endDate: "2026-05-07",
  }

  it("creates and reads trips", async () => {
    spy.post.mockResolvedValueOnce({ id: "trip-1" })

    await expect(tripApi.create(trip)).resolves.toEqual({ id: "trip-1" })
    tripApi.list()
    tripApi.get("trip-1")

    expect(spy.post).toHaveBeenCalledWith("/trips", trip, TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/trips", TOKEN)
    expect(spy.get).toHaveBeenCalledWith("/trips/trip-1", TOKEN)
  })

  it("manages itinerary items and day proposals", () => {
    const item = {
      dayDate: "2026-05-02",
      itemType: "PLACE" as const,
      title: "Fasil Ghebbi",
    }
    tripApi.addItem("trip-1", item)
    tripApi.updateItem("trip-1", "item-1", { status: "DONE" })
    tripApi.removeItem("trip-1", "item-1")
    tripApi.buildDay("trip-1", {
      dayDate: "2026-05-02",
      duration: "FULL_DAY",
      startTime: "09:00",
    })

    expect(spy.post).toHaveBeenCalledWith("/trips/trip-1/items", item, TOKEN)
    expect(spy.patch).toHaveBeenCalledWith(
      "/trips/trip-1/items/item-1",
      { status: "DONE" },
      TOKEN,
    )
    expect(spy.delete).toHaveBeenCalledWith("/trips/trip-1/items/item-1", TOKEN)
    expect(spy.post).toHaveBeenCalledWith(
      "/trips/trip-1/build-day",
      { dayDate: "2026-05-02", duration: "FULL_DAY", startTime: "09:00" },
      TOKEN,
    )
  })

  it("encodes ids containing special characters", () => {
    tripApi.get("trip/1")
    tripApi.removeItem("trip/1", "item/1")

    expect(spy.get).toHaveBeenCalledWith("/trips/trip%2F1", TOKEN)
    expect(spy.delete).toHaveBeenCalledWith(
      "/trips/trip%2F1/items/item%2F1",
      TOKEN,
    )
  })
})

describe("downloadReportFile", () => {
  const fetchMock = jest.fn()
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock
  let clickSpy: jest.SpyInstance

  function reportResponse(
    overrides: {
      ok?: boolean
      disposition?: string | null
      text?: string
      failText?: boolean
    } = {},
  ) {
    const {
      ok = true,
      disposition = null,
      text = "",
      failText = false,
    } = overrides
    return {
      ok,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-disposition" ? disposition : null,
      },
      blob: async () => new Blob(["pdf-bytes"], { type: "application/pdf" }),
      text: failText
        ? () => Promise.reject(new Error("no body"))
        : async () => text,
    }
  }

  beforeEach(() => {
    fetchMock.mockReset()
    createObjectURL = jest.fn(() => "blob:report-1")
    revokeObjectURL = jest.fn()
    Reflect.set(window.URL, "createObjectURL", createObjectURL)
    Reflect.set(window.URL, "revokeObjectURL", revokeObjectURL)
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined)
    fetchMock.mockResolvedValue(reportResponse())
    Reflect.set(globalThis, "fetch", fetchMock)
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "fetch")
    Reflect.deleteProperty(window.URL, "createObjectURL")
    Reflect.deleteProperty(window.URL, "revokeObjectURL")
  })

  it("downloads with the API provided filename", async () => {
    fetchMock.mockResolvedValue(
      reportResponse({ disposition: 'attachment; filename="report.pdf"' }),
    )

    await downloadReportFile(
      `${API_BASE_URL}/manager/hotels/h1/reports/occupancy`,
      "fallback.pdf",
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/manager/hotels/h1/reports/occupancy`,
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    )
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy.mock.contexts[0]).toMatchObject({ download: "report.pdf" })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report-1")
    expect(document.body.querySelector("a")).toBeNull()
  })

  it("handles an unquoted filename in the disposition header", async () => {
    fetchMock.mockResolvedValue(
      reportResponse({ disposition: "attachment; filename=weekly.pdf" }),
    )

    await downloadReportFile(
      `${API_BASE_URL}/admin/reports/revenue`,
      "fallback.pdf",
    )

    expect(clickSpy.mock.contexts[0]).toMatchObject({ download: "weekly.pdf" })
  })

  it("falls back to the caller supplied filename", async () => {
    await downloadReportFile(
      `${API_BASE_URL}/admin/reports/revenue`,
      "admin-report-revenue-monthly.pdf",
    )

    expect(clickSpy.mock.contexts[0]).toMatchObject({
      download: "admin-report-revenue-monthly.pdf",
    })
  })

  it("sends no authorization header without a session token", async () => {
    useAuth.setState({ tokens: null })

    await downloadReportFile(
      `${API_BASE_URL}/admin/reports/revenue`,
      "fallback.pdf",
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/reports/revenue`,
      {
        headers: {},
      },
    )
  })

  it("throws the API error text when the export fails", async () => {
    fetchMock.mockResolvedValue(
      reportResponse({ ok: false, text: "quota exceeded" }),
    )

    await expect(
      downloadReportFile(`${API_BASE_URL}/x`, "fallback.pdf"),
    ).rejects.toThrow("Report export failed: quota exceeded")
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it("uses a generic message when the error body cannot be read", async () => {
    fetchMock.mockResolvedValue(reportResponse({ ok: false, failText: true }))

    await expect(
      downloadReportFile(`${API_BASE_URL}/x`, "fallback.pdf"),
    ).rejects.toThrow("Report export failed: Failed to download report")
  })

  it("manager exports request the requested window", async () => {
    await managerApi.downloadReport(
      "hotel-1",
      "monthly-revenue",
      "excel",
      "monthly",
      "2026-01-01",
      "2026-02-01",
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/manager/hotels/hotel-1/reports/monthly-revenue?format=excel&period=monthly&startDate=2026-01-01&endDate=2026-02-01`,
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    )
    expect(clickSpy.mock.contexts[0]).toMatchObject({
      download: "hotel-hotel-1-monthly-revenue-monthly.xlsx",
    })
  })

  it("admin exports default to a pdf", async () => {
    await adminApi.downloadReport("occupancy", "pdf")

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/reports/occupancy?format=pdf&period=monthly`,
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    )
    expect(clickSpy.mock.contexts[0]).toMatchObject({
      download: "admin-report-occupancy-monthly.pdf",
    })
  })
})
