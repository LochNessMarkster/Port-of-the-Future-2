import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type ExhibitorFields,
} from '../utils/airtable.js';

export function registerExhibitorsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/exhibitors - Get all exhibitors
   */
  app.fastify.get(
    '/api/exhibitors',
    {
      schema: {
        description: 'Get all conference exhibitors',
        tags: ['exhibitors'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                contactName: { type: 'string' },
                contactTitle: { type: 'string' },
                contactEmail: { type: 'string' },
                contactPhoneDirect: { type: 'string' },
                contactPhoneMobile: { type: 'string' },
                contactFax: { type: 'string' },
                phone: { type: 'string' },
                companyUrl: { type: 'string' },
                linkedIn: { type: 'string' },
                facebook: { type: 'string' },
                x: { type: 'string' },
                boothNumber: { type: 'string' },
                demonstrations: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all exhibitors from Airtable');
      try {
        const data = await fetchAirtableRecords<ExhibitorFields>(TABLES.EXHIBITORS, {
          logger: app.logger,
        });

        // Log ALL field names for each exhibitor
        if (data.records.length > 0) {
          app.logger.info(
            { totalRecords: data.records.length },
            'Exhibitors fetched from Airtable'
          );

          // Log field names and contact-related values for each record
          data.records.forEach((record: AirtableRecord<ExhibitorFields>) => {
            const fields = record.fields as any;
            const fieldNames = Object.keys(fields);
            const companyName = fields.Name || 'Unknown';

            // Log all field names
            app.logger.info(
              { exhibitorId: record.id, companyName, fieldNames },
              `All available fields for exhibitor`
            );

            // Extract and log contact-related fields
            const contactFields: Record<string, any> = {};
            fieldNames.forEach((fieldName) => {
              const lowerFieldName = fieldName.toLowerCase();
              if (
                lowerFieldName.includes('contact') ||
                lowerFieldName.includes('phone') ||
                lowerFieldName.includes('email') ||
                lowerFieldName.includes('title') ||
                lowerFieldName.includes('fax') ||
                lowerFieldName.includes('name')
              ) {
                contactFields[fieldName] = fields[fieldName];
              }
            });

            if (Object.keys(contactFields).length > 0) {
              app.logger.info(
                { exhibitorId: record.id, companyName, contactFields },
                'Contact-related fields found'
              );
            }

            // Special logging for BMT exhibitor
            if (companyName.includes('BMT') || companyName.includes('bmt')) {
              app.logger.warn(
                { exhibitorId: record.id, allFields: fields },
                'BMT EXHIBITOR - Full record for reference'
              );
            }
          });
        }

        const exhibitors = data.records.map((record: AirtableRecord<ExhibitorFields>) => {
          const fields = record.fields as any;

          // Extract logo URL - try multiple field names and handle both attachment arrays and URL strings
          let logoUrl = '';
          const logoFieldNames = ['Logo', 'Logo Url', 'Logo URL', 'LogoUrl'];

          for (const fieldName of logoFieldNames) {
            const logoField = fields[fieldName];
            if (logoField) {
              // Check if it's an array (attachment field)
              if (Array.isArray(logoField) && logoField.length > 0) {
                logoUrl = logoField[0]?.url || '';
              } else if (typeof logoField === 'string') {
                logoUrl = logoField;
              }
              break;
            }
          }

          // Try multiple variations for contact name
          let contactName = '';
          const contactNameVariations = [
            'Contact Name',
            'Primary Contact Name',
            'Primary contact name',
            'Contact',
            'Name (Contact)',
          ];
          for (const fieldName of contactNameVariations) {
            if (fields[fieldName]) {
              contactName = fields[fieldName];
              break;
            }
          }

          // Try multiple variations for contact title
          let contactTitle = '';
          const contactTitleVariations = [
            'Contact Title',
            'Primary Contact Title',
            'Primary contact title',
            'Title (Contact)',
          ];
          for (const fieldName of contactTitleVariations) {
            if (fields[fieldName]) {
              contactTitle = fields[fieldName];
              break;
            }
          }

          // Try multiple variations for contact email
          let contactEmail = '';
          const contactEmailVariations = [
            'Contact Email',
            'Primary Contact Email',
            'Primary contact email',
            'Email',
            'Email (Contact)',
          ];
          for (const fieldName of contactEmailVariations) {
            if (fields[fieldName]) {
              contactEmail = fields[fieldName];
              break;
            }
          }

          // Try multiple variations for contact phone
          let contactPhoneDirect = '';
          let contactPhoneMobile = '';
          const contactPhoneVariations = [
            'Contact Phone',
            'Primary Contact Phone',
            'Primary contact phone',
            'Phone',
            'Direct Phone',
            'Mobile Phone',
          ];
          for (const fieldName of contactPhoneVariations) {
            if (fields[fieldName]) {
              if (fieldName.toLowerCase().includes('mobile')) {
                contactPhoneMobile = fields[fieldName];
              } else {
                contactPhoneDirect = fields[fieldName];
              }
            }
          }

          // Company URL is stored in "URL" field
          const companyUrl = fields['URL'] || fields['Company URL'] || fields.Website || '';

          return {
            id: record.id,
            name: record.fields.Name || '',
            description: record.fields.Description || record.fields.Bio || '',
            logoUrl,
            contactName,
            contactTitle,
            contactEmail,
            contactPhoneDirect,
            contactPhoneMobile,
            contactFax: fields['Primary contact fax number'] || fields['Contact Fax'] || '',
            phone: record.fields.Phone || '',
            companyUrl,
            linkedIn: record.fields.LinkedIn || '',
            facebook: fields['Facebook URL'] || '',
            x: fields['X (Twitter) URL'] || '',
            boothNumber: record.fields['Booth Number'] || record.fields.BoothNumber || '',
            demonstrations: fields.Demonstrations || '',
          };
        });

        app.logger.info({ count: exhibitors.length }, 'Exhibitors fetched successfully');
        return exhibitors;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch exhibitors');
        throw error;
      }
    }
  );

  /**
   * GET /api/exhibitors/:id - Get exhibitor details
   */
  app.fastify.get(
    '/api/exhibitors/:id',
    {
      schema: {
        description: 'Get exhibitor details',
        tags: ['exhibitors'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              contactName: { type: 'string' },
              contactTitle: { type: 'string' },
              contactEmail: { type: 'string' },
              contactPhoneDirect: { type: 'string' },
              contactPhoneMobile: { type: 'string' },
              contactFax: { type: 'string' },
              phone: { type: 'string' },
              companyUrl: { type: 'string' },
              linkedIn: { type: 'string' },
              facebook: { type: 'string' },
              x: { type: 'string' },
              boothNumber: { type: 'string' },
              demonstrations: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ exhibitorId: id }, 'Fetching exhibitor details');

      try {
        const record = await fetchAirtableRecord<ExhibitorFields>(TABLES.EXHIBITORS, id, app.logger);

        if (!record) {
          app.logger.warn({ exhibitorId: id }, 'Exhibitor not found (permission denied or record not found)');
          return reply.status(404).send({
            error: 'Exhibitor not found. The Airtable API may not have permission to access this table.',
          });
        }

        // Log field names for debugging
        const fields = record.fields as any;
        const fieldNames = Object.keys(fields);
        const companyName = fields.Name || 'Unknown';

        app.logger.info(
          { exhibitorId: id, companyName, fieldNames },
          'All available fields in exhibitor record'
        );

        // Extract and log contact-related fields
        const contactFields: Record<string, any> = {};
        fieldNames.forEach((fieldName) => {
          const lowerFieldName = fieldName.toLowerCase();
          if (
            lowerFieldName.includes('contact') ||
            lowerFieldName.includes('phone') ||
            lowerFieldName.includes('email') ||
            lowerFieldName.includes('title') ||
            lowerFieldName.includes('fax') ||
            lowerFieldName.includes('name')
          ) {
            contactFields[fieldName] = fields[fieldName];
          }
        });

        if (Object.keys(contactFields).length > 0) {
          app.logger.info(
            { exhibitorId: id, companyName, contactFields },
            'Contact-related fields found'
          );
        }

        // Extract logo URL - try multiple field names and handle both attachment arrays and URL strings
        let logoUrl = '';
        const logoFieldNames = ['Logo', 'Logo Url', 'Logo URL', 'LogoUrl'];

        for (const fieldName of logoFieldNames) {
          const logoField = fields[fieldName];
          if (logoField) {
            // Check if it's an array (attachment field)
            if (Array.isArray(logoField) && logoField.length > 0) {
              logoUrl = logoField[0]?.url || '';
            } else if (typeof logoField === 'string') {
              logoUrl = logoField;
            }
            break;
          }
        }

        // Try multiple variations for contact name
        let contactName = '';
        const contactNameVariations = [
          'Contact Name',
          'Primary Contact Name',
          'Primary contact name',
          'Contact',
          'Name (Contact)',
        ];
        for (const fieldName of contactNameVariations) {
          if (fields[fieldName]) {
            contactName = fields[fieldName];
            break;
          }
        }

        // Try multiple variations for contact title
        let contactTitle = '';
        const contactTitleVariations = [
          'Contact Title',
          'Primary Contact Title',
          'Primary contact title',
          'Title (Contact)',
        ];
        for (const fieldName of contactTitleVariations) {
          if (fields[fieldName]) {
            contactTitle = fields[fieldName];
            break;
          }
        }

        // Try multiple variations for contact email
        let contactEmail = '';
        const contactEmailVariations = [
          'Contact Email',
          'Primary Contact Email',
          'Primary contact email',
          'Email',
          'Email (Contact)',
        ];
        for (const fieldName of contactEmailVariations) {
          if (fields[fieldName]) {
            contactEmail = fields[fieldName];
            break;
          }
        }

        // Try multiple variations for contact phone
        let contactPhoneDirect = '';
        let contactPhoneMobile = '';
        const contactPhoneVariations = [
          'Contact Phone',
          'Primary Contact Phone',
          'Primary contact phone',
          'Phone',
          'Direct Phone',
          'Mobile Phone',
        ];
        for (const fieldName of contactPhoneVariations) {
          if (fields[fieldName]) {
            if (fieldName.toLowerCase().includes('mobile')) {
              contactPhoneMobile = fields[fieldName];
            } else {
              contactPhoneDirect = fields[fieldName];
            }
          }
        }

        // Company URL is stored in "URL" field
        const companyUrl = fields['URL'] || fields['Company URL'] || fields.Website || '';

        const result = {
          id: record.id,
          name: record.fields.Name || '',
          description: record.fields.Description || record.fields.Bio || '',
          logoUrl,
          contactName,
          contactTitle,
          contactEmail,
          contactPhoneDirect,
          contactPhoneMobile,
          contactFax: fields['Primary contact fax number'] || fields['Contact Fax'] || '',
          phone: record.fields.Phone || '',
          companyUrl,
          linkedIn: record.fields.LinkedIn || '',
          facebook: fields['Facebook URL'] || '',
          x: fields['X (Twitter) URL'] || '',
          boothNumber: record.fields['Booth Number'] || record.fields.BoothNumber || '',
          demonstrations: fields.Demonstrations || '',
        };

        app.logger.info({ exhibitorId: id }, 'Exhibitor details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, exhibitorId: id }, 'Failed to fetch exhibitor');
        throw error;
      }
    }
  );
}
