import { notFoundError } from "@/errors";
import bookingsRepository from "@/repositories/bookings-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function getBooking(userId: number) {
  const booking = await bookingsRepository.getBooking(userId);

  if (!booking) throw notFoundError();

  return booking;
}

async function postBooking(userId: number, roomId: number) {
  const booking = await bookingsRepository.postBooking(userId, roomId);
  return booking;
}

async function putBooking(roomId: number, bookingId: number) {
  const booking = await bookingsRepository.putBooking(roomId, bookingId);
  return booking;
}

async function checkIfRoomIdExists(roomId: number) {
  const room = await bookingsRepository.getRoom(roomId);

  if (!room) return false;

  return true;
}

async function checkIfRoomIsFull(roomId: number) {
  const room = await bookingsRepository.getRoom(roomId);
  const bookingsCountForRoom = await bookingsRepository.countBookingsForRoomId(roomId);

  if (room.capacity > bookingsCountForRoom._count.id) return false;

  return true;
}

async function checkIfUserCanBook(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    return false;
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    return false;
  }

  if (ticket.status !== "PAID" || ticket.TicketType.isRemote === true || ticket.TicketType.includesHotel === false) {
    return false;
  }

  return true;
}

async function checkIfUserAlreadyHaveBooking(userId: number) {
  const booking = await bookingsRepository.getBooking(userId);

  if (!booking) return false;

  return true;
}

async function checkIfUserHaveSpecificBookingId(userId: number, bookingId: number) {
  const booking = await bookingsRepository.getBooking(userId);

  if (booking.id === bookingId) return true;

  return false;
}

const bookingsService = {
  getBooking,
  postBooking,
  putBooking,
  checkIfRoomIdExists,
  checkIfRoomIsFull,
  checkIfUserCanBook,
  checkIfUserAlreadyHaveBooking,
  checkIfUserHaveSpecificBookingId,
};

export default bookingsService;
