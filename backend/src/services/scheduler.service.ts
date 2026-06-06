import { prisma } from '../lib/prisma';
import { createNotification, notifyAcademyAdmins } from './notification.service';

export async function runDailyJobs() {
  await Promise.all([
    checkOverdueFees(),
    checkSubscriptionExpiry(),
    sendAttendanceReminders(),
  ]);
}

async function checkOverdueFees() {
  const now = new Date();
  const overdue = await prisma.feePayment.findMany({
    where: { status: 'PENDING', dueDate: { lt: now } },
    include: { student: { select: { firstName: true, lastName: true } } },
  });

  for (const payment of overdue) {
    await prisma.feePayment.update({
      where: { id: payment.id },
      data: { status: 'OVERDUE' },
    });

    const admins = await prisma.user.findMany({
      where: { academyId: payment.academyId, role: 'ACADEMY_ADMIN', isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        academyId: payment.academyId,
        userId: admin.id,
        type: 'FEE_OVERDUE',
        title: 'Fee Overdue',
        message: `Overdue fee for ${payment.student.firstName} ${payment.student.lastName} — Receipt ${payment.receiptNumber}`,
        metadata: { paymentId: payment.id },
      });
    }
  }
}

async function checkSubscriptionExpiry() {
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);

  const expiring = await prisma.academy.findMany({
    where: {
      subscriptionEnd: { lte: sevenDays, gte: new Date() },
      subscriptionStatus: 'ACTIVE',
    },
  });

  for (const academy of expiring) {
    const daysLeft = Math.ceil(
      (academy.subscriptionEnd!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    await notifyAcademyAdmins(
      academy.id,
      'SUBSCRIPTION_EXPIRY',
      'Subscription Expiring Soon',
      `Your ${academy.subscriptionPlan} plan expires in ${daysLeft} days.`
    );
  }

  const expired = await prisma.academy.findMany({
    where: { subscriptionEnd: { lt: new Date() }, subscriptionStatus: 'ACTIVE' },
  });

  for (const academy of expired) {
    await prisma.academy.update({
      where: { id: academy.id },
      data: { subscriptionStatus: 'EXPIRED' },
    });
    await notifyAcademyAdmins(
      academy.id,
      'SUBSCRIPTION_EXPIRY',
      'Subscription Expired',
      'Your subscription has expired. Please upgrade to continue using SAMS.'
    );
  }
}

async function sendAttendanceReminders() {
  const coaches = await prisma.coach.findMany({
    where: { isActive: true },
    include: { user: true, batchAssignments: true },
  });

  const today = new Date(new Date().toISOString().slice(0, 10));

  for (const coach of coaches) {
    if (!coach.batchAssignments.length) continue;

    const marked = await prisma.coachAttendance.findFirst({
      where: { coachId: coach.id, date: today },
    });

    if (!marked) {
      await createNotification({
        academyId: coach.academyId,
        userId: coach.userId,
        type: 'ATTENDANCE_REMINDER',
        title: 'Attendance Reminder',
        message: 'Please mark your attendance for today.',
      });
    }
  }
}
