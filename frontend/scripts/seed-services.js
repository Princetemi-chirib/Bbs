const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const services = [
  // General Services
  {
    title: 'Classic Haircut / Beardcut Services',
    description: 'Professional precision cuts tailored to your face shape and personal style preferences.',
    adultPrice: 12000,
    kidsPrice: 6000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_gmkfwrgmkfwrgmkf.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_gmkfwrgmkfwrgmkf.png',
    isActive: true,
    displayOrder: 1,
  },
  {
    title: 'Dreadlock Service',
    description: 'Professional dreadlock installation, maintenance, and styling for authentic looks.',
    adultPrice: 32000,
    kidsPrice: 20000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_xg78zjxg78zjxg78.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_xg78zjxg78zjxg78.png',
    isActive: true,
    displayOrder: 2,
  },
  {
    title: 'Dreadlocks Maintenance Service',
    description: 'Comprehensive maintenance for existing hairstyles and treatments.',
    adultPrice: 17000,
    kidsPrice: 11500,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_75j3pr75j3pr75j3.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_75j3pr75j3pr75j3.png',
    isActive: true,
    displayOrder: 3,
  },
  {
    title: 'Hair Growth / Hair-care Treatment Service',
    description: 'Deep conditioning and scalp treatments to restore health and natural shine.',
    adultPrice: 8500,
    kidsPrice: 5000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_jn8kljjn8kljjn8k.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_jn8kljjn8kljjn8k.png',
    isActive: true,
    displayOrder: 4,
  },
  {
    title: 'Hair Braiding Service',
    description: 'Creative and traditional braiding styles crafted with precision and artistry.',
    adultPrice: 16500,
    kidsPrice: 10000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_14n0uy14n0uy14n0.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_14n0uy14n0uy14n0.png',
    isActive: true,
    displayOrder: 5,
  },
  {
    title: 'Hair Tinting Service',
    description: 'Professional hair coloring and tinting services for a vibrant new look.',
    adultPrice: 18500,
    kidsPrice: 12000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_i5apbvi5apbvi5ap.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_i5apbvi5apbvi5ap.png',
    isActive: true,
    displayOrder: 6,
  },
  {
    title: 'Nailcut Service',
    description: 'Complete nail grooming service including cutting, shaping, and cuticle care.',
    adultPrice: 10000,
    kidsPrice: 5000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_azh7o4azh7o4azh7.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_azh7o4azh7o4azh7.png',
    isActive: true,
    displayOrder: 7,
  },
  {
    title: 'Shaving Service',
    description: 'Professional shaving service with premium grooming techniques for a smooth, comfortable experience.',
    adultPrice: 5500,
    kidsPrice: 5500,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_fg5jiifg5jiifg5j.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/Gemini_Generated_Image_fg5jiifg5jiifg5j.png',
    isActive: true,
    displayOrder: 8,
  },
  {
    title: 'Shaving+dyeing service',
    description: 'Professional shaving and dyeing service for a complete grooming transformation.',
    adultPrice: 10000,
    kidsPrice: 10000,
    category: 'GENERAL',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/11/IMG_2841.jpeg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/11/IMG_2841.jpeg',
    isActive: true,
    displayOrder: 9,
  },
  // Hair Loss Recovery Plans
  {
    title: '1 Month Hair Loss Recovery Plan',
    description: 'Comprehensive 1-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 30000,
    kidsPrice: 30000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    isActive: true,
    displayOrder: 10,
  },
  {
    title: '2 Month Hair Loss Recovery Plan',
    description: 'Extended 2-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 55000,
    kidsPrice: 55000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    isActive: true,
    displayOrder: 11,
  },
  {
    title: '3 Month Hair Loss Recovery Plan',
    description: 'Comprehensive 3-month manual hair loss recovery treatment with guaranteed results.',
    adultPrice: 80000,
    kidsPrice: 80000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/loss-1.jpg',
    isActive: true,
    displayOrder: 12,
  },
  {
    title: 'Original Hairpiece Fibre Installation',
    description: 'Professional hairpiece fibre installation for natural-looking hair restoration.',
    adultPrice: 50000,
    kidsPrice: 50000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-02-at-1.47.34-AM.jpeg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-02-at-1.47.34-AM.jpeg',
    isActive: true,
    displayOrder: 13,
  },
  {
    title: 'Original Hairpiece Wig Installation',
    description: 'Original Premium hairpiece wig installation service for complete hair transformation.',
    adultPrice: 180000,
    kidsPrice: 180000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/10/57137ac7-1c26-450c-9744-f6b764a8b984.jpeg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/10/57137ac7-1c26-450c-9744-f6b764a8b984.jpeg',
    isActive: true,
    displayOrder: 14,
  },
  {
    title: 'Original Hairpiece Replacement Installation',
    description: 'Advanced hair replacement installation for permanent hair restoration solutions.',
    adultPrice: 30000,
    kidsPrice: 30000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/bfr.jpeg',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/bfr.jpeg',
    isActive: true,
    displayOrder: 15,
  },
  {
    title: 'Hairpiece Installation Maintenance',
    description: 'Professional maintenance service for existing artificial hair installations.',
    adultPrice: 15000,
    kidsPrice: 15000,
    category: 'RECOVERY',
    beforeImage: 'https://bbslimited.online/wp-content/uploads/2025/09/unnamed.png',
    afterImage: 'https://bbslimited.online/wp-content/uploads/2025/09/unnamed.png',
    isActive: true,
    displayOrder: 16,
  },
];

async function main() {
  console.log('🌱 Starting to seed services...\n');

  for (const service of services) {
    try {
      // Check if service already exists
      const existing = await prisma.product.findFirst({
        where: {
          title: service.title,
          category: service.category,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${service.title}" - already exists`);
        continue;
      }

      const created = await prisma.product.create({
        data: service,
      });

      console.log(`✅ Created: "${service.title}" (${service.category}) - ₦${service.adultPrice}`);
    } catch (error) {
      console.error(`❌ Error creating "${service.title}":`, error.message);
    }
  }

  console.log('\n✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
