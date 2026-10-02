import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, slug: true, title: true }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
