import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images?: string[]; // array of URLs
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: string[]; // array of URLs
}

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Fetch all products for a vendor
  async getVendorProducts(vendorId: number) {
    return this.prisma.product.findMany({
      where: { vendorId },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create a product with images
  async createProduct(vendorId: number, dto: CreateProductDto) {
    // Generate slug from name
    let slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists, if so, append random number
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: slug,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        vendorId,
        images: {
          create: dto.images?.map((url) => ({ url })) || [],
        },
      },
      include: { images: true },
    });
  }

  // Get single product by ID
  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        vendor: { select: { fullName: true, email: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  // Get single product by SLUG
  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        vendor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  // Update product (vendor-only)
  async updateProduct(id: number, vendorId: number, dto: UpdateProductDto) {
    const existing = await this.getProductById(id);

    if (existing.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You cannot update a product that does not belong to you',
      );
    }

    // Generate new slug if name is being updated
    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if new slug exists
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        slug: slug,
        description: dto.description ?? existing.description,
        price: dto.price ?? existing.price,
        stock: dto.stock ?? existing.stock,
        images: dto.images
          ? {
              deleteMany: {},
              create: dto.images.map((url) => ({ url })),
            }
          : undefined,
      },
      include: { images: true },
    });
  }

  // Delete product (vendor-only)
  async deleteProduct(id: number, vendorId: number) {
    const existing = await this.getProductById(id);

    if (existing.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You cannot delete a product that does not belong to you',
      );
    }

    // Delete related images first
    await this.prisma.productImage.deleteMany({
      where: { productId: id },
    });

    // Then delete the product
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Fetch all products (for customers)
  async getAllProducts() {
    return this.prisma.product.findMany({
      where: { stock: { gt: 0 } }, // Only show products in stock
      include: {
        images: true,
        vendor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
