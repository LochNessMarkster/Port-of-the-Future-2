import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function registerFloorPlanRoutes(app: App) {
  /**
   * GET /api/floor-plan - Get floor plan information
   */
  app.fastify.get(
    '/api/floor-plan',
    {
      schema: {
        description: 'Get floor plan information',
        tags: ['floor-plan'],
        response: {
          200: {
            type: 'object',
            properties: {
              imageUrl: { type: ['string', 'null'] },
              description: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching floor plan information');
      try {
        const floorPlan = {
          imageUrl: null as string | null,
          description: '',
        };

        app.logger.info('Floor plan information retrieved successfully');
        return floorPlan;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch floor plan');
        throw error;
      }
    }
  );
}
