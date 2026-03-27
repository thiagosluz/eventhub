import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionConfigService } from './submission-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../storage/minio.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SubmissionConfigService', () => {
  let service: SubmissionConfigService;

  const mockPrisma = {
    event: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    submissionModality: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    thematicArea: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    submissionRule: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockMinio = {
    uploadObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionConfigService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MinioService, useValue: mockMinio },
      ],
    }).compile();

    service = module.get<SubmissionConfigService>(SubmissionConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return event config if found', async () => {
      const mockEvent = { id: 'event-1', submissionsEnabled: true };
      (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.getConfig('tenant-1', 'event-1');
      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'event-1', tenantId: 'tenant-1' }
      }));
    });

    it('should throw NotFoundException if event not found', async () => {
      (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.getConfig('tenant-1', 'event-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createModality', () => {
    it('should create a modality without template', async () => {
      (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (mockPrisma.submissionModality.create as jest.Mock).mockResolvedValue({ id: 'mod-1', name: 'Poster' });

      const result = await service.createModality('tenant-1', 'event-1', { name: 'Poster' });
      expect(result.name).toBe('Poster');
      expect(mockMinio.uploadObject).not.toHaveBeenCalled();
    });

    it('should upload template if provided', async () => {
      (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (mockMinio.uploadObject as jest.Mock).mockResolvedValue('http://minio/template.pdf');
      
      await service.createModality('tenant-1', 'event-1', { name: 'Full Paper' }, { buffer: Buffer.from('test'), mimetype: 'application/pdf' });
      
      expect(mockMinio.uploadObject).toHaveBeenCalled();
      expect(mockPrisma.submissionModality.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ templateUrl: 'http://minio/template.pdf' })
      }));
    });

    it('should throw ForbiddenException if event does not belong to tenant', async () => {
        (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue(null);
        await expect(service.createModality('other-tenant', 'event-1', { name: 'Test' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteModality', () => {
      it('should delete modality if it exists', async () => {
          (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
          (mockPrisma.submissionModality.findFirst as jest.Mock).mockResolvedValue({ id: 'mod-1' });
          
          await service.deleteModality('tenant-1', 'event-1', 'mod-1');
          expect(mockPrisma.submissionModality.delete).toHaveBeenCalledWith({ where: { id: 'mod-1' } });
      });

      it('should throw NotFoundException if modality not found', async () => {
          (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
          (mockPrisma.submissionModality.findFirst as jest.Mock).mockResolvedValue(null);
          await expect(service.deleteModality('tenant-1', 'event-1', 'mod-1')).rejects.toThrow(NotFoundException);
      });
  });
});
