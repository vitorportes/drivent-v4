import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import {
  createBookingWithRoom,
  createEnrollmentWithAddress,
  createHotel,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeWithHotel,
  createUser,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 200 if user has a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBookingWithRoom(room.id, user.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        ...booking,
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        Room: {
          ...booking.Room,
          createdAt: booking.Room.createdAt.toISOString(),
          updatedAt: booking.Room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when roomId doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id);

      const body = { roomId: 0 };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    describe("when roomId exists", () => {
      it("should respond with status 403 if user doesnt have an enrollment", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);

        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);

        const body = { roomId: room.id };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 if user doesnt have a presencial hotel ticket", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);

        await createEnrollmentWithAddress(user);

        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);

        const body = { roomId: room.id };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 if user doesnt have a presencial hotel ticket paid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);

        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, "RESERVED");

        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);

        const body = { roomId: room.id };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      describe("when user have a presencial hotel ticket paid", () => {
        it("should respond with status 403 if user already have a booking", async () => {
          const user = await createUser();
          const token = await generateValidToken(user);

          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createTicketTypeWithHotel();
          await createTicket(enrollment.id, ticketType.id, "PAID");

          const hotel = await createHotel();
          const room = await createRoomWithHotelId(hotel.id);
          await createBookingWithRoom(room.id, user.id);

          const body = { roomId: room.id };

          const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

          expect(response.status).toBe(httpStatus.FORBIDDEN);
        });

        describe("when user have doesnt have a booking", () => {
          it("should respond with status 403 when room is full", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, "PAID");

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);

            const body = { roomId: room.id };

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

            expect(response.status).toBe(httpStatus.FORBIDDEN);
          });

          it("should respond with status 200 when successfully created a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, "PAID");

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);

            const body = { roomId: room.id };

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.id).toEqual(expect.any(Number));
          });
        });
      });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/0");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when roomId doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const booking = await createBookingWithRoom(room.id, user.id);

      const body = { roomId: 0 };

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    describe("when roomId exists", () => {
      it("should respond with status 403 when user doesnt have a bookingId", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);

        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);

        const booking = await createBookingWithRoom(room.id, (await createUser()).id);

        const body = { roomId: room.id };

        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      describe("when user have a bookingId", () => {
        it("should respond with status 403 when user doesnt have specific bookingId passed through params", async () => {
          const user = await createUser();
          const token = await generateValidToken(user);

          const hotel = await createHotel();
          const room = await createRoomWithHotelId(hotel.id);

          await createBookingWithRoom(room.id, user.id);
          const booking = await createBookingWithRoom(room.id, (await createUser()).id);

          const body = { roomId: room.id };

          const response = await server
            .put(`/booking/${booking.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(body);

          expect(response.status).toBe(httpStatus.FORBIDDEN);
        });

        describe("when user have this bookingId", () => {
          it("should respond with status 403 when room is full", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, "PAID");

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingWithRoom((await createRoomWithHotelId(hotel.id)).id, user.id);

            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);

            const body = { roomId: room.id };

            const response = await server
              .put(`/booking/${booking.id}`)
              .set("Authorization", `Bearer ${token}`)
              .send(body);

            expect(response.status).toBe(httpStatus.FORBIDDEN);
          });

          it("should respond with status 200 when successfully updated a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            await createTicket(enrollment.id, ticketType.id, "PAID");

            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const room2 = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingWithRoom(room.id, user.id);
            await createBookingWithRoom(room.id, (await createUser()).id);
            await createBookingWithRoom(room.id, (await createUser()).id);

            await createBookingWithRoom(room2.id, (await createUser()).id);
            await createBookingWithRoom(room2.id, (await createUser()).id);

            const body = { roomId: room2.id };

            const response = await server
              .put(`/booking/${booking.id}`)
              .set("Authorization", `Bearer ${token}`)
              .send(body);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.id).toEqual(expect.any(Number));
          });
        });
      });
    });
  });
});
