export class CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images?: string[]; // URLs after upload
}
