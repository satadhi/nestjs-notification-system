import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelWrapper, connect, AmqpConnectionManager } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { DEFAULT_RABBITMQ_URL, SAGA_EXCHANGE } from './rabbitmq.constants';
import { RabbitMqSubscription } from './rabbitmq.types';

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: AmqpConnectionManager;
  private channelWrapper?: ChannelWrapper;
  private readonly subscriptions = new Set<string>();

  constructor(private readonly configService: ConfigService) {}

  async publish<TPayload>(routingKey: string, payload: TPayload) {
    const channel = await this.getChannel();

    await channel.publish(
      SAGA_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
    );
  }

  async subscribe<TPayload>({
    queue,
    routingKeys,
    handler,
    prefetchCount = 10,
  }: RabbitMqSubscription<TPayload>) {
    const subscriptionKey = `${queue}:${routingKeys.sort().join(',')}`;
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    this.subscriptions.add(subscriptionKey);
    const channelWrapper = await this.getChannel();

    await channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertExchange(SAGA_EXCHANGE, 'topic', { durable: true });
      await channel.assertQueue(queue, { durable: true });
      await channel.prefetch(prefetchCount);

      for (const routingKey of routingKeys) {
        await channel.bindQueue(queue, SAGA_EXCHANGE, routingKey);
      }

      await channel.consume(
        queue,
        async (message) => {
          if (!message) {
            return;
          }

          await this.consumeMessage({
            channel,
            message,
            handler,
          });
        },
        { noAck: false },
      );
    });
  }

  async onModuleDestroy() {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }

  private async consumeMessage<TPayload>({
    channel,
    message,
    handler,
  }: {
    channel: Channel;
    message: ConsumeMessage;
    handler: RabbitMqSubscription<TPayload>['handler'];
  }) {
    try {
      const payload = JSON.parse(message.content.toString()) as TPayload;

      await handler({
        payload,
        routingKey: message.fields.routingKey,
        rawMessage: message,
      });

      channel.ack(message);
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error(`Failed to process message ${message.fields.routingKey}`, normalizedError);
      channel.nack(message, false, false);
    }
  }

  private async getChannel() {
    if (this.channelWrapper) {
      return this.channelWrapper;
    }

    const rabbitMqUrl =
      this.configService.get<string>('RABBITMQ_URL') ?? DEFAULT_RABBITMQ_URL;

    this.connection = connect([rabbitMqUrl]);
    this.connection.on('connect', () => {
      this.logger.log(`Connected to RabbitMQ at ${rabbitMqUrl}`);
    });
    this.connection.on('disconnect', ({ err }) => {
      this.logger.error(`RabbitMQ disconnected: ${err?.message ?? 'unknown error'}`);
    });

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: Channel) => {
        await channel.assertExchange(SAGA_EXCHANGE, 'topic', { durable: true });
      },
    });

    return this.channelWrapper;
  }
}
