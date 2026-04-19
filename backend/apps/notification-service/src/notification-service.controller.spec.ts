import { Test, TestingModule } from '@nestjs/testing';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';

describe('NotificationServiceController', () => {
  let notificationServiceController: NotificationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationServiceController],
      providers: [
        {
          provide: NotificationServiceService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Notification service is running'),
          },
        },
      ],
    }).compile();

    notificationServiceController = app.get<NotificationServiceController>(NotificationServiceController);
  });

  describe('root', () => {
    it('should return service health text', () => {
      expect(notificationServiceController.getHello()).toBe('Notification service is running');
    });
  });
});
