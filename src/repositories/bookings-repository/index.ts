import { prisma } from "@/config";

async function getBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    include: { Room: true },
  });
}

async function postBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: { userId, roomId },
  });
}

async function putBooking(roomId: number, bookingId: number) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { roomId },
  });
}

async function getRoom(roomId: number) {
  return prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
}

async function countBookingsForRoomId(roomId: number) {
  return prisma.booking.aggregate({
    _count: { id: true },
    where: { roomId },
  });
}

const bookingsRepository = {
  getBooking,
  postBooking,
  putBooking,
  getRoom,
  countBookingsForRoomId,
};

export default bookingsRepository;
