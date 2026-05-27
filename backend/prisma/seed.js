const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HAQMS database...');

  // 1. Clean existing records
  await prisma.queueToken.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash default password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@haqms.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const receptionUser = await prisma.user.create({
    data: {
      email: 'reception1@haqms.com',
      password: hashedPassword,
      name: 'Sarah receptionist',
      role: 'RECEPTIONIST',
    },
  });

  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'doctor1@haqms.com',
      password: hashedPassword,
      name: 'Dr. Gregory House',
      role: 'DOCTOR',
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'doctor2@haqms.com',
      password: hashedPassword,
      name: 'Dr. Stephen Strange',
      role: 'DOCTOR',
    },
  });

  console.log('Users created successfully.');

  // 4. Create Doctor Records
  const doctor1 = await prisma.doctor.create({
    data: {
      name: 'Dr. Gregory House',
      email: 'doctor1@haqms.com',
      specialization: 'Diagnostic Medicine',
      department: 'Internal Medicine',
      consultationFee: 150,
      experience: 20,
      shiftStart: '09:00',
      shiftEnd: '17:00',
      userId: doctorUser1.id,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      name: 'Dr. Stephen Strange',
      email: 'doctor2@haqms.com',
      specialization: 'Neurosurgery',
      department: 'Surgery',
      consultationFee: 500,
      experience: 15,
      shiftStart: '08:00',
      shiftEnd: '16:00',
      userId: doctorUser2.id,
    },
  });

  console.log('Doctors created successfully.');

  // 5. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      name: 'Clark Kent',
      email: 'clark@dailyplanet.com',
      phoneNumber: '555-0100',
      age: 33,
      gender: 'Male',
      medicalHistory: null, // Null to test the blank medical history UI crash!
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'Bruce Wayne',
      email: 'bruce@wayne.com',
      phoneNumber: '555-0199',
      age: 35,
      gender: 'Male',
      medicalHistory: null, // Null to test the blank medical history UI crash!
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: 'Diana Prince',
      email: 'diana@themyscira.gov',
      phoneNumber: '555-0120',
      age: 30,
      gender: 'Female',
      medicalHistory: 'No major concerns, athletic build',
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      name: 'Peter Parker',
      email: 'peter@dailybugle.com',
      phoneNumber: '555-0150',
      age: 20,
      gender: 'Male',
      medicalHistory: 'Asthma during childhood, otherwise healthy',
    },
  });

  console.log('Patients created successfully.');

  // 6. Create Appointments
  const today = new Date();
  const appointment1Date = new Date(today);
  appointment1Date.setHours(10, 0, 0, 0);

  const appointment2Date = new Date(today);
  appointment2Date.setHours(11, 30, 0, 0);

  const appointment3Date = new Date(today);
  appointment3Date.setHours(14, 0, 0, 0);

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor1.id,
      appointmentDate: appointment1Date,
      reason: 'Chronic limb weakness evaluation',
      status: 'PENDING',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      appointmentDate: appointment2Date,
      reason: 'Regular corporate medical physical',
      status: 'PENDING',
    },
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patient4.id,
      doctorId: doctor2.id,
      appointmentDate: appointment3Date,
      reason: 'Post-operative neurological monitoring',
      status: 'COMPLETED',
    },
  });

  console.log('Appointments created successfully.');

  // 7. Create Queue Tokens
  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      patientId: patient3.id,
      doctorId: doctor1.id,
      appointmentId: appointment1.id,
      status: 'WAITING',
    },
  });

  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      patientId: patient4.id,
      doctorId: doctor2.id,
      appointmentId: appointment3.id,
      status: 'COMPLETED',
    },
  });

  console.log('Queue tokens created successfully.');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
