import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";
import bookingsService from "@/services/bookings-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingsService.getBooking(userId);

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);

  const roomExists = await bookingsService.checkIfRoomIdExists(roomId);
  if (!roomExists) return res.sendStatus(httpStatus.NOT_FOUND);

  const roomIsFull = await bookingsService.checkIfRoomIsFull(roomId);
  if (roomIsFull) return res.sendStatus(httpStatus.FORBIDDEN);

  const userCanBook = await bookingsService.checkIfUserCanBook(userId);
  if (!userCanBook) return res.sendStatus(httpStatus.FORBIDDEN);

  const userHaveBooking = await bookingsService.checkIfUserAlreadyHaveBooking(userId);
  if (userHaveBooking) return res.sendStatus(httpStatus.FORBIDDEN);

  const booking = await bookingsService.postBooking(userId, roomId);
  return res.status(httpStatus.OK).send(booking);
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);
  const bookingId = Number(req.params.bookingId);

  const roomExists = await bookingsService.checkIfRoomIdExists(roomId);
  if (!roomExists) return res.sendStatus(httpStatus.NOT_FOUND);

  const roomIsFull = await bookingsService.checkIfRoomIsFull(roomId);
  if (roomIsFull) return res.sendStatus(httpStatus.FORBIDDEN);

  const userHaveBooking = await bookingsService.checkIfUserAlreadyHaveBooking(userId);
  if (!userHaveBooking) return res.sendStatus(httpStatus.FORBIDDEN);

  const userHaveBookingId = await bookingsService.checkIfUserHaveSpecificBookingId(userId, bookingId);
  if (!userHaveBookingId) return res.sendStatus(httpStatus.FORBIDDEN);

  const booking = await bookingsService.putBooking(roomId, bookingId);
  return res.status(httpStatus.OK).send(booking);
}
