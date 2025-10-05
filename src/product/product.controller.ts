import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { CreateProductDto, UpdateProductDto } from './product.service';
import { ProductService } from './product.service';
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: number; role: string };
}

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Get all products (public - no auth required)
  @Get()
  async findAll() {
    return await this.productService.getAllProducts();
  }

  // Get single product by SLUG (public - MUST be before :id route)
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return await this.productService.getProductBySlug(slug);
  }

  // Create product (vendor only)
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    if (req.user.role !== 'vendor') {
      throw new ForbiddenException('Only vendors can create products');
    }

    return await this.productService.createProduct(req.user.userId, dto);
  }

  // Get all products of the logged-in vendor
  @UseGuards(AuthGuard)
  @Get('vendor')
  async findAllByVendor(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'vendor') {
      throw new ForbiddenException('Only vendors can view their products');
    }
    return await this.productService.getVendorProducts(req.user.userId);
  }

  // Get single product by ID (public)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productService.getProductById(Number(id));
  }

  // Update product (vendor only, must own product)
  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    if (req.user.role !== 'vendor') {
      throw new ForbiddenException('Only vendors can update products');
    }
    return await this.productService.updateProduct(
      Number(id),
      req.user.userId,
      dto,
    );
  }

  // Delete product (vendor only, must own product)
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user.role !== 'vendor') {
      throw new ForbiddenException('Only vendors can delete products');
    }
    return await this.productService.deleteProduct(Number(id), req.user.userId);
  }
}
