export class UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[]; // Replace with new images
}
