import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { RegisterDto, LoginDto } from './dto';
import { Role } from '@org/data';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    organizationId: 'org-1',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: null as any,
    tasks: [],
    auditLogs: [],
  };

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Org',
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
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      organizationName: 'New Org',
      role: 'admin',
    };

    it('should successfully register a new user with new organization', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(null);
      organizationRepository.create.mockReturnValue(mockOrganization);
      organizationRepository.save.mockResolvedValue(mockOrganization);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(organizationRepository.findOne).toHaveBeenCalledWith({ where: { name: registerDto.organizationName } });
      expect(organizationRepository.create).toHaveBeenCalledWith({
        name: registerDto.organizationName,
        parentId: null,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should register user with existing organization', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(organizationRepository.create).not.toHaveBeenCalled();
      expect(organizationRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.register(registerDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: loginDto.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateUser', () => {
    it('should return user with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
    });

    it('should return null with invalid email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('invalid@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null with invalid password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('JWT token generation', () => {
    it('should generate token with correct payload', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jwtService.sign.mockReturnValue('jwt-token');

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        organizationId: mockUser.organizationId,
        role: mockUser.role,
      });
    });
  });
});
