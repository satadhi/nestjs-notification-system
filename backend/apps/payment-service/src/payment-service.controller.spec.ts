import { Test, TestingModule } from '@nestjs/testing';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';

describe('PaymentServiceController', () => {
  let paymentServiceController: PaymentServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaymentServiceController],
      providers: [
        {
          provide: PaymentServiceService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Payment service is running'),
          },
        },
      ],
    }).compile();

    paymentServiceController = app.get<PaymentServiceController>(PaymentServiceController);
  });

  describe('root', () => {
    it('should return service health text', () => {
      expect(paymentServiceController.getHello()).toBe('Payment service is running');
    });
  });
});
