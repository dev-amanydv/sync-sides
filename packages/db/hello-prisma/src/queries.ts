import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const user1Email = `aman${Date.now()}@siderec.io`;
  const user2Email = `friend${Date.now()}@siderec.io`;

  // Create two users
  const user1 = await prisma.user.create({
    data: {
      email: user1Email,
      fullname: 'Aman Yadav',
      username: 'amanydv',
      password: 'securepass123',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: user2Email,
      fullname: 'Friend User',
      username: 'friend',
      password: 'friendpass123',
    },
  });

  console.log(`Created users: ${user1.username}, ${user2.username}`);

  // Create a meeting between them
  const meeting = await prisma.meeting.create({
    data: {
      meetingId: `meeting_${Date.now()}`,
      hostId: 4,
      participants: {
        connect: [
          { id: 1 },
          { id: 4 }
        ]
      }
    },
  });

  console.log(`Created meeting: ${meeting.meetingId}`);

  // Fetch and print meeting history for user1
  const meetings = await prisma.meeting.findMany({
    where: {
      participants: {
        some: { id: user1.id },
      },
    },
    include: {
      host: true,
      participants: true,
    },
  });

  console.log(`Meetings for ${user1.username}:`, meetings);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
