import { PrismaClient, UserRole, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@sams.io' },
    update: {},
    create: {
      email: 'superadmin@sams.io',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const academy = await prisma.academy.upsert({
    where: { slug: 'demo-academy' },
    update: {},
    create: {
      name: 'Demo Sports Academy',
      slug: 'demo-academy',
      email: 'admin@demo-academy.com',
      phone: '+91 9876543210',
      address: '123 Sports Complex, Mumbai',
      subscriptionPlan: SubscriptionPlan.PRO,
      maxStudents: 200,
      maxCoaches: 20,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      attendanceRadiusM: 150,
      registrationFee: 500,
    },
  });

  const academyAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo-academy.com' },
    update: {},
    create: {
      email: 'admin@demo-academy.com',
      passwordHash,
      firstName: 'Academy',
      lastName: 'Admin',
      role: UserRole.ACADEMY_ADMIN,
      academyId: academy.id,
    },
  });

  const coachUser = await prisma.user.upsert({
    where: { email: 'coach@demo-academy.com' },
    update: {},
    create: {
      email: 'coach@demo-academy.com',
      passwordHash,
      firstName: 'Raj',
      lastName: 'Kumar',
      role: UserRole.COACH,
      academyId: academy.id,
    },
  });

  const coach = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      academyId: academy.id,
      userId: coachUser.id,
      phone: '+91 9876543211',
    },
  });

  const cricket = await prisma.sport.create({
    data: {
      academyId: academy.id,
      name: 'Cricket',
      description: 'Cricket training program',
      monthlyFee: 2000,
    },
  });

  const football = await prisma.sport.create({
    data: {
      academyId: academy.id,
      name: 'Football',
      description: 'Football training program',
      monthlyFee: 1500,
    },
  });

  const plans = await Promise.all(
    [
      { name: 'Monthly', duration: 1, multiplier: 1 },
      { name: 'Quarterly', duration: 3, multiplier: 2.8 },
      { name: 'Half Yearly', duration: 6, multiplier: 5.5 },
      { name: 'Yearly', duration: 12, multiplier: 10 },
    ].map((p) =>
      prisma.membershipPlan.create({
        data: { academyId: academy.id, ...p },
      })
    )
  );

  const batch = await prisma.batch.create({
    data: {
      academyId: academy.id,
      sportId: cricket.id,
      name: 'Morning Batch A',
      startTime: '06:00',
      endTime: '08:00',
      capacity: 25,
    },
  });

  await prisma.batchCoach.create({
    data: { batchId: batch.id, coachId: coach.id },
  });

  const attrs = await Promise.all(
    ['Batting', 'Bowling', 'Fielding', 'Fitness', 'Discipline'].map((name) =>
      prisma.performanceAttribute.create({
        data: { academyId: academy.id, name, sportId: cricket.id },
      })
    )
  );

  const students = await Promise.all(
    [
      { firstName: 'Arjun', lastName: 'Sharma', guardianName: 'Ravi Sharma' },
      { firstName: 'Priya', lastName: 'Patel', guardianName: 'Meera Patel' },
      { firstName: 'Vikram', lastName: 'Singh', guardianName: 'Harpreet Singh' },
    ].map((s) =>
      prisma.student.create({
        data: {
          academyId: academy.id,
          sportId: cricket.id,
          membershipPlanId: plans[0].id,
          batchId: batch.id,
          ...s,
          guardianPhone: '+91 9000000000',
          registrationFee: 500,
        },
      })
    )
  );

  console.log('Seed completed:');
  console.log('  Super Admin: superadmin@sams.io / Admin@123');
  console.log('  Academy Admin: admin@demo-academy.com / Admin@123');
  console.log('  Coach: coach@demo-academy.com / Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
