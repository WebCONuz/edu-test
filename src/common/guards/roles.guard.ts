import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true; // rol talab qilinmasa o'tkazib yuboradi

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.includes(user?.role as UserRole);
    if (!hasRole)
      throw new ForbiddenException("Bu amalni bajarish uchun ruxsat yo'q");
    return true;
  }
}
