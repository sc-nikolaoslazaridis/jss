﻿/* eslint-disable no-unused-expressions */
import { CdpService, ExperienceContext } from './cdp-service';
import { expect, spy, use } from 'chai';
import spies from 'chai-spies';
import nock from 'nock';
import { AxiosDataFetcher } from '../axios-fetcher';

use(spies);

describe('CdpService', () => {
  const endpoint = 'http://sctest';
  const clientKey = 'client-key';
  const contentId = 'content-id';
  const variantId = 'variant-1';
  const pointOfSale = 'pos-1';
  const browserId = 'browser-id';
  const context = {
    geo: {
      city: 'Testville',
      country: 'US',
      latitude: '43.1475',
      longitude: '-87.905',
      region: 'CA',
    },
    ua:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36',
    referrer: 'about:client',
    utm: {
      utm_campaign: 'test',
      utm_source: null,
      utm_medium: null,
      utm_content: null,
    },
  } as ExperienceContext;

  const config = {
    endpoint,
    clientKey,
    pointOfSale,
  };

  afterEach(() => {
    nock.cleanAll();
  });

  it('should return variant data for a route', async () => {
    nock(endpoint)
      .post(`/v2/callFlows/getAudience/${contentId}`, {
        clientKey,
        pointOfSale,
        context,
        browserId,
      })
      .reply(200, {
        variantId,
        browserId,
      });

    const service = new CdpService(config);
    const result = await service.executeExperience(contentId, context, browserId);

    expect(result).to.deep.equal({
      variantId,
      browserId,
    });
  });

  it('should return undefined variant when no response', async () => {
    nock(endpoint)
      .post(`/v2/callFlows/getAudience/${contentId}`, {
        clientKey,
        pointOfSale,
        context,
        browserId,
      })
      .reply(200, {
        variantId: '',
        browserId: '',
      });

    const service = new CdpService(config);
    const result = await service.executeExperience(contentId, context, browserId);

    expect(result.variantId).to.be.undefined;
  });

  it('should fetch using custom fetcher resolver', async () => {
    const fetcherSpy = spy((url: string, data?: unknown) => {
      return new AxiosDataFetcher().fetch<never>(url, data);
    });

    nock(endpoint)
      .post(`/v2/callFlows/getAudience/${contentId}`, {
        clientKey,
        pointOfSale,
        context,
        browserId,
      })
      .reply(200, {
        variantId,
        browserId,
      });

    const service = new CdpService({ ...config, dataFetcherResolver: () => fetcherSpy });
    const result = await service.executeExperience(contentId, context, browserId);

    expect(result).to.deep.equal({
      variantId,
      browserId,
    });
    expect(fetcherSpy).to.be.called.once;
    expect(fetcherSpy).to.be.called.with(`http://sctest/v2/callFlows/getAudience/${contentId}`);
  });
});
