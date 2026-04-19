import { Test, TestingModule } from '@nestjs/testing';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';

describe('InventoryServiceController', () => {
  let inventoryServiceController: InventoryServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InventoryServiceController],
      providers: [
        {
          provide: InventoryServiceService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Inventory service is running'),
          },
        },
      ],
    }).compile();

    inventoryServiceController = app.get<InventoryServiceController>(InventoryServiceController);
  });

  describe('root', () => {
    it('should return service health text', () => {
      expect(inventoryServiceController.getHello()).toBe('Inventory service is running');
    });
  });
});
