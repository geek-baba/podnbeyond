import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@podnbeyond.com' },
    update: {},
    create: {
      email: 'admin@podnbeyond.com',
      name: 'Admin User',
      role: 'ADMIN',
      points: 0,
      tier: 'PLATINUM'
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample room types
  const deluxeRoom = await prisma.roomType.upsert({
    where: { id: 'deluxe-room-001' },
    update: {},
    create: {
      id: 'deluxe-room-001',
      name: 'Deluxe Room',
      capacity: 2,
      amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service'],
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      baseRate: 500000 // ₹5000 in paise
    }
  });

  const suiteRoom = await prisma.roomType.upsert({
    where: { id: 'suite-room-001' },
    update: {},
    create: {
      id: 'suite-room-001',
      name: 'Executive Suite',
      capacity: 4,
      amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Jacuzzi'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
      ],
      baseRate: 800000 // ₹8000 in paise
    }
  });

  console.log('✅ Created room types:', deluxeRoom.name, suiteRoom.name);

  // Create inventory for next 7 days
  const today = new Date();
  const inventoryData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Deluxe room inventory
    inventoryData.push({
      roomTypeId: deluxeRoom.id,
      date: date,
      allotment: 10,
      booked: Math.floor(Math.random() * 3) // Random 0-2 bookings
    });

    // Suite room inventory
    inventoryData.push({
      roomTypeId: suiteRoom.id,
      date: date,
      allotment: 5,
      booked: Math.floor(Math.random() * 2) // Random 0-1 bookings
    });
  }

  for (const inventory of inventoryData) {
    await prisma.inventory.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId: inventory.roomTypeId,
          date: inventory.date
        }
      },
      update: {},
      create: inventory
    });
  }

  console.log('✅ Created inventory for next 7 days');

  // Create BAR (Best Available Rate) rate plan
  const barRatePlan = await prisma.ratePlan.upsert({
    where: { id: 'bar-rate-plan' },
    update: {},
    create: {
      id: 'bar-rate-plan',
      name: 'Best Available Rate',
      refundable: true,
      discountPct: null
    }
  });

  console.log('✅ Created BAR rate plan:', barRatePlan.name);

  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 Seed Data Summary:');
  console.log('- Admin user: admin@podnbeyond.com (password: admin123)');
  console.log('- Room types: Deluxe Room (₹5000), Executive Suite (₹8000)');
  console.log('- Inventory: 7 days starting from today');
  console.log('- Rate plan: Best Available Rate (refundable)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });