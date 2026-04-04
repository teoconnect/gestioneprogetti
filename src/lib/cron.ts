import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendTaskStartDateEmail, sendTaskEndDateEmail } from './email';

const prisma = new PrismaClient();

export const initCronJobs = () => {
  // Eseguiamo il cron job ogni giorno a mezzanotte
  cron.schedule('0 0 * * *', async () => {
    console.log('Esecuzione cron job notifiche giornaliere...');

    // Lavoriamo esclusivamente con l'UTC per evitare problemi di fuso orario
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    try {
      // Troviamo i task che INIZIANO oggi e hanno le notifiche attivate
      const tasksStartingToday = await prisma.task.findMany({
        where: {
          notificationsEnabled: true,
          notificationEmail: { not: null },
          startDate: {
            gte: today,
            lte: endOfToday,
          },
        },
      });

      for (const task of tasksStartingToday) {
        if (task.notificationEmail) {
          await sendTaskStartDateEmail(
            task.notificationEmail,
            task.name,
            task.projectId,
            task.id
          );
        }
      }

      // Troviamo i task che FINISCONO oggi e hanno le notifiche attivate
      const tasksEndingToday = await prisma.task.findMany({
        where: {
          notificationsEnabled: true,
          notificationEmail: { not: null },
          endDate: {
            gte: today,
            lte: endOfToday,
          },
        },
      });

      for (const task of tasksEndingToday) {
        if (task.notificationEmail) {
          await sendTaskEndDateEmail(
            task.notificationEmail,
            task.name,
            task.projectId,
            task.id
          );
        }
      }

      console.log('Cron job notifiche giornaliere completato con successo.');
    } catch (error) {
      console.error('Errore durante il cron job notifiche giornaliere:', error);
    }
  });
};
