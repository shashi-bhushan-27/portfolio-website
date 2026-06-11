/**
 * Database seed script.
 *
 * This script has already been executed to populate the Neon database.
 * It is kept here for reference / re-seeding purposes.
 *
 * To re-run: npm run seed
 *
 * NOTE: The static data that was previously in constants.ts and
 * sample-articles.ts has been migrated into the database.
 * If you need to re-seed, restore those files or hardcode the data here.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectCount = await prisma.project.count();
  const milestoneCount = await prisma.milestone.count();
  const articleCount = await prisma.article.count();
  const archCount = await prisma.systemArchitecture.count();

  console.log('Current database state:');
  console.log(`  Projects: ${projectCount}`);
  console.log(`  Milestones: ${milestoneCount}`);
  console.log(`  Articles: ${articleCount}`);
  console.log(`  System Architectures: ${archCount}`);

  if (projectCount > 0) {
    console.log('\nDatabase already seeded. Skipping.');
    return;
  }

  console.log('\nDatabase is empty. Please restore seed data to re-seed.');
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
