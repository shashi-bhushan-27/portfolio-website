/**
 * Video Gallery seed script.
 *
 * Seeds the 5 YouTube videos into the Video table.
 * Run with: npx tsx prisma/seed-videos.ts
 *
 * Safe to re-run — uses upsert so no duplicates are created.
 * After seeding, manage content via: npx prisma studio
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const videos = [
  {
    youtubeId: 'AZGOPjcPa4Q',
    title: 'How Nodes Coordinate: Distributed Mutual Exclusion',
    description:
      'A deep dive into the algorithms that allow distributed processes to safely access shared resources — covering Ricart-Agrawala, token ring, and the trade-offs involved.',
    category: 'Distributed Systems',
    featured: true,
    order: 1,
  },
  {
    youtubeId: 'AL_iKbahDmc',
    title: 'Simulating Deadlocks: A Visual Guide',
    description:
      'A visual walkthrough of deadlock conditions in concurrent systems, with live simulations demonstrating hold-and-wait, circular wait, and prevention strategies.',
    category: 'Distributed Systems',
    featured: true,
    order: 2,
  },
  {
    youtubeId: '89wLAdcVVgA',
    title: "Why the Internet's Trust Model Failed in 2019",
    description:
      `An analysis of the BGP hijacking and certificate authority failures that exposed fundamental cracks in the internet's trust infrastructure, and what the community did about it.`,
    category: 'Network Security',
    featured: false,
    order: 3,
  },
  {
    youtubeId: 'AKs_NLxUtlg',
    title: 'Building a Simple RPC Mechanism with Python Sockets',
    description:
      'A hands-on implementation of a Remote Procedure Call system from scratch using raw Python sockets — demonstrating serialization, stub generation, and error handling.',
    category: 'Systems Programming',
    featured: false,
    order: 4,
  },
  {
    youtubeId: 'WVQm_yNHLUU',
    title: 'Node-RED Dashboard with MQTT & Docker',
    description:
      'Building a real-time IoT monitoring dashboard using Node-RED flows, an MQTT broker, and Docker Compose — end-to-end from broker setup to live visualization.',
    category: 'IoT & Infrastructure',
    featured: false,
    order: 5,
  },
];

async function main() {
  console.log('🎬 Seeding video gallery...\n');

  for (const video of videos) {
    const result = await prisma.video.upsert({
      where: { youtubeId: video.youtubeId },
      update: {
        title: video.title,
        description: video.description,
        category: video.category,
        featured: video.featured,
        order: video.order,
      },
      create: video,
    });
    console.log(`  ✓ ${result.title}`);
  }

  const total = await prisma.video.count();
  console.log(`\n✅ Done. Total videos in database: ${total}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
