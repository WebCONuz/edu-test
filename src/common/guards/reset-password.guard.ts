import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../types';

@Injectable()
export class ResetPasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // AccessTokenGuard dan keladi
    const { targetUserId } = req.body;

    // super_admin hamma parolini o'zgartira oladi
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // admin va teacher faqat o'z parolini o'zgartira oladi
    if (targetUserId && targetUserId !== user.id) {
      throw new ForbiddenException(
        "Siz faqat o'z parolingizni o'zgartira olasiz",
      );
    }

    return true;
  }
}
