import { apiClient } from "@/lib/axios"
import { catalogService } from "@/services/catalog.service"

interface Spies {
  get: jest.SpyInstance
  post: jest.SpyInstance
  delete: jest.SpyInstance
}

let spy: Spies

beforeEach(() => {
  spy = {
    get: jest
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: null } as never),
    post: jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: null } as never),
    delete: jest
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ data: null } as never),
  }
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("catalogService.searchHotels", () => {
  it("serialises scalar filters", async () => {
    spy.get.mockResolvedValue({ data: { data: [], total: 0 } } as never)

    const result = await catalogService.searchHotels({
      city: "Addis Ababa",
      page: 2,
      priceMin: 0,
      sort: "price_asc",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels?city=Addis+Ababa&page=2&priceMin=0&sort=price_asc",
    )
    expect(result).toEqual({ data: [], total: 0 })
  })

  it("joins array filters with commas", async () => {
    await catalogService.searchHotels({
      amenities: ["wifi", "pool"],
      country: "",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels?amenities=wifi%2Cpool",
    )
  })

  it("drops undefined and empty values", async () => {
    await catalogService.searchHotels({
      city: undefined,
      country: "",
      minRating: 4,
    })

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels?minRating=4")
  })

  it("adds no query string without params", async () => {
    await catalogService.searchHotels()
    await catalogService.searchHotels({})

    expect(spy.get).toHaveBeenNthCalledWith(1, "/catalog/hotels")
    expect(spy.get).toHaveBeenNthCalledWith(2, "/catalog/hotels")
  })
})

describe("catalogService room lookups", () => {
  it("accepts checkIn/checkOut", async () => {
    await catalogService.getHotelRooms("hotel-1", {
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms?checkIn=2026-05-01&checkOut=2026-05-04",
    )
  })

  it("falls back to startDate/endDate", async () => {
    await catalogService.getHotelRooms("hotel-1", {
      startDate: "2026-05-01",
      endDate: "2026-05-04",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms?checkIn=2026-05-01&checkOut=2026-05-04",
    )
  })

  it("prefers checkIn over startDate", async () => {
    await catalogService.getHotelRooms("hotel-1", {
      checkIn: "2026-07-01",
      startDate: "2026-05-01",
      checkOut: "2026-07-05",
      endDate: "2026-05-04",
    })

    expect(spy.get).toHaveBeenCalledWith(
      "/catalog/hotels/hotel-1/rooms?checkIn=2026-07-01&checkOut=2026-07-05",
    )
  })

  it("adds no query string without dates", async () => {
    await catalogService.getHotelRooms("hotel-1")
    await catalogService.getHotelRooms("hotel-1", {})

    expect(spy.get).toHaveBeenNthCalledWith(1, "/catalog/hotels/hotel-1/rooms")
    expect(spy.get).toHaveBeenNthCalledWith(2, "/catalog/hotels/hotel-1/rooms")
  })

  it("reads a single room", async () => {
    spy.get.mockResolvedValue({ data: { id: "room-1" } } as never)

    const room = await catalogService.getRoomById("room-1")

    expect(spy.get).toHaveBeenCalledWith("/catalog/rooms/room-1")
    expect(room).toEqual({ id: "room-1" })
  })
})

describe("catalogService catalog reads", () => {
  it("reads a hotel and its policy", async () => {
    await catalogService.getHotelById("hotel-1")
    await catalogService.getHotelPolicy("hotel-1")

    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels/hotel-1")
    expect(spy.get).toHaveBeenCalledWith("/catalog/hotels/hotel-1/policy")
  })

  it("reads cities with and without a country filter", async () => {
    await catalogService.getCities("ET")
    await catalogService.getCities()

    expect(spy.get).toHaveBeenCalledWith("/catalog/cities?country=ET")
    expect(spy.get).toHaveBeenCalledWith("/catalog/cities")
  })

  it("reads countries and amenities", async () => {
    await catalogService.getCountries()
    await catalogService.getAmenities()

    expect(spy.get).toHaveBeenCalledWith("/catalog/countries")
    expect(spy.get).toHaveBeenCalledWith("/catalog/amenities")
  })

  it("defaults the review page to one", async () => {
    await catalogService.getHotelReviews("hotel-1")
    await catalogService.getHotelReviews("hotel-1", 3)

    expect(spy.get).toHaveBeenCalledWith("/hotels/hotel-1/reviews?page=1")
    expect(spy.get).toHaveBeenCalledWith("/hotels/hotel-1/reviews?page=3")
  })
})

describe("catalogService favorites", () => {
  it("lists favorites", async () => {
    spy.get.mockResolvedValue({ data: [{ id: "hotel-1" }] } as never)

    const favorites = await catalogService.getFavorites()

    expect(spy.get).toHaveBeenCalledWith("/favorites/my")
    expect(favorites).toEqual([{ id: "hotel-1" }])
  })

  it("adds a favorite", async () => {
    await catalogService.addFavorite("hotel-1")

    expect(spy.post).toHaveBeenCalledWith("/favorites/hotel-1")
  })

  it("removes a favorite", async () => {
    await catalogService.removeFavorite("hotel-1")

    expect(spy.delete).toHaveBeenCalledWith("/favorites/hotel-1")
  })
})

describe("catalogService reviews", () => {
  it("lists the customer's reviews", async () => {
    spy.get.mockResolvedValue({ data: [{ id: "review-1" }] } as never)

    await catalogService.getMyReviews()

    expect(spy.get).toHaveBeenCalledWith("/reviews/my")
  })

  it("creates a review with photos", async () => {
    const payload = {
      hotelId: "hotel-1",
      bookingId: "booking-1",
      rating: 5,
      comment: "Excellent",
      photos: ["https://cdn/photo-1.jpg"],
    }
    spy.post.mockResolvedValue({ data: { id: "review-1" } } as never)

    const created = await catalogService.createReview(payload)

    expect(spy.post).toHaveBeenCalledWith("/reviews", payload)
    expect(created).toEqual({ id: "review-1" })
  })

  it("deletes a review", async () => {
    await catalogService.deleteReview("review-1")

    expect(spy.delete).toHaveBeenCalledWith("/reviews/review-1")
  })
})
