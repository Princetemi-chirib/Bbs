/**
 * Updates all product (service) image URLs from bbslimited.online to
 * https://whitesmoke-jackal-101083.hostingersite.com
 *
 * Run from frontend folder: node scripts/update-product-image-urls.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const OLD_DOMAIN = 'bbslimited.online';
const NEW_BASE = 'https://whitesmoke-jackal-101083.hostingersite.com';

function replaceImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // Replace any protocol + bbslimited.online with new base (keep path)
  return url
    .replace(/https?:\/\/bbslimited\.online\/?/gi, NEW_BASE.replace(/\/$/, '') + '/')
    .replace(/bbslimited\.online/gi, 'whitesmoke-jackal-101083.hostingersite.com');
}

async function main() {
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const p of products) {
    const newBefore = replaceImageUrl(p.beforeImage);
    const newAfter = replaceImageUrl(p.afterImage);
    if (newBefore !== p.beforeImage || newAfter !== p.afterImage) {
      await prisma.product.update({
        where: { id: p.id },
        data: { beforeImage: newBefore, afterImage: newAfter },
      });
      updated++;
      console.log('Updated:', p.title);
    }
  }

  console.log('\nDone. Products updated:', updated, 'of', products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
