import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Item } from "./item.entity";

@Entity()
export class Detail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  currency: string;

  @Column()
  vendor: string;

  @OneToMany(() => Item, item => item.detail, { cascade: true })
  items: Item[];

  @Column('decimal', { precision: 10, scale: 2 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column()
  image_url: string;
}