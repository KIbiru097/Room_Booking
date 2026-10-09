import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"
import { catalogService } from "@/services/catalog.service"
import {
  useAmenitiesQuery,
  useCitiesQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useFavoritesQuery,
  useHotelPolicyQuery,
  useHotelQuery,
  useHotelReviewsQuery,
  useHotelRoomsQuery,
  useHotelSearchQuery,
  useMyReviewsQuery,
  useToggleFavoriteMutation,
} from "@/hooks/use-catalog"

jest.mock("@/services/catalog.service", () => ({
  catalogService: {
    searchHotels: jest.fn(),
    getHotelById: jest.fn(),
    getHotelRooms: jest.fn(),
    getHotelPolicy: jest.fn(),
    getCities: jest.fn(),
    getAmenities: jest.fn(),
    getHotelReviews: jest.fn(),
    getFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    getMyReviews: jest.fn(),
    createReview: jest.fn(),
    deleteReview: jest.fn(),
  },
}))

const asMock = (fn: unknown): jest.Mock => fn as jest.Mock

const customer: User = {
  id: "user-1",
  email: "guest@example.com",
  fullName: "Guest User",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let client: QueryClient
let invalidateSpy: jest.SpyInstance

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  jest.clearAllMocks()
  invalidateSpy = jest.spyOn(client, "invalidateQueries")
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
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useHotelSearchQuery", () => {
  it("searches with the given params", async () => {
    asMock(catalogService.searchHotels).mockResolvedValue({
      data: [],
      total: 0,
    })

    const { result } = renderHook(
      () => useHotelSearchQuery({ city: "Addis Ababa" }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.searchHotels).toHaveBeenCalledWith({
      city: "Addis Ababa",
    })
    expect(
      client.getQueryData(["hotels", "search", { city: "Addis Ababa" }]),
    ).toEqual({
      data: [],
      total: 0,
    })
  })

  it("runs without params", async () => {
    asMock(catalogService.searchHotels).mockResolvedValue({
      data: [],
      total: 0,
    })

    const { result } = renderHook(() => useHotelSearchQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.searchHotels).toHaveBeenCalledWith(undefined)
  })
})

