import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrderService } from './order.service';
import type { CreateOrderDto } from './order.service'; // Change to import type
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: number; role: string };
}

@UseGuards(AuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    if (req.user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Only customers can create orders');
    }
    return await this.orderService.createOrder(req.user.userId, dto);
  }

  // Get customer's orders
  @Get('customer')
  async getCustomerOrders(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'CUSTOMER') {
      throw new ForbiddenException('Only customers can view their orders');
    }
    return await this.orderService.getCustomerOrders(req.user.userId);
  }

  // Get vendor's orders
  @Get('vendor')
  async getVendorOrders(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can view their orders');
    }
    return await this.orderService.getVendorOrders(req.user.userId);
  }

  // Get single order
  @Get(':id')
  async getOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return await this.orderService.getOrderById(Number(id), req.user.userId);
  }

  // Update order status (vendor only)
  @Put(':id/status')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    if (req.user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can update order status');
    }
    return await this.orderService.updateOrderStatus(
      Number(id),
      req.user.userId,
      status,
    );
  }
}
