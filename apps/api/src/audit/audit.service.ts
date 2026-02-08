import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtPayloadDto } from '@org/data';
import { canViewAuditLog } from '@org/auth';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    organizationId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: any,
    previousState?: any,
    newState?: any,
  ): Promise<AuditLog> {
    const entry = this.auditRepository.create({
      userId,
      organizationId,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      previousState: previousState ? JSON.stringify(previousState) : null,
      newState: newState ? JSON.stringify(newState) : null,
    });

    return this.auditRepository.save(entry);
  }

  async getAuditLog(user: JwtPayloadDto): Promise<AuditLog[]> {
    if (!canViewAuditLog(user.role)) {
      throw new ForbiddenException('Insufficient permissions to view audit log');
    }

    return this.auditRepository.find({
      where: { organizationId: user.organizationId },
      order: { timestamp: 'DESC' },
      take: 100, // Limit to last 100 entries
    });
  }
}
