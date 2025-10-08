import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: number; role: string };
}

@UseGuards(AuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private checkAdmin(req: AuthenticatedRequest) {
    console.log('User from request:', req.user); // Debug log

    if (!req.user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check for both uppercase and lowercase (for backwards compatibility)
    const role = req.user.role?.toUpperCase();

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    this.checkAdmin(req);
    return await this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(@Req() req: AuthenticatedRequest) {
    this.checkAdmin(req);
    return await this.adminService.getAllUsers();
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    this.checkAdmin(req);
    return await this.adminService.updateUserStatus(
      req.user.userId,
      Number(id),
      status,
    );
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    this.checkAdmin(req);
    return await this.adminService.updateUserRole(
      req.user.userId,
      Number(id),
      role,
    );
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.checkAdmin(req);
    return await this.adminService.deleteUser(req.user.userId, Number(id));
  }

  @Get('products')
  async getProducts(@Req() req: AuthenticatedRequest) {
    this.checkAdmin(req);
    return await this.adminService.getAllProducts();
  }

  @Delete('products/:id')
  async deleteProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.checkAdmin(req);
    return await this.adminService.deleteProduct(req.user.userId, Number(id));
  }

  @Get('orders')
  async getOrders(@Req() req: AuthenticatedRequest) {
    this.checkAdmin(req);
    return await this.adminService.getAllOrders();
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    this.checkAdmin(req);
    return await this.adminService.updateOrderStatus(
      req.user.userId,
      Number(id),
      status,
    );
  }

  @Get('logs')
  async getLogs(@Req() req: AuthenticatedRequest) {
    this.checkAdmin(req);
    return await this.adminService.getAdminLogs();
  }
}
