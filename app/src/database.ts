import { DataSource } from 'typeorm';
import { Subscription } from './entities/Subscription';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'postgres',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    database: process.env.POSTGRES_DB ?? 'vinted_bot',
    username: process.env.POSTGRES_USER ?? 'root',
    password: process.env.POSTGRES_PASSWORD ?? 'password',
    entities: [Subscription],
    synchronize: true,
});

export async function initializeDatabase(): Promise<void> {
    // Connect to the default postgres database to create the app database if needed
    const bootstrap = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST ?? 'postgres',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
        database: 'postgres',
        username: process.env.POSTGRES_USER ?? 'root',
        password: process.env.POSTGRES_PASSWORD ?? 'password',
        entities: [],
    });

    try {
        await bootstrap.initialize();
        const dbName = process.env.POSTGRES_DB ?? 'vinted_bot';
        await bootstrap.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Base de données "${dbName}" créée.`);
    } catch {
        console.log('ℹ️  La base de données existe déjà.');
    } finally {
        await bootstrap.destroy();
    }

    await AppDataSource.initialize();
    console.log('✅ Connexion à la base de données établie.');
}
