import { prisma } from "@/config";

export async function createBookingWithRoom(roomId: number, userId: number) {
  return await prisma.booking.create({
    data: {
      roomId,
      userId,
    },
    include: { Room: true },
  });
}
