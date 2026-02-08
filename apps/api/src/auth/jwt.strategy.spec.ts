import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayloadDto } from '@org/data';
import { Role } from '@org/data';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return payload for valid token', async () => {
      const payload: JwtPayloadDto = {
        sub: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
        role: 'admin',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const payload: any = {
        email: 'test@example.com',
        organizationId: 'org-1',
        role: 'admin',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException if email is missing', async () => {
      const payload: any = {
        sub: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException if organizationId is missing', async () => {
      const payload: any = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'admin',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should work with all roles', async () => {
      const roles: Role[] = ['viewer', 'admin', 'owner'];

      for (const role of roles) {
        const payload: JwtPayloadDto = {
          sub: 'user-1',
          email: 'test@example.com',
          organizationId: 'org-1',
          role,
        };

        const result = await strategy.validate(payload);
        expect(result.role).toBe(role);
      }
    });
  });
});
