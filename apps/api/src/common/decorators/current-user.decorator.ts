import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadDto } from '@org/data';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayloadDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
