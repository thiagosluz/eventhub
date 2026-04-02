import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { MonitorGuard } from 'src/auth/monitor.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  const mockActivitiesService = {
    createActivity: jest.fn(),
    listActivitiesForEvent: jest.fn(),
    getActivitiesForParticipant: jest.fn(),
    updateActivity: jest.fn(),
    enrollInActivity: jest.fn(),
    deleteActivity: jest.fn(),
    unrollFromActivity: jest.fn(),
    createType: jest.fn(),
    findAllTypes: jest.fn(),
    removeType: jest.fn(),
    listEnrollments: jest.fn(),
    confirmEnrollment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MonitorGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  const mockRequest = {
    user: {
      sub: 'user-id',
      tenantId: 'tenant-id',
    },
  } as any;

  describe('createActivity', () => {
    it('should create an activity', async () => {
      const dto: CreateActivityDto = { name: 'Test' } as any;
      await controller.createActivity('event-id', dto, mockRequest);
      expect(service.createActivity).toHaveBeenCalledWith({
        tenantId: 'tenant-id',
        eventId: 'event-id',
        data: dto,
      });
    });

    it('should throw error if tenantId is missing', async () => {
      await expect(
        controller.createActivity('event-id', {} as any, { user: {} } as any),
      ).rejects.toThrow('Missing tenantId on token payload.');
    });
  });

  describe('listActivitiesForEvent', () => {
    it('should list activities', async () => {
      await controller.listActivitiesForEvent('event-id', mockRequest);
      expect(service.listActivitiesForEvent).toHaveBeenCalledWith('tenant-id', 'event-id');
    });

    it('should throw error if tenantId is missing', async () => {
      await expect(
        controller.listActivitiesForEvent('event-id', { user: {} } as any),
      ).rejects.toThrow('Missing tenantId on token payload.');
    });
  });

  describe('getMyEnrollments', () => {
    it('should get enrollments', async () => {
      await controller.getMyEnrollments('event-id', mockRequest);
      expect(service.getActivitiesForParticipant).toHaveBeenCalledWith({
        userId: 'user-id',
        eventId: 'event-id',
      });
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        controller.getMyEnrollments('event-id', { user: {} } as any),
      ).rejects.toThrow('Missing userId on token payload.');
    });
  });

  describe('updateActivity', () => {
    it('should update an activity', async () => {
      const dto: UpdateActivityDto = { name: 'Updated' } as any;
      await controller.updateActivity('activity-id', dto, mockRequest);
      expect(service.updateActivity).toHaveBeenCalledWith({
        tenantId: 'tenant-id',
        activityId: 'activity-id',
        data: dto,
      });
    });

    it('should throw error if tenantId is missing', async () => {
      await expect(
        controller.updateActivity('activity-id', {} as any, { user: {} } as any),
      ).rejects.toThrow('Missing tenantId on token payload.');
    });
  });

  describe('enrollInActivity', () => {
    it('should enroll in an activity', async () => {
      await controller.enrollInActivity('activity-id', mockRequest);
      expect(service.enrollInActivity).toHaveBeenCalledWith({
        userId: 'user-id',
        activityId: 'activity-id',
      });
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        controller.enrollInActivity('activity-id', { user: {} } as any),
      ).rejects.toThrow('Missing user id on token payload.');
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      await controller.deleteActivity('activity-id', mockRequest);
      expect(service.deleteActivity).toHaveBeenCalledWith('tenant-id', 'activity-id');
    });

    it('should throw error if tenantId is missing', async () => {
      await expect(
        controller.deleteActivity('activity-id', { user: {} } as any),
      ).rejects.toThrow('Missing tenantId on token payload.');
    });
  });

  describe('unrollFromActivity', () => {
    it('should unroll from an activity', async () => {
      await controller.unrollFromActivity('activity-id', mockRequest);
      expect(service.unrollFromActivity).toHaveBeenCalledWith({
        userId: 'user-id',
        activityId: 'activity-id',
      });
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        controller.unrollFromActivity('activity-id', { user: {} } as any),
      ).rejects.toThrow('Missing user id on token payload.');
    });
  });

  describe('Activity Types', () => {
    it('createType should work', async () => {
      await controller.createType(mockRequest, 'Type A');
      expect(service.createType).toHaveBeenCalledWith('tenant-id', 'Type A');
    });

    it('createType should throw if tenantId missing', async () => {
      await expect(controller.createType({ user: {} } as any, 'Type A')).rejects.toThrow('Missing tenantId');
    });

    it('findAllTypes should work', async () => {
      await controller.findAllTypes(mockRequest);
      expect(service.findAllTypes).toHaveBeenCalledWith('tenant-id');
    });

    it('findAllTypes should throw if tenantId missing', async () => {
      await expect(controller.findAllTypes({ user: {} } as any)).rejects.toThrow('Missing tenantId');
    });

    it('removeType should work', async () => {
      await controller.removeType(mockRequest, 'type-id');
      expect(service.removeType).toHaveBeenCalledWith('tenant-id', 'type-id');
    });

    it('removeType should throw if tenantId missing', async () => {
      await expect(controller.removeType({ user: {} } as any, 'type-id')).rejects.toThrow('Missing tenantId');
    });
  });

  describe('listEnrollments', () => {
    it('should work', async () => {
      await controller.listEnrollments('activity-id', mockRequest);
      expect(service.listEnrollments).toHaveBeenCalledWith('tenant-id', 'activity-id');
    });

    it('should throw if tenantId missing', async () => {
      await expect(controller.listEnrollments('activity-id', { user: {} } as any)).rejects.toThrow('Missing tenantId');
    });
  });

  describe('confirmEnrollment', () => {
    it('should work', async () => {
      await controller.confirmEnrollment('activity-id', 'enrollment-id', mockRequest);
      expect(service.confirmEnrollment).toHaveBeenCalledWith('tenant-id', 'activity-id', 'enrollment-id');
    });

    it('should throw if tenantId missing', async () => {
      await expect(controller.confirmEnrollment('activity-id', 'enrollment-id', { user: {} } as any)).rejects.toThrow('Missing tenantId');
    });
  });
});
