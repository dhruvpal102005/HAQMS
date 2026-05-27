const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    // 1. Fetch all doctors
    const doctors = await prisma.doctor.findMany();

    // 2. Fetch grouped statistics in parallel
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appointmentStats, queueStats] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: {
          id: true,
        },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: {
          createdAt: { gte: today },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // 3. Process grouped stats into lookup maps
    const appointmentMap = {};
    for (const stat of appointmentStats) {
      const docId = stat.doctorId;
      if (!appointmentMap[docId]) {
        appointmentMap[docId] = { total: 0, completed: 0, cancelled: 0 };
      }
      const count = stat._count.id;
      appointmentMap[docId].total += count;
      if (stat.status === 'COMPLETED') {
        appointmentMap[docId].completed = count;
      } else if (stat.status === 'CANCELLED') {
        appointmentMap[docId].cancelled = count;
      }
    }

    const queueMap = {};
    for (const stat of queueStats) {
      queueMap[stat.doctorId] = stat._count.id;
    }

    // 4. Construct report data without executing database queries or sleeping in a loop
    const reportData = doctors.map((doc) => {
      const stats = appointmentMap[doc.id] || { total: 0, completed: 0, cancelled: 0 };
      const todayQueueSize = queueMap[doc.id] || 0;
      const revenue = stats.completed * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: stats.total,
        completedAppointments: stats.completed,
        cancelledAppointments: stats.cancelled,
        todayQueueSize,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
