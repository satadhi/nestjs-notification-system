import { Test, TestingModule } from '@nestjs/testing';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';

describe('OrderServiceController', () => {
  let orderServiceController: OrderServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderServiceController],
      providers: [
        {
          provide: OrderServiceService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Order service is running'),
            createOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    orderServiceController = app.get<OrderServiceController>(OrderServiceController);
  });

  describe('root', () => {
    it('should return service health text', () => {
      expect(orderServiceController.getHello()).toBe('Order service is running');
    });
  });
});
