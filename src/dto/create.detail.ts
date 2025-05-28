import { CreateItemDTO } from "./create.item";

export class createDetailDTO {
  date: string;
  currency: string;
  vendor: string;
  items: CreateItemDTO[];
  tax: number;
  total: number;
  image_url: string;
}