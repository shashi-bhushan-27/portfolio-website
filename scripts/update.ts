import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const updated = await prisma.project.update({
    where: { slug: 'automl-assistant' },
    data: { liveUrl: 'https://shashibhushan27-automl.hf.space' }
  });
  console.log(`Updated project ${updated.title} liveUrl to ${updated.liveUrl}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
