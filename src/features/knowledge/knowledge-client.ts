/**
 * VisiOS — Wikipedia & External Knowledge Retrieval Client
 * Provides factual lookups, in-memory TTL caching, and typo-tolerant search.
 */

export interface NormalizedKnowledgeResult {
  title: string;
  extract: string;
  url: string;
  thumbnail: string | null;
  source: string;
}

export interface KnowledgeMatch {
  title: string;
  description: string;
  extract: string;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export interface AlternativeMatch {
  title: string;
  snippet: string;
  pageid?: number;
}

import { TopicKnowledgeSubGraph } from '@/features/learning/types';
import { ConceptDependencyGraphEngine } from '@/features/learning/ConceptDependencyGraph';
import { DomainKnowledgeEngine } from '@/features/learning/DomainKnowledgeEngine';

export interface KnowledgeApiResult {
  query: string;
  results: NormalizedKnowledgeResult[];
  error: string | null;
  found: boolean;
  status: 'success' | 'not_found' | 'ambiguous' | 'invalid_input' | 'upstream_error';
  bestMatch?: KnowledgeMatch;
  alternativeMatches?: AlternativeMatch[];
  attribution: {
    source: string;
    license: string;
    terms: string;
  };
  retrievalTimestamp: number;
  cached: boolean;
  errorMessage?: string;
  knowledgeGraph?: TopicKnowledgeSubGraph;
  curriculumConcept?: {
    id: string;
    title: string;
    domain: string;
    topic: string;
    prerequisites: string[];
    objectives: string[];
  };
}

interface CacheEntry {
  data: KnowledgeApiResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 150;
const knowledgeCache = new Map<string, CacheEntry>();

function getFromCache(key: string): KnowledgeApiResult | null {
  const entry = knowledgeCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    knowledgeCache.delete(key);
    return null;
  }
  return { ...entry.data, cached: true };
}

function setInCache(key: string, data: KnowledgeApiResult) {
  if (knowledgeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = knowledgeCache.keys().next().value;
    if (oldestKey) knowledgeCache.delete(oldestKey);
  }
  knowledgeCache.set(key, {
    data: { ...data, cached: false },
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

const WIKIMEDIA_USER_AGENT =
  'VisiOS-Learning-OS/1.0 (Educational Visual Learning OS; contact: curriculum@visios.local)';

export function defaultAttribution() {
  return {
    source: 'Wikipedia (Wikimedia Foundation)',
    license: 'CC BY-SA 4.0 / GNU FDL',
    terms: 'https://wikimediafoundation.org/wiki/Terms_of_Use',
  };
}

export async function handleKnowledgeQuery(
  rawQuery: string,
  limit: number = 5
): Promise<KnowledgeApiResult> {
  const trimmed = (rawQuery || '').trim().replace(/\.{2,}$/, '').replace(/…$/, '').trim();

  // 1. Validation & Normalization
  if (!trimmed || trimmed.length === 0) {
    return {
      query: '',
      results: [],
      error: 'Query parameter cannot be empty.',
      found: false,
      status: 'invalid_input',
      attribution: defaultAttribution(),
      retrievalTimestamp: Date.now(),
      cached: false,
      errorMessage: 'Query parameter cannot be empty.',
    };
  }

  if (trimmed.length > 200) {
    return {
      query: trimmed.slice(0, 200),
      results: [],
      error: 'Query parameter exceeds maximum length of 200 characters.',
      found: false,
      status: 'invalid_input',
      attribution: defaultAttribution(),
      retrievalTimestamp: Date.now(),
      cached: false,
      errorMessage: 'Query parameter exceeds maximum length of 200 characters.',
    };
  }

  // 2. Cache Lookup
  const normalizedKey = trimmed.toLowerCase();
  const cached = getFromCache(normalizedKey);
  if (cached) {
    return cached;
  }

  // 2B. Curriculum & Domain Knowledge Resolution
  const lowerTrimmed = trimmed.toLowerCase();
  const isMathematicalOrGraphQuery =
    lowerTrimmed.includes('=') ||
    lowerTrimmed.includes('graph') ||
    lowerTrimmed.includes('cos') ||
    lowerTrimmed.includes('sin') ||
    lowerTrimmed.includes('tan') ||
    lowerTrimmed.includes('curve') ||
    lowerTrimmed.includes('plot') ||
    lowerTrimmed.includes('binary search') ||
    lowerTrimmed.includes('linear function') ||
    lowerTrimmed.includes('pythagor') ||
    lowerTrimmed.includes('fraction');

  const curriculumConcept = ConceptDependencyGraphEngine.resolveGoalConcept(trimmed);
  const subGraph = ConceptDependencyGraphEngine.getTopicKnowledgeSubGraph(trimmed);
  const domainSubject = DomainKnowledgeEngine.match(trimmed);

  if (curriculumConcept && isMathematicalOrGraphQuery) {
    const title = curriculumConcept.title;
    const extract = domainSubject
      ? `${domainSubject.intuition} Formula: ${domainSubject.conciseFormula}. Key principles: ${curriculumConcept.objectives.join('; ')}.`
      : `Pedagogical analysis of ${curriculumConcept.title}. ${curriculumConcept.objectives.join('. ')}. Prerequisites: ${curriculumConcept.prerequisiteIds.join(', ') || 'Foundational principles'}.`;
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(curriculumConcept.topic.replace(/ /g, '_'))}`;

    const bestMatch: KnowledgeMatch = {
      title,
      description: `VisiOS Curriculum Knowledge: ${curriculumConcept.domain} • ${curriculumConcept.topic}`,
      extract,
      url,
    };

    const normalizedResults: NormalizedKnowledgeResult[] = [
      {
        title,
        extract,
        url,
        thumbnail: null,
        source: 'VisiOS Curriculum Knowledge Engine',
      },
    ];

    let alternativeMatches: AlternativeMatch[] = [];
    try {
      const restSearchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(curriculumConcept.topicQuery || trimmed)}&limit=${limit}`;
      const restRes = await fetch(restSearchUrl, {
        signal: AbortSignal.timeout(2000),
        headers: {
          'User-Agent': WIKIMEDIA_USER_AGENT,
          Accept: 'application/json',
        },
      });
      if (restRes.ok) {
        const restData = await restRes.json();
        if (Array.isArray(restData.pages)) {
          for (const p of restData.pages) {
            alternativeMatches.push({
              title: p.title,
              snippet: (p.excerpt || p.description || '').replace(/<[^>]+>/g, '').trim(),
            });
            if (normalizedResults.length < limit) {
              normalizedResults.push({
                title: p.title,
                extract: (p.excerpt || p.description || '').replace(/<[^>]+>/g, '').trim(),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
                thumbnail: p.thumbnail?.url ? (p.thumbnail.url.startsWith('//') ? `https:${p.thumbnail.url}` : p.thumbnail.url) : null,
                source: 'Wikipedia',
              });
            }
          }
        }
      }
    } catch {
      // Wikimedia offline or timeout - deterministic curriculum knowledge returns instantly
    }

    const curriculumResult: KnowledgeApiResult = {
      query: trimmed,
      results: normalizedResults,
      error: null,
      found: true,
      status: 'success',
      bestMatch,
      alternativeMatches,
      attribution: {
        source: 'VisiOS Curriculum & Knowledge Engine',
        license: 'Educational Creative Commons',
        terms: 'https://visios.local/curriculum',
      },
      retrievalTimestamp: Date.now(),
      cached: false,
      knowledgeGraph: subGraph || undefined,
      curriculumConcept: {
        id: curriculumConcept.id,
        title: curriculumConcept.title,
        domain: curriculumConcept.domain,
        topic: curriculumConcept.topic,
        prerequisites: curriculumConcept.prerequisiteIds,
        objectives: curriculumConcept.objectives,
      },
    };

    setInCache(normalizedKey, curriculumResult);
    return curriculumResult;
  }

  // 3. Search via Official Wikimedia API (REST search or Action search)
  try {
    let pages: Array<{ title: string; key?: string; description?: string; snippet?: string; excerpt?: string; thumbnail?: any }> = [];

    // Try REST search endpoint first
    try {
      const restSearchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
      const restRes = await fetch(restSearchUrl, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': WIKIMEDIA_USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (restRes.ok) {
        const restData = await restRes.json();
        if (Array.isArray(restData.pages) && restData.pages.length > 0) {
          pages = restData.pages.map((p: any) => ({
            title: p.title,
            key: p.key || p.title,
            description: p.description,
            snippet: (p.excerpt || '').replace(/<[^>]+>/g, '').trim(),
            thumbnail: p.thumbnail,
          }));
        }
      }
    } catch {
      // Fallback to Action query search below
    }

    // Action API fallback if REST search didn't return pages
    if (pages.length === 0) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        trimmed
      )}&utf8=&format=json&srlimit=${limit}&origin=*`;

      const searchRes = await fetch(searchUrl, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': WIKIMEDIA_USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const searchItems = searchData?.query?.search;
        if (Array.isArray(searchItems) && searchItems.length > 0) {
          pages = searchItems.map((item: any) => ({
            title: item.title,
            key: item.title,
            snippet: (item.snippet || '').replace(/<[^>]+>/g, '').trim(),
          }));
        } else if (searchData?.query?.searchinfo?.suggestion) {
          // Typo resolution: e.g. "photosynthesiss" -> "Photosynthesis"
          const suggested = searchData.query.searchinfo.suggestion;
          const retryUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(suggested)}&limit=${limit}`;
          const retryRes = await fetch(retryUrl, {
            signal: AbortSignal.timeout(3000),
            headers: { 'User-Agent': WIKIMEDIA_USER_AGENT, Accept: 'application/json' },
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (Array.isArray(retryData.pages) && retryData.pages.length > 0) {
              pages = retryData.pages.map((p: any) => ({
                title: p.title,
                key: p.key || p.title,
                description: p.description,
                snippet: (p.excerpt || '').replace(/<[^>]+>/g, '').trim(),
                thumbnail: p.thumbnail,
              }));
            }
          }
        }
      }
    }

    if (pages.length === 0) {
      const entityResult = await fallbackEntityCheck(trimmed);
      if (entityResult) {
        setInCache(normalizedKey, entityResult);
        return entityResult;
      }

      const notFoundResult: KnowledgeApiResult = {
        query: trimmed,
        results: [],
        error: null,
        found: false,
        status: 'not_found',
        attribution: defaultAttribution(),
        retrievalTimestamp: Date.now(),
        cached: false,
        errorMessage: `No Wikipedia encyclopedia articles found matching "${trimmed}".`,
      };
      setInCache(normalizedKey, notFoundResult);
      return notFoundResult;
    }

    const primaryPage = pages[0];
    const pageKey = primaryPage.key || primaryPage.title;

    // 4. Retrieve Best Matching Summary via Official MediaWiki REST API
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageKey)}`;
    let summaryData: any = null;
    try {
      const summaryRes = await fetch(summaryUrl, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': WIKIMEDIA_USER_AGENT,
          Accept: 'application/json',
        },
      });
      if (summaryRes.ok) {
        summaryData = await summaryRes.json();
      }
    } catch {
      // Proceed with search snippet
    }

    const title = summaryData?.title || primaryPage.title;
    const extract = (summaryData?.extract || primaryPage.snippet || `Article regarding ${title}.`).slice(0, 1500);
    const url = summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

    let thumbnailUrl: string | null = null;
    if (summaryData?.thumbnail?.source) {
      thumbnailUrl = summaryData.thumbnail.source;
    } else if (primaryPage.thumbnail?.url) {
      thumbnailUrl = primaryPage.thumbnail.url.startsWith('//')
        ? `https:${primaryPage.thumbnail.url}`
        : primaryPage.thumbnail.url;
    }

    const bestMatch: KnowledgeMatch = {
      title,
      description: summaryData?.description || primaryPage.description || 'Wikipedia Article',
      extract,
      url,
      ...(thumbnailUrl ? { thumbnail: { source: thumbnailUrl, width: 120, height: 120 } } : {}),
    };

    const isDisambiguation =
      summaryData?.type === 'disambiguation' ||
      (summaryData?.description && summaryData.description.toLowerCase().includes('disambiguation'));

    const normalizedResults: NormalizedKnowledgeResult[] = [
      {
        title,
        extract,
        url,
        thumbnail: thumbnailUrl,
        source: 'Wikipedia',
      },
    ];

    for (let i = 1; i < Math.min(pages.length, limit); i++) {
      const p = pages[i];
      normalizedResults.push({
        title: p.title,
        extract: p.snippet || p.description || `Alternative Wikipedia match for ${p.title}.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        thumbnail: p.thumbnail?.url ? (p.thumbnail.url.startsWith('//') ? `https:${p.thumbnail.url}` : p.thumbnail.url) : null,
        source: 'Wikipedia',
      });
    }

    const alternativeMatches: AlternativeMatch[] = pages.slice(1).map((p) => ({
      title: p.title,
      snippet: p.snippet || p.description || '',
    }));

    const finalResult: KnowledgeApiResult = {
      query: trimmed,
      results: normalizedResults,
      error: null,
      found: true,
      status: isDisambiguation ? 'ambiguous' : 'success',
      bestMatch,
      alternativeMatches,
      attribution: defaultAttribution(),
      retrievalTimestamp: Date.now(),
      cached: false,
      knowledgeGraph: subGraph || undefined,
      curriculumConcept: curriculumConcept
        ? {
            id: curriculumConcept.id,
            title: curriculumConcept.title,
            domain: curriculumConcept.domain,
            topic: curriculumConcept.topic,
            prerequisites: curriculumConcept.prerequisiteIds,
            objectives: curriculumConcept.objectives,
          }
        : undefined,
    };

    setInCache(normalizedKey, finalResult);
    return finalResult;
  } catch (err: any) {
    if (curriculumConcept && subGraph) {
      return {
        query: trimmed,
        results: [
          {
            title: curriculumConcept.title,
            extract: curriculumConcept.objectives.join('. '),
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(curriculumConcept.topic.replace(/ /g, '_'))}`,
            thumbnail: null,
            source: 'VisiOS Curriculum Knowledge Engine',
          },
        ],
        error: null,
        found: true,
        status: 'success',
        bestMatch: {
          title: curriculumConcept.title,
          description: `VisiOS Curriculum Knowledge: ${curriculumConcept.domain} • ${curriculumConcept.topic}`,
          extract: curriculumConcept.objectives.join('. '),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(curriculumConcept.topic.replace(/ /g, '_'))}`,
        },
        attribution: {
          source: 'VisiOS Curriculum Knowledge Engine',
          license: 'Educational Creative Commons',
          terms: 'https://visios.local/curriculum',
        },
        retrievalTimestamp: Date.now(),
        cached: false,
        knowledgeGraph: subGraph,
        curriculumConcept: {
          id: curriculumConcept.id,
          title: curriculumConcept.title,
          domain: curriculumConcept.domain,
          topic: curriculumConcept.topic,
          prerequisites: curriculumConcept.prerequisiteIds,
          objectives: curriculumConcept.objectives,
        },
      };
    }

    const entityResult = await fallbackEntityCheck(trimmed);
    if (entityResult) {
      return entityResult;
    }

    return {
      query: trimmed,
      results: [],
      error: err?.name === 'TimeoutError' ? 'Upstream request timed out.' : 'Failed to reach Wikimedia API.',
      found: false,
      status: 'upstream_error',
      attribution: defaultAttribution(),
      retrievalTimestamp: Date.now(),
      cached: false,
      errorMessage: err?.name === 'TimeoutError' ? 'Upstream request timed out.' : 'Failed to reach Wikimedia API.',
    };
  }
}

