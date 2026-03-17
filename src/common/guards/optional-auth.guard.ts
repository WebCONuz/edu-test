import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Xato bo'lsa ham, token bo'lmasa ham null qaytaradi — exception olmaydi
    return user ?? null;
  }
}
