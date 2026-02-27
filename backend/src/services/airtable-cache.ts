import {
  fetchAirtableRecords,
  fetchAirtableAttendees,
  TABLES,
  type AirtableRecord,
  type SessionFields,
  type SpeakerFields,
  type PortFields,
  type ExhibitorFields,
  type SponsorFields,
  type AnnouncementFields,
  type AttendeeFields,
} from '../utils/airtable.js';

interface CacheData<T> {
  records: AirtableRecord<T>[];
  lastUpdated: Date;
}

interface CacheStatus {
  lastUpdated: string | null;
  isRefreshing: boolean;
  tables: Record<string, number>;
}

class AirtableCache {
  private sessionCache: CacheData<SessionFields> | null = null;
  private speakerCache: CacheData<SpeakerFields> | null = null;
  private portCache: CacheData<PortFields> | null = null;
  private exhibitorCache: CacheData<ExhibitorFields> | null = null;
  private sponsorCache: CacheData<SponsorFields> | null = null;
  private attendeeCache: CacheData<AttendeeFields> | null = null;
  private announcementCache: CacheData<AnnouncementFields> | null = null;

  private isRefreshing = false;
  private refreshInterval: NodeJS.Timeout | null = null;
  private logger: any = null;

  setLogger(logger: any) {
    this.logger = logger;
  }

  /**
   * Initialize cache and start auto-refresh
   */
  async initialize() {
    if (!this.logger) {
      console.log('[AirtableCache] Initializing without logger');
    } else {
      this.logger.info('Initializing Airtable cache');
    }

    // Perform initial cache population in background (non-blocking)
    this.refresh().catch((error) => {
      if (this.logger) {
        this.logger.warn({ err: error }, 'Initial cache refresh failed, will retry on next interval');
      }
    });

    // Start hourly refresh
    this.refreshInterval = setInterval(async () => {
      await this.refresh();
    }, 60 * 60 * 1000); // 1 hour

    if (this.logger) {
      this.logger.info('Airtable cache initialized with hourly refresh');
    }
  }

  /**
   * Refresh all caches from Airtable
   */
  private async refresh() {
    if (this.isRefreshing) {
      if (this.logger) {
        this.logger.debug('Cache refresh already in progress, skipping');
      }
      return;
    }

    this.isRefreshing = true;

    if (this.logger) {
      this.logger.info('Starting Airtable cache refresh');
    }

    try {
      // Fetch all tables in parallel
      const [sessions, speakers, ports, exhibitors, sponsors, attendees, announcements] =
        await Promise.allSettled([
          this.fetchSessions(),
          this.fetchSpeakers(),
          this.fetchPorts(),
          this.fetchExhibitors(),
          this.fetchSponsors(),
          this.fetchAttendees(),
          this.fetchAnnouncements(),
        ]);

      // Update caches with successful results
      if (sessions.status === 'fulfilled') {
        this.sessionCache = { records: sessions.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: sessions.reason }, 'Failed to fetch sessions');
      }

      if (speakers.status === 'fulfilled') {
        this.speakerCache = { records: speakers.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: speakers.reason }, 'Failed to fetch speakers');
      }

