import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrderDto {
  items: Array<{
    productId: number;
    quantity: number;
    vendorId: number;
  }>;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingCountry: string;
  paymentMethod: string;
}

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(customerId: number, dto: CreateOrderDto) {
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let totalAmount = 0;
    const orderItems: Array<{
      productId: number;
      quantity: number;
      price: number;
      vendorId: number;
    }> = []; // Add type annotation here

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        vendorId: item.vendorId,
      });

      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity },
      });
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount,
        shippingAddress: dto.shippingAddress,
        shippingCity: dto.shippingCity,
        shippingZip: dto.shippingZip,
        shippingCountry: dto.shippingCountry,
        paymentMethod: dto.paymentMethod,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            vendor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async getCustomerOrders(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            vendor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is customer or vendor of items in this order
    const isCustomer = order.customerId === userId;
    const isVendor = order.items.some((item) => item.vendorId === userId);

    if (!isCustomer && !isVendor) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async getVendorOrders(vendorId: number) {
    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            vendorId: vendorId,
          },
        },
      },
      include: {
        items: {
          where: {
            vendorId: vendorId,
          },
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async updateOrderStatus(orderId: number, vendorId: number, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if vendor has items in this order
    const hasVendorItems = order.items.some(
      (item) => item.vendorId === vendorId,
    );
    if (!hasVendorItems) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
