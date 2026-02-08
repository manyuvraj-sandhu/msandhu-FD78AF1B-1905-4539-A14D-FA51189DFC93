import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../entities/organization.entity';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: jest.Mocked<Repository<Organization>>;

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Organization',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    tasks: [],
    children: [],
    parent: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get(getRepositoryToken(Organization));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all organizations sorted by name', async () => {
      const mockOrganizations = [
        mockOrganization,
        { ...mockOrganization, id: 'org-2', name: 'Another Org' },
      ];
      repository.find.mockResolvedValue(mockOrganizations);

      const result = await service.findAll();

      expect(result).toEqual(mockOrganizations);
      expect(repository.find).toHaveBeenCalledWith({
        order: {
          name: 'ASC',
        },
      });
    });

    it('should return empty array when no organizations exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return an organization by id', async () => {
      repository.findOne.mockResolvedValue(mockOrganization);

      const result = await service.findById('org-1');

      expect(result).toEqual(mockOrganization);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    });

    it('should return null when organization not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });
});