      if (ports.status === 'fulfilled') {
        this.portCache = { records: ports.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: ports.reason }, 'Failed to fetch ports');
      }

      if (exhibitors.status === 'fulfilled') {
        this.exhibitorCache = { records: exhibitors.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: exhibitors.reason }, 'Failed to fetch exhibitors');
      }

      if (sponsors.status === 'fulfilled') {
        this.sponsorCache = { records: sponsors.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: sponsors.reason }, 'Failed to fetch sponsors');
      }

      if (attendees.status === 'fulfilled') {
        this.attendeeCache = { records: attendees.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: attendees.reason }, 'Failed to fetch attendees');
      }

      if (announcements.status === 'fulfilled') {
        this.announcementCache = { records: announcements.value, lastUpdated: new Date() };
      } else if (this.logger) {
        this.logger.warn({ error: announcements.reason }, 'Failed to fetch announcements');
      }

      if (this.logger) {
        this.logger.info(
          {
            sessions: this.sessionCache?.records.length || 0,
            speakers: this.speakerCache?.records.length || 0,
            ports: this.portCache?.records.length || 0,
            exhibitors: this.exhibitorCache?.records.length || 0,
            sponsors: this.sponsorCache?.records.length || 0,
            attendees: this.attendeeCache?.records.length || 0,
            announcements: this.announcementCache?.records.length || 0,
          },
          'Airtable cache refresh completed'
        );
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error({ err: error }, 'Unexpected error during cache refresh');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  private async fetchSessions(): Promise<AirtableRecord<SessionFields>[]> {
    const data = await fetchAirtableRecords<SessionFields>(TABLES.SESSIONS, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchSpeakers(): Promise<AirtableRecord<SpeakerFields>[]> {
    const data = await fetchAirtableRecords<SpeakerFields>(TABLES.SPEAKERS, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchPorts(): Promise<AirtableRecord<PortFields>[]> {
    const data = await fetchAirtableRecords<PortFields>(TABLES.PORTS, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchExhibitors(): Promise<AirtableRecord<ExhibitorFields>[]> {
    const data = await fetchAirtableRecords<ExhibitorFields>(TABLES.EXHIBITORS, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchSponsors(): Promise<AirtableRecord<SponsorFields>[]> {
    const data = await fetchAirtableRecords<SponsorFields>(TABLES.SPONSORS, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchAttendees(): Promise<AirtableRecord<AttendeeFields>[]> {
    const data = await fetchAirtableAttendees(TABLES.ATTENDEES, {
      logger: this.logger,
    });
    return data.records;
  }

  private async fetchAnnouncements(): Promise<AirtableRecord<AnnouncementFields>[]> {
    const data = await fetchAirtableRecords<AnnouncementFields>(TABLES.ANNOUNCEMENTS, {
      logger: this.logger,
    });
    return data.records;
  }

  /**
   * Get cached sessions
   */
  getSessions(): AirtableRecord<SessionFields>[] {
    return this.sessionCache?.records || [];
  }

  /**
   * Get cached speakers
   */
  getSpeakers(): AirtableRecord<SpeakerFields>[] {
    return this.speakerCache?.records || [];
  }

  /**
   * Get cached ports
   */
  getPorts(): AirtableRecord<PortFields>[] {
    return this.portCache?.records || [];
  }

  /**
   * Get cached exhibitors
   */
  getExhibitors(): AirtableRecord<ExhibitorFields>[] {
    return this.exhibitorCache?.records || [];
  }

  /**
   * Get cached sponsors
   */
  getSponsors(): AirtableRecord<SponsorFields>[] {
    return this.sponsorCache?.records || [];
  }

  /**
   * Get cached attendees
   */
  getAttendees(): AirtableRecord<AttendeeFields>[] {
    return this.attendeeCache?.records || [];
  }

  /**
   * Get cached announcements
   */
  getAnnouncements(): AirtableRecord<AnnouncementFields>[] {
    return this.announcementCache?.records || [];
  }

  /**
   * Get cache status
   */
  getStatus(): CacheStatus {
    return {
      lastUpdated: this.sessionCache?.lastUpdated?.toISOString() || null,
      isRefreshing: this.isRefreshing,
      tables: {
        sessions: this.sessionCache?.records.length || 0,
        speakers: this.speakerCache?.records.length || 0,
        ports: this.portCache?.records.length || 0,
        exhibitors: this.exhibitorCache?.records.length || 0,
        sponsors: this.sponsorCache?.records.length || 0,
        attendees: this.attendeeCache?.records.length || 0,
        announcements: this.announcementCache?.records.length || 0,
      },
    };
  }

  /**
   * Destroy cache and stop refresh
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.logger) {
      this.logger.info('Airtable cache destroyed');
    }
  }
}

export const airtableCache = new AirtableCache();
