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

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST mancante. Impossibile inviare la email.');
    return;
  }

  if (!to || (Array.isArray(to) && to.length === 0)) {
     return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Task Manager" <noreply@example.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });
    console.log('Email inviata: %s', info.messageId);
  } catch (error) {
    console.error('Errore durante l\'invio della mail:', error);
  }
};

export const sendTaskModificationEmail = async (
  email: string | string[],
  taskName: string,
  projectId: string,
  taskId: string,
  username?: string,
  changedFields?: string[]
) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const taskUrl = `${appUrl}/projects/${projectId}/task/${taskId}`;

  const subject = `Aggiornamento Task: ${taskName}`;

  let changesHtml = '';
  if (changedFields && changedFields.length > 0) {
    changesHtml = `
      <h3>Dettaglio Modifiche:</h3>
      <ul>
        ${changedFields.map(field => `<li>${field}</li>`).join('')}
      </ul>
    `;
  }

  const userHtml = username ? `<p><strong>Modificato da:</strong> ${username}</p>` : '';

  const html = `
    <h2>Il task "${taskName}" è stato modificato</h2>
    ${userHtml}
    <p>Sono state apportate delle modifiche al task o alle sue informazioni.</p>
    ${changesHtml}
    <p><a href="${taskUrl}">Clicca qui per visualizzare il task aggiornato</a></p>
  `;

  await sendEmail(email, subject, html);
};

export const sendTaskStartDateEmail = async (
  email: string | string[],
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
  email: string | string[],
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
