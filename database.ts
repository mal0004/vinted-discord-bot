import { Entity, Column, createConnection, Connection, PrimaryGeneratedColumn } from "typeorm";
import config from './config.json';

export const initialize = () => createConnection({
    type: 'postgres',
    host: 'localhost',
    database: config.dbName,
    username: config.dbUser,
    password: config.dbPassword,
    entities: [Subscription],
    synchronize: true,
});

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    url!: string;

    @Column({
        length:  32
    })
    channelId!: string;

    @Column()
    isActive!: boolean;

    @Column({
        type: 'timestamp with time zone',
        nullable: true
    })
    latestItemDate!: Date;

    @Column({
        type: 'timestamp with time zone'
    })
    createdAt!: Date;

}
