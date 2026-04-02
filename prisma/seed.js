// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Inizio il seeding del database...');

  // Cancella dati esistenti
  await prisma.taskItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  // Dati temporali di base
  const today = new Date();

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // 1. Progetto Web App
  const project1 = await prisma.project.create({
    data: {
      code: 'PRJ-WEB-01',
      name: 'Rifacimento Portale Aziendale',
      description: 'Sviluppo del nuovo portale web con Next.js e Tailwind CSS',
      status: 'active',
      tasks: {
        create: [
          {
            name: 'Analisi dei requisiti',
            description: 'Raccolta specifiche dal cliente e definizione architettura',
            startDate: today,
            endDate: addDays(today, 5),
            status: 'COMPLETED',
            progress: 100,
            color: '#10b981', // green
            items: {
              create: [
                {
                  type: 'text',
                  name: 'Documento Requisiti',
                  value: 'Specifiche_V1.pdf'
                }
              ]
            }
          },
          {
            name: 'Design UI/UX',
            description: 'Creazione mockup e prototipi interattivi su Figma',
            startDate: addDays(today, 5),
            endDate: addDays(today, 12),
            status: 'IN_PROGRESS',
            progress: 60,
            color: '#3b82f6', // blue
            items: {
              create: [
                {
                  type: 'text',
                  name: 'Link Figma',
                  value: 'https://figma.com/file/xyz'
                },
                {
                  type: 'number',
                  name: 'Schermate Approvate',
                  value: '8'
                }
              ]
            }
          },
          {
            name: 'Sviluppo Frontend',
            description: 'Implementazione interfacce in React/Next.js',
            startDate: addDays(today, 12),
            endDate: addDays(today, 25),
            status: 'TODO',
            progress: 0,
            color: '#f59e0b', // amber
          },
          {
            name: 'Sviluppo Backend API',
            description: 'Creazione endpoints Node.js e setup Prisma',
            startDate: addDays(today, 10),
            endDate: addDays(today, 20),
            status: 'IN_PROGRESS',
            progress: 30,
            color: '#8b5cf6', // purple
          },
          {
            name: 'Testing e QA',
            description: 'Test end-to-end e risoluzione bug',
            startDate: addDays(today, 25),
            endDate: addDays(today, 30),
            status: 'TODO',
            progress: 0,
            color: '#ef4444', // red
          }
        ]
      }
    }
  });

  // 2. Progetto Marketing
  const project2 = await prisma.project.create({
    data: {
      code: 'MKT-CMP-24',
      name: 'Campagna Marketing Q3',
      description: 'Lancio nuovi prodotti sui canali social e newsletter',
      status: 'active',
      tasks: {
        create: [
          {
            name: 'Pianificazione Budget',
            startDate: addDays(today, -10),
            endDate: addDays(today, -5),
            status: 'COMPLETED',
            progress: 100,
            color: '#10b981',
            items: {
              create: [
                {
                  type: 'number',
                  name: 'Budget Stanziato (€)',
                  value: '15000'
                }
              ]
            }
          },
          {
            name: 'Creazione Contenuti',
            description: 'Shooting fotografico e stesura copy',
            startDate: addDays(today, -5),
            endDate: addDays(today, 5),
            status: 'IN_PROGRESS',
            progress: 80,
            color: '#3b82f6'
          },
          {
            name: 'Lancio Ads Facebook/Google',
            startDate: addDays(today, 5),
            endDate: addDays(today, 20),
            status: 'TODO',
            progress: 0,
            color: '#f59e0b'
          }
        ]
      }
    }
  });

  console.log('Seeding completato con successo!');
  console.log('Creati progetti:', project1.code, ',', project2.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
