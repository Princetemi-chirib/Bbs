const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
  console.log('Services (products) in DB:', products.length);
  console.log(JSON.stringify(products.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    adultPrice: String(p.adultPrice),
    isActive: p.isActive,
    displayOrder: p.displayOrder,
    beforeImage: p.beforeImage?.slice(0, 60) + (p.beforeImage?.length > 60 ? '...' : ''),
    afterImage: p.afterImage?.slice(0, 60) + (p.afterImage?.length > 60 ? '...' : ''),
  })), null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
