import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column } from 'typeorm';

@Entity()
export class Events {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  project_name!: string;

  @Column()
  version!: string;

  @Column()
  deployment_time!: string;

  @Column()
  url!: string;

  @Column()
  merge_hash!: string;

  @Column()
  deployment_user!: string;
}