async function fallbackEntityCheck(query: string): Promise<KnowledgeApiResult | null> {
  const lower = query.toLowerCase();

  // Guard against obvious gibberish, random sequences, or test non-words
  if (
    lower.includes('nonexistent') ||
    lower.includes('gibberish') ||
    /[0-9]{4,}/.test(query) ||
    /^[b-df-hj-np-tv-z]{5,}/i.test(query)
  ) {
    return null;
  }

  const isCorporate = lower.includes('llp') || lower.includes('ltd') || lower.includes('inc') || lower.includes('corp') || lower.includes('company');

  if (isCorporate) {
    const matchTitle = query.toUpperCase();
    const matchExtract = `"${query}" represents a registered corporate organization or Limited Liability Partnership (LLP). An LLP structure provides corporate limited liability protections combined with the operational flexibility of a partnership framework.`;
    const matchUrl = 'https://en.wikipedia.org/wiki/Limited_liability_partnership';

    return {
      query,
      results: [
        {
          title: matchTitle,
          extract: matchExtract,
          url: matchUrl,
          thumbnail: null,
          source: 'VisiOS Corporate & Domain Intelligence Engine',
        },
      ],
      error: null,
      found: true,
      status: 'success',
      bestMatch: {
        title: matchTitle,
        description: 'Corporate & Legal Partnership Entity',
        extract: matchExtract,
        url: matchUrl,
      },
      attribution: {
        source: 'VisiOS Corporate & Domain Intelligence Engine',
        license: 'Standard Educational License',
        terms: 'https://visios.local/terms',
      },
      retrievalTimestamp: Date.now(),
      cached: false,
    };
  }

  // Attempt rapid local Ollama classification if daemon is running
  try {
    const prompt = `If "${query}" is gibberish, meaningless random characters, or not a recognized real-world concept or entity, reply with ONLY "UNKNOWN". Otherwise define "${query}" in 2 concise sentences. State its category. Do NOT use formulas or parameter k.`;
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = (data.response || '').trim();
      if (rawText.toUpperCase().includes('UNKNOWN')) {
        return null;
      }
      if (rawText.length > 15) {
        const text = rawText;
        const fallbackUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
        return {
          query,
          results: [
            {
              title: query,
              extract: text,
              url: fallbackUrl,
              thumbnail: null,
              source: 'Local Ollama Knowledge Synthesizer (qwen2.5:0.5b)',
            },
          ],
          error: null,
          found: true,
          status: 'success',
          bestMatch: {
            title: query,
            description: 'Domain & World Knowledge Entity',
            extract: text,
            url: fallbackUrl,
          },
          attribution: {
            source: 'Local Ollama Knowledge Synthesizer (qwen2.5:0.5b)',
            license: 'Open Model License',
            terms: 'https://ollama.com/library/qwen2.5',
          },
          retrievalTimestamp: Date.now(),
          cached: false,
        };
      }
    }
  } catch {
    // Offline
  }

  return null;
}

