import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, Role, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard Stats
  async getDashboardStats() {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
        }),
      ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      usersByRole,
      ordersByStatus,
    };
  }

  // Get All Users
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            customerOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update User Status
  async updateUserStatus(adminId: number, userId: number, status: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as UserStatus }, // Cast to enum type
    });

    await this.logAdminAction(
      adminId,
      'USER_STATUS_UPDATED',
      'User',
      userId,
      `Updated user status to ${status}`,
    );

    return user;
  }

  // Update User Role
  async updateUserRole(adminId: number, userId: number, role: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as Role }, // Cast to enum type
    });

    await this.logAdminAction(
      adminId,
      'USER_ROLE_UPDATED',
      'User',
      userId,
      `Updated user role to ${role}`,
    );

    return user;
  }

  // Delete User
  async deleteUser(adminId: number, userId: number) {
    // Delete related data first
    await this.prisma.productImage.deleteMany({
      where: {
        product: {
          vendorId: userId,
        },
      },
    });

    await this.prisma.product.deleteMany({
      where: { vendorId: userId },
    });

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.logAdminAction(
      adminId,
      'USER_DELETED',
      'User',
      userId,
      `Deleted user`,
    );

    return { message: 'User deleted successfully' };
  }

  // Get All Products (Admin View)
  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        vendor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Delete Product (Admin)
  async deleteProduct(adminId: number, productId: number) {
    await this.prisma.productImage.deleteMany({
      where: { productId },
    });

    await this.prisma.product.delete({
      where: { id: productId },
    });

    await this.logAdminAction(
      adminId,
      'PRODUCT_DELETED',
      'Product',
      productId,
      `Deleted product`,
    );

    return { message: 'Product deleted successfully' };
  }

  // Get All Orders (Admin View)
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
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

  // Update Order Status (Admin)
  async updateOrderStatus(adminId: number, orderId: number, status: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus }, // Cast to enum type
    });

    await this.logAdminAction(
      adminId,
      'ORDER_STATUS_UPDATED',
      'Order',
      orderId,
      `Updated order status to ${status}`,
    );

    return order;
  }

  // Get Admin Activity Logs
  async getAdminLogs() {
    return this.prisma.adminLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // Log Admin Action
  private async logAdminAction(
    adminId: number,
    action: string,
    targetType: string,
    targetId: number,
    description: string,
  ) {
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        description,
      },
    });
  }
}
