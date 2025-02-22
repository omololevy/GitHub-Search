import prisma from "./prisma";

export async function verifyDatabaseConnection() {
  try {
    await prisma.$connect();
    // Try to query the database
    await prisma.user.count();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

export async function initializeDatabase() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('Database is empty, triggering initial population...');
      // Trigger the cron job manually
      const response = await fetch('/api/cron/update-rankings', {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
        }
      });
      const data = await response.json();
      console.log('Initial population result:', data);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
