import { Controller, Get } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Public } from '../common/decorators';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.organizationsService.findAll();
  }
}
