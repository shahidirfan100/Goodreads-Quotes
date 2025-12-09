// Goodreads Quotes Scraper - JSON API + HTML parsing
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { load as cheerioLoad } from 'cheerio';
import { gotScraping } from 'got-scraping';

await Actor.init();

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            tag = '', author = '', search = '', results_wanted: RESULTS_WANTED_RAW = 100,
            max_pages: MAX_PAGES_RAW = 20, startUrl, startUrls, url, proxyConfiguration,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : Number.MAX_SAFE_INTEGER;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 999;

        const toAbs = (href, base = 'https://www.goodreads.com') => {
            try { return new URL(href, base).href; } catch { return null; }
        };

        const cleanText = (text) => {
            if (!text) return '';
            return String(text).replace(/\s+/g, ' ').replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").trim();
        };

        const buildStartUrl = (tagVal, authorVal, searchVal) => {
            if (searchVal) {
                const u = new URL('https://www.goodreads.com/quotes/search');
                u.searchParams.set('q', String(searchVal).trim());
                return u.href;
            }
            if (authorVal) {
                return `https://www.goodreads.com/quotes/search?q=${encodeURIComponent(String(authorVal).trim())}`;
            }
            if (tagVal) {
                return `https://www.goodreads.com/quotes/tag/${encodeURIComponent(String(tagVal).trim())}`;
            }
            return 'https://www.goodreads.com/quotes';
        };

        const initial = [];
        if (Array.isArray(startUrls) && startUrls.length) initial.push(...startUrls);
        if (startUrl) initial.push(startUrl);
        if (url) initial.push(url);
        if (!initial.length) initial.push(buildStartUrl(tag, author, search));

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        let saved = 0;
        const seenQuotes = new Set();

        // Try JSON API first (Goodreads internal API)
        async function tryJsonApi(url, page) {
            try {
                let apiUrl = '';
                if (url.includes('/quotes/tag/')) {
                    const tagMatch = url.match(/\/quotes\/tag\/([^/?]+)/);
                    if (tagMatch) {
                        apiUrl = `https://www.goodreads.com/quotes/tag/${tagMatch[1]}?format=json&page=${page}`;
                    }
                } else if (url.includes('/quotes/search')) {
                    const urlObj = new URL(url);
                    const q = urlObj.searchParams.get('q');
                    if (q) {
                        apiUrl = `https://www.goodreads.com/quotes/search?format=json&q=${encodeURIComponent(q)}&page=${page}`;
                    }
                } else if (url.includes('/quotes')) {
                    // Handle basic quotes page
                    apiUrl = `https://www.goodreads.com/quotes?format=json&page=${page}`;
                }

                if (!apiUrl) return null;

                const response = await gotScraping({
                    url: apiUrl,
                    responseType: 'json',
                    proxyUrl: proxyConf?.newUrl ? await proxyConf.newUrl() : undefined,
                    timeout: { request: 30000 },
                    retry: { limit: 2 },
                    headers: {
                        'accept': 'application/json, text/javascript, */*; q=0.01',
                        'x-requested-with': 'XMLHttpRequest',
                    }
                });

                if (response && response.body && response.body.quotes) {
                    return response.body.quotes;
                }
                return null;
            } catch (err) {
                log.debug(`JSON API failed for ${url} page ${page}: ${err.message}`);
                return null;
            }
        }

        // Parse quotes from HTML
        function parseHtmlQuotes($) {
            const quotes = [];
            // Try multiple container selectors to be more robust
            const containers = $('div.quote, div.quoteDetails, .quote, .quoteDetails');
            crawlerLog.info(`Found ${containers.length} quote containers on page`);

            containers.each((_, elem) => {
                try {
                    const $elem = $(elem);
                    
                    // Extract quote text using specific selector
                    let quoteText = $elem.find('div.quoteText').first().clone().children().remove().end().text();
                    if (!quoteText) {
                        quoteText = $elem.find('div.quoteText').first().text();
                    }
                    quoteText = cleanText(quoteText).replace(/^["']|["']$/g, '');

                    // Extract author using specific selector
                    let authorName = $elem.find('span.authorOrTitle').first().text().trim();
                    authorName = authorName.replace(/^,\s*/, '').replace(/\s+/g, ' ').trim();

                    // Extract book title using specific selector
                    let bookTitle = $elem.find('a.authorOrTitle').first().text().trim();

                    // Extract tags using specific selector
                    const tags = [];
                    $elem.find('div.greyText.smallText.left a[href*="/quotes/tag/"]').each((_, tag) => {
                        const tagText = $(tag).text().trim();
                        if (tagText) tags.push(tagText);
                    });

                    // Extract likes using specific selector
                    let likes = 0;
                    const likesText = $elem.find('div.right').text();
                    const likesMatch = likesText.match(/(\d+)\s*likes?/i);
                    if (likesMatch) likes = parseInt(likesMatch[1], 10);

                    // Extract quote URL - look for links in the quote container
                    let quoteUrl = '';
                    const quoteLink = $elem.find('a[href*="/quotes/"]').first().attr('href');
                    if (quoteLink) quoteUrl = toAbs(quoteLink);

                    // Extract author URL for additional context
                    const authorUrl = $elem.find('span.authorOrTitle > a[href]').attr('href');
                    if (authorUrl) {
                        // Could use this for author profile scraping if needed
                    }

                    if (quoteText && quoteText.length > 10) {
                        quotes.push({
                            quote: quoteText,
                            author: authorName || 'Unknown',
                            tags: tags,
                            likes: likes,
                            book: bookTitle || null,
                            url: quoteUrl,
                        });
                    }
                } catch (err) {
                    log.debug(`Failed to parse quote element: ${err.message}`);
                }
            });
            crawlerLog.info(`Extracted ${quotes.length} quotes from HTML parsing`);
            return quotes;
        }

        // Find next page link
        function findNextPage($, currentUrl) {
            // Try to find actual next page links first
            const nextLink = $('a.next_page').attr('href') ||
                           $('div.pagination a.next_page').attr('href') ||
                           $('a[rel="next"]').attr('href');
            if (nextLink) {
                log.debug(`Found next page link: ${nextLink}`);
                return toAbs(nextLink, currentUrl);
            }

            // Check for any pagination links that might indicate more pages
            const paginationLinks = $('div.pagination a');
            if (paginationLinks.length > 0) {
                // Look for the last pagination link that might be "next"
                const lastLink = paginationLinks.last().attr('href');
                if (lastLink && !lastLink.includes('#') && !lastLink.includes('javascript:')) {
                    log.debug(`Using last pagination link: ${lastLink}`);
                    return toAbs(lastLink, currentUrl);
                }
            }

            // If no explicit pagination links found, construct next page URL
            // Goodreads uses ?page= format for pagination
            try {
                const urlObj = new URL(currentUrl);
                const currentPage = parseInt(urlObj.searchParams.get('page') || '1', 10);
                const nextPage = currentPage + 1;
                urlObj.searchParams.set('page', String(nextPage));
                const nextUrl = urlObj.href;
                log.debug(`Constructed next page URL: ${nextUrl} (from page ${currentPage} to ${nextPage})`);
                return nextUrl;
            } catch (err) {
                log.debug(`Failed to construct next page URL: ${err.message}`);
                return null;
            }
        }

        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConf,
            maxRequestRetries: 3,
            useSessionPool: true,
            maxConcurrency: 5,
            requestHandlerTimeoutSecs: 60,
            async requestHandler({ request, $, enqueueLinks, log: crawlerLog }) {
                const pageNo = request.userData?.pageNo || 1;
                
                crawlerLog.info(`Processing page ${pageNo}: ${request.url}`);

                if (saved >= RESULTS_WANTED) {
                    crawlerLog.info('Reached desired quote count, stopping');
                    return;
                }

                let quotes = [];

                // Try JSON API first
                const jsonQuotes = await tryJsonApi(request.url, pageNo);
                if (jsonQuotes && Array.isArray(jsonQuotes)) {
                    crawlerLog.info(`JSON API returned ${jsonQuotes.length} quotes`);
                    quotes = jsonQuotes.map(q => ({
                        quote: cleanText(q.quoteText || q.text || '').replace(/^["']|["']$/g, ''),
                        author: cleanText(q.authorName || q.author || 'Unknown'),
                        tags: Array.isArray(q.tags) ? q.tags : [],
                        likes: parseInt(q.likesCount || q.likes || 0, 10),
                        book: q.bookTitle || null,
                        url: q.quoteUrl || toAbs(q.url || '') || null,
                    }));
                } else {
                    // Fallback to HTML parsing
                    crawlerLog.info('JSON API unavailable, parsing HTML');
                    quotes = parseHtmlQuotes($);
                }

                crawlerLog.info(`Extracted ${quotes.length} quotes from page ${pageNo}`);

                // Filter and save quotes
                const newQuotes = [];
                for (const quote of quotes) {
                    if (saved >= RESULTS_WANTED) break;
                    
                    const quoteHash = `${quote.quote}_${quote.author}`;
                    if (!seenQuotes.has(quoteHash)) {
                        seenQuotes.add(quoteHash);
                        newQuotes.push(quote);
                        saved++;
                    }
                }

                if (newQuotes.length > 0) {
                    await Dataset.pushData(newQuotes);
                    crawlerLog.info(`Saved ${newQuotes.length} new quotes (total: ${saved})`);
                }

                // Handle pagination
                if (saved < RESULTS_WANTED && pageNo < MAX_PAGES) {
                    const nextUrl = findNextPage($, request.url);
                    if (nextUrl) {
                        crawlerLog.info(`Enqueueing next page: ${nextUrl} (current saved: ${saved}, page: ${pageNo})`);
                        await enqueueLinks({
                            urls: [nextUrl],
                            userData: { pageNo: pageNo + 1 }
                        });
                    } else {
                        crawlerLog.info(`No next page found for ${request.url} (saved: ${saved}, page: ${pageNo})`);
                    }
                } else {
                    crawlerLog.info(`Stopping pagination (saved: ${saved}/${RESULTS_WANTED}, page: ${pageNo}/${MAX_PAGES})`);
                }
            }
        });

        await crawler.run(initial.map(u => ({ url: u, userData: { pageNo: 1 } })));
        log.info(`Finished. Saved ${saved} quotes`);
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