describe("useHotelQuery", () => {
  it("fetches the hotel details", async () => {
    asMock(catalogService.getHotelById).mockResolvedValue({
      id: "hotel-1",
      name: "Test Hotel",
    })

    const { result } = renderHook(() => useHotelQuery("hotel-1"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getHotelById).toHaveBeenCalledWith("hotel-1")
  })

  it("stays idle without an id", async () => {
    const { result } = renderHook(() => useHotelQuery(""), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getHotelById).not.toHaveBeenCalled()
  })
})

describe("useHotelRoomsQuery", () => {
  it("passes the stay dates through", async () => {
    asMock(catalogService.getHotelRooms).mockResolvedValue({ data: [] })

    const { result } = renderHook(
      () =>
        useHotelRoomsQuery("hotel-1", {
          startDate: "2026-05-01",
          endDate: "2026-05-04",
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getHotelRooms).toHaveBeenCalledWith("hotel-1", {
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    })
  })

  it("stays idle without a hotel id", async () => {
    const { result } = renderHook(() => useHotelRoomsQuery(""), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getHotelRooms).not.toHaveBeenCalled()
  })
})

describe("useHotelPolicyQuery", () => {
  it("fetches the policy", async () => {
    asMock(catalogService.getHotelPolicy).mockResolvedValue({
      checkInFrom: "14:00",
    })

    const { result } = renderHook(() => useHotelPolicyQuery("hotel-1"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getHotelPolicy).toHaveBeenCalledWith("hotel-1")
  })

  it("stays idle without a hotel id", async () => {
    const { result } = renderHook(() => useHotelPolicyQuery(""), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getHotelPolicy).not.toHaveBeenCalled()
  })
})

describe("useCitiesQuery", () => {
  it("forwards the optional country filter", async () => {
    asMock(catalogService.getCities).mockResolvedValue([{ id: "city-1" }])

    renderHook(() => useCitiesQuery("ET"), { wrapper })

    await waitFor(() =>
      expect(catalogService.getCities).toHaveBeenCalledWith("ET"),
    )
  })

  it("loads every city without a country", async () => {
    asMock(catalogService.getCities).mockResolvedValue([])

    renderHook(() => useCitiesQuery(), { wrapper })

    await waitFor(() =>
      expect(catalogService.getCities).toHaveBeenCalledWith(undefined),
    )
  })
})

describe("useAmenitiesQuery", () => {
  it("loads the amenity catalog", async () => {
    asMock(catalogService.getAmenities).mockResolvedValue([{ id: "wifi" }])

    const { result } = renderHook(() => useAmenitiesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getAmenities).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(["catalog", "amenities"])).toEqual([
      { id: "wifi" },
    ])
  })
})

describe("useHotelReviewsQuery", () => {
  it("defaults to the first page", async () => {
    asMock(catalogService.getHotelReviews).mockResolvedValue({
      data: [],
      total: 0,
    })

    const { result } = renderHook(() => useHotelReviewsQuery("hotel-1"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getHotelReviews).toHaveBeenCalledWith("hotel-1", 1)
  })

  it("forwards an explicit page", async () => {
    asMock(catalogService.getHotelReviews).mockResolvedValue({
      data: [],
      total: 0,
    })

    renderHook(() => useHotelReviewsQuery("hotel-1", 3), { wrapper })

    await waitFor(() =>
      expect(catalogService.getHotelReviews).toHaveBeenCalledWith("hotel-1", 3),
    )
  })

  it("stays idle without a hotel id", async () => {
    const { result } = renderHook(() => useHotelReviewsQuery(""), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getHotelReviews).not.toHaveBeenCalled()
  })
})

describe("useFavoritesQuery", () => {
  it("stays idle without a signed in user", async () => {
    const { result } = renderHook(() => useFavoritesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getFavorites).not.toHaveBeenCalled()
  })

  it("loads the wishlist for a signed in user", async () => {
    asMock(catalogService.getFavorites).mockResolvedValue([{ id: "hotel-1" }])
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => useFavoritesQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getFavorites).toHaveBeenCalledTimes(1)
  })
})

describe("useMyReviewsQuery", () => {
  it("stays idle without a signed in user", async () => {
    const { result } = renderHook(() => useMyReviewsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(catalogService.getMyReviews).not.toHaveBeenCalled()
  })

  it("loads the guest reviews for a signed in user", async () => {
    asMock(catalogService.getMyReviews).mockResolvedValue([{ id: "review-1" }])
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => useMyReviewsQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.getMyReviews).toHaveBeenCalledTimes(1)
  })
})

describe("useToggleFavoriteMutation", () => {
  it("rejects wishlisting for signed out visitors", async () => {
    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ hotelId: "hotel-1", isFavorite: false }),
    ).rejects.toThrow("Sign in required")

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(catalogService.addFavorite).not.toHaveBeenCalled()
    expect(catalogService.removeFavorite).not.toHaveBeenCalled()
  })

  it("adds a hotel that is not yet wishlisted", async () => {
    useAuth.setState({ user: customer })
    asMock(catalogService.addFavorite).mockResolvedValue(undefined)

    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })
    result.current.mutate({ hotelId: "hotel-1", isFavorite: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.addFavorite).toHaveBeenCalledWith("hotel-1")
    expect(catalogService.removeFavorite).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["favorites", "mine"],
    })
  })

  it("removes a wishlisted hotel", async () => {
    useAuth.setState({ user: customer })
    asMock(catalogService.removeFavorite).mockResolvedValue(undefined)

    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })
    result.current.mutate({ hotelId: "hotel-1", isFavorite: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.removeFavorite).toHaveBeenCalledWith("hotel-1")
    expect(catalogService.addFavorite).not.toHaveBeenCalled()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["favorites", "mine"],
    })
  })

  it("removes the hotel from the cache while the request is in flight", async () => {
    useAuth.setState({ user: customer })
    client.setQueryData(["favorites", "mine"], [
      { id: "hotel-a" },
      { id: "hotel-b" },
    ])
    const pending = deferred<void>()
    asMock(catalogService.removeFavorite).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })
    result.current.mutate({ hotelId: "hotel-a", isFavorite: true })

    await waitFor(() =>
      expect(client.getQueryData(["favorites", "mine"])).toEqual([
        { id: "hotel-b" },
      ]),
    )

    pending.resolve(undefined)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["favorites", "mine"],
    })
  })

  it("optimistically adds a hotel before the request resolves", async () => {
    useAuth.setState({ user: customer })
    client.setQueryData(["favorites", "mine"], [{ id: "hotel-a" }])
    const pending = deferred<void>()
    asMock(catalogService.addFavorite).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })
    result.current.mutate({ hotelId: "hotel-b", isFavorite: false })

    await waitFor(() =>
      expect(client.getQueryData(["favorites", "mine"])).toEqual([
        { id: "hotel-a" },
        { id: "hotel-b" },
      ]),
    )

    pending.resolve(undefined)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("rolls the cache back when the request fails", async () => {
    useAuth.setState({ user: customer })
    const original = [{ id: "hotel-a" }, { id: "hotel-b" }]
    client.setQueryData(["favorites", "mine"], original)
    const pending = deferred<void>()
    asMock(catalogService.removeFavorite).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useToggleFavoriteMutation(), {
      wrapper,
    })
    result.current.mutate({ hotelId: "hotel-a", isFavorite: true })

    await waitFor(() =>
      expect(client.getQueryData(["favorites", "mine"])).toEqual([
        { id: "hotel-b" },
      ]),
    )

    pending.reject(new Error("network down"))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(["favorites", "mine"])).toEqual(original)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["favorites", "mine"],
    })
  })
})

describe("useCreateReviewMutation", () => {
  it("posts the review and refreshes review caches", async () => {
    asMock(catalogService.createReview).mockResolvedValue({ id: "review-1" })

    const { result } = renderHook(() => useCreateReviewMutation(), { wrapper })
    result.current.mutate({
      hotelId: "hotel-1",
      rating: 5,
      comment: "Excellent",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.createReview).toHaveBeenCalledWith({
      hotelId: "hotel-1",
      rating: 5,
      comment: "Excellent",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reviews"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
  })
})

describe("useDeleteReviewMutation", () => {
  it("deletes the review and refreshes review caches", async () => {
    asMock(catalogService.deleteReview).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteReviewMutation(), { wrapper })
    result.current.mutate("review-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(catalogService.deleteReview).toHaveBeenCalledWith("review-1")
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reviews"] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["hotel"] })
  })
})
