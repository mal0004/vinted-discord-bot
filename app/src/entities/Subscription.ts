import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    url!: string;

    @Column({ length: 32 })
    channelId!: string;

    @Column()
    isActive!: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    latestItemDate!: Date | null;

    @Column({ type: 'timestamp with time zone' })
    createdAt!: Date;
}
