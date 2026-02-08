import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtPayloadDto, Role } from '@org/data';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<Repository<AuditLog>>;

  const mockUser: JwtPayloadDto = {
    sub: 'user-1',
    email: 'admin@example.com',
    organizationId: 'org-1',
    role: 'owner',
  };

  const mockAuditLog: AuditLog = {
    id: 'audit-1',
    userId: 'user-1',
    organizationId: 'org-1',
    action: 'CREATE',
    resource: 'task',
    resourceId: 'task-1',
    details: '{"title":"Test Task"}',
    previousState: null,
    newState: '{"title":"Test Task","status":"todo"}',
    timestamp: new Date(),
    user: null as any,
    organization: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(
        'user-1',
        'org-1',
        'CREATE',
        'task',
        'task-1',
        { title: 'Test Task' },
        null,
        { title: 'Test Task', status: 'todo' }
      );

      expect(result).toEqual(mockAuditLog);
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'CREATE',
        resource: 'task',
        resourceId: 'task-1',
        details: '{"title":"Test Task"}',
        previousState: null,
        newState: '{"title":"Test Task","status":"todo"}',
      });
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('should handle null details', async () => {
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      await service.log('user-1', 'org-1', 'DELETE', 'task', 'task-1');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
          previousState: null,
          newState: null,
        })
      );
    });

    it('should stringify objects for details, previousState, and newState', async () => {
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      const details = { title: 'Task' };
      const previousState = { status: 'todo' };
      const newState = { status: 'done' };

      await service.log('user-1', 'org-1', 'UPDATE', 'task', 'task-1', details, previousState, newState);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: JSON.stringify(details),
          previousState: JSON.stringify(previousState),
          newState: JSON.stringify(newState),
        })
      );
    });
  });

  describe('getAuditLog', () => {
    it('should return audit logs for OWNER user', async () => {
      const mockLogs = [mockAuditLog];
      repository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLog(mockUser);

      expect(result).toEqual(mockLogs);
      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId: mockUser.organizationId },
        order: { timestamp: 'DESC' },
        take: 100,
      });
    });

    it('should return audit logs for another OWNER user', async () => {
      const ownerUser = { ...mockUser, role: 'owner' };
      const mockLogs = [mockAuditLog];
      repository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLog(ownerUser);

      expect(result).toEqual(mockLogs);
    });

    it('should throw ForbiddenException for ADMIN user', async () => {
      const adminUser = { ...mockUser, role: 'admin' };

      await expect(service.getAuditLog(adminUser)).rejects.toThrow(ForbiddenException);
      await expect(service.getAuditLog(adminUser)).rejects.toThrow(
        'Insufficient permissions to view audit log'
      );
    });

    it('should throw ForbiddenException for VIEWER user', async () => {
      const viewerUser = { ...mockUser, role: 'viewer' };

      await expect(service.getAuditLog(viewerUser)).rejects.toThrow(ForbiddenException);
    });

    it('should limit results to 100 entries', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      await service.getAuditLog(mockUser);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should order logs by timestamp descending', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      await service.getAuditLog(mockUser);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { timestamp: 'DESC' },
        })
      );
    });
  });
});
