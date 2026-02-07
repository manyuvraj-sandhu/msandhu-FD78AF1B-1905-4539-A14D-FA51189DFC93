import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orgRepository: Repository<Organization> = app.get(
    getRepositoryToken(Organization),
  );
  const userRepository: Repository<User> = app.get(getRepositoryToken(User));

  // Create organizations
  const rootOrg = orgRepository.create({
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Acme Corp',
    parentId: null,
  });
  await orgRepository.save(rootOrg);

  const childOrg = orgRepository.create({
    id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Acme Engineering',
    parentId: rootOrg.id,
  });
  await orgRepository.save(childOrg);

  console.log('✓ Organizations created');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = userRepository.create({
    email: 'owner@acme.com',
    password: hashedPassword,
    organizationId: rootOrg.id,
    role: 'owner',
  });
  await userRepository.save(owner);

  const admin = userRepository.create({
    email: 'admin@acme.com',
    password: hashedPassword,
    organizationId: rootOrg.id,
    role: 'admin',
  });
  await userRepository.save(admin);

  const viewer = userRepository.create({
    email: 'viewer@acme.com',
    password: hashedPassword,
    organizationId: rootOrg.id,
    role: 'viewer',
  });
  await userRepository.save(viewer);

  console.log('✓ Users created:');
  console.log('  - owner@acme.com (password: password123) - Role: owner');
  console.log('  - admin@acme.com (password: password123) - Role: admin');
  console.log('  - viewer@acme.com (password: password123) - Role: viewer');

  await app.close();
  console.log('\n✓ Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
