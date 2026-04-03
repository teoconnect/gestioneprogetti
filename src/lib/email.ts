import nodemailer from 'nodemailer';

import SMTPTransport from 'nodemailer/lib/smtp-transport';

const transportConfig: SMTPTransport.Options = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
};

if (process.env.SMTP_USER || process.env.SMTP_PASS) {
  transportConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

const transporter = nodemailer.createTransport(transportConfig);

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST mancante. Impossibile inviare la email.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Task Manager" <noreply@example.com>',
      to,
      subject,
      html,
    });
    console.log('Email inviata: %s', info.messageId);
  } catch (error) {
    console.error('Errore durante l\'invio della mail:', error);
  }
};

export const sendTaskModificationEmail = async (
  email: string,
  taskName: string,
  projectId: string,
  taskId: string
) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/projects/${projectId}/task/${taskId}`;

  const subject = `Aggiornamento Task: ${taskName}`;
  const html = `
    <h2>Il task "${taskName}" è stato modificato</h2>
    <p>Sono state apportate delle modifiche al task o alle sue informazioni.</p>
    <p><a href="${taskUrl}">Clicca qui per visualizzare il task aggiornato</a></p>
  `;

  await sendEmail(email, subject, html);
};

export const sendTaskStartDateEmail = async (
  email: string,
  taskName: string,
  projectId: string,
  taskId: string
) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/projects/${projectId}/task/${taskId}`;

  const subject = `Inizio Task: ${taskName}`;
  const html = `
    <h2>Promemoria: Inizio Task</h2>
    <p>Il task <strong>"${taskName}"</strong> è programmato per iniziare oggi.</p>
    <p><a href="${taskUrl}">Clicca qui per visualizzare il task</a></p>
  `;

  await sendEmail(email, subject, html);
};

export const sendTaskEndDateEmail = async (
  email: string,
  taskName: string,
  projectId: string,
  taskId: string
) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/projects/${projectId}/task/${taskId}`;

  const subject = `Scadenza Task: ${taskName}`;
  const html = `
    <h2>Promemoria: Scadenza Task</h2>
    <p>Il task <strong>"${taskName}"</strong> è programmato per terminare oggi.</p>
    <p><a href="${taskUrl}">Clicca qui per visualizzare il task</a></p>
  `;

  await sendEmail(email, subject, html);
};
