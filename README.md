# Goodreads Quotes Scraper

<p align="center">
  <strong>Extract thousands of inspirational quotes from Goodreads with ease</strong>
</p>

Powerful and efficient Goodreads quotes scraper that extracts quotes, authors, tags, likes, and book information from [Goodreads.com](https://www.goodreads.com/quotes). Perfect for building quote databases, content creation, social media automation, and research projects.

## ✨ Key Features

- **🚀 Fast & Efficient**: Uses JSON API with HTML parsing fallback for maximum speed
- **🎯 Multiple Search Options**: Search by tag, author name, or custom query
- **📊 Rich Data Extraction**: Captures quote text, author, tags, likes count, and source books
- **🔄 Smart Pagination**: Automatically handles pagination across multiple pages
- **🎭 Duplicate Detection**: Built-in deduplication to ensure unique quotes
- **⚙️ Highly Configurable**: Customize results count, page limits, and search parameters
- **💾 Clean Output**: Structured JSON data ready for immediate use
- **🎯 Precise Selectors**: Uses optimized CSS selectors for reliable data extraction

## 🔧 Technical Implementation

This scraper employs a dual-extraction strategy for maximum reliability:

### Data Extraction Methods

1. **JSON API (Primary)**: Fast extraction using Goodreads internal API endpoints
2. **HTML Parsing (Fallback)**: Precise CSS selector-based extraction when API is unavailable

### Optimized CSS Selectors

The scraper uses highly specific CSS selectors for accurate data extraction:

- **Quote Container**: `div.quote`, `div.quoteDetails` (fallback)
- **Quote Text**: `div.quoteText`
- **Author Name**: `span.authorOrTitle`
- **Book Title**: `a.authorOrTitle`
- **Tags**: `div.greyText.smallText.left a[href*="/quotes/tag/"]`
- **Likes Count**: `div.right`
- **Pagination**: `div.pagination > a.next_page`

This precision ensures reliable scraping even when Goodreads updates their HTML structure.

## 📋 What Data Can You Extract?

Each quote includes the following information:

- **Quote Text**: The full quote content, properly formatted
- **Author**: The name of the person who said/wrote the quote
- **Tags**: Associated categories and themes (e.g., inspirational, life, love)
- **Likes Count**: Number of likes the quote has received on Goodreads
- **Book Title**: The book source (if available)
- **URL**: Direct link to the quote on Goodreads

## 🎯 Use Cases

This scraper is ideal for:

- **Content Creators**: Gather quotes for blogs, social media, and newsletters
- **Developers**: Build quote-of-the-day applications and APIs
- **Researchers**: Analyze quote popularity and thematic trends
- **Educators**: Compile teaching materials and inspirational resources
- **Marketers**: Source engaging content for campaigns
- **Data Scientists**: Study literary patterns and author influence

## 🚀 Getting Started

### Input Configuration

The scraper offers flexible input options to match your needs:

#### Option 1: Search by Tag (Recommended)
```json
{
  "tag": "inspirational",
  "results_wanted": 100,
  "max_pages": 5
}
```

Popular tags include: `inspirational`, `life`, `love`, `wisdom`, `humor`, `motivation`, `philosophy`, `success`, `happiness`, `hope`

#### Option 2: Search by Author
```json
{
  "author": "Albert Einstein",
  "results_wanted": 50,
  "max_pages": 3
}
```

#### Option 3: Custom Search Query
```json
{
  "search": "meaning of life",
  "results_wanted": 75,
  "max_pages": 4
}
```

#### Option 4: Direct URL
```json
{
  "startUrl": "https://www.goodreads.com/quotes/tag/love",
  "results_wanted": 200,
  "max_pages": 10
}
```

### Input Parameters

<table>
  <tr>
    <th>Parameter</th>
    <th>Type</th>
    <th>Description</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>tag</code></td>
    <td>String</td>
    <td>Search quotes by tag (e.g., "inspirational", "love")</td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>author</code></td>
    <td>String</td>
    <td>Search quotes by author name</td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>search</code></td>
    <td>String</td>
    <td>Free-text search for specific words or phrases</td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>startUrl</code></td>
    <td>String</td>
    <td>Direct Goodreads quotes URL to start from</td>
    <td>-</td>
  </tr>
  <tr>
    <td><code>results_wanted</code></td>
    <td>Integer</td>
    <td>Maximum number of quotes to collect</td>
    <td>100</td>
  </tr>
  <tr>
    <td><code>max_pages</code></td>
    <td>Integer</td>
    <td>Maximum number of pages to scrape</td>
    <td>20</td>
  </tr>
  <tr>
    <td><code>proxyConfiguration</code></td>
    <td>Object</td>
    <td>Proxy settings (recommended for reliability)</td>
    <td>Residential</td>
  </tr>
</table>

## 📤 Output Format

The scraper returns data in clean, structured JSON format:

```json
{
  "quote": "Be yourself; everyone else is already taken.",
  "author": "Oscar Wilde",
  "tags": ["inspirational", "authenticity", "be-yourself"],
  "likes": 152847,
  "book": "The Picture of Dorian Gray",
  "url": "https://www.goodreads.com/quotes/19884"
}
```

### Output Fields

- **`quote`** (String): The complete quote text
- **`author`** (String): Author's name
- **`tags`** (Array): List of associated tags
- **`likes`** (Number): Total likes on Goodreads
- **`book`** (String|null): Source book title (if available)
- **`url`** (String): Direct link to the quote

## 💡 Example Usage Scenarios

### Scenario 1: Building a Quote Database
Extract 1,000 inspirational quotes for your application:
```json
{
  "tag": "inspirational",
  "results_wanted": 1000,
  "max_pages": 35
}
```

### Scenario 2: Author Quote Collection
Gather all quotes from your favorite author:
```json
{
  "author": "Maya Angelou",
  "results_wanted": 500,
  "max_pages": 20
}
```

### Scenario 3: Themed Content Curation
Collect love quotes for Valentine's Day content:
```json
{
  "tag": "love",
  "results_wanted": 200,
  "max_pages": 10
}
```

## 🔧 Advanced Configuration

### Using Proxies

For reliable scraping at scale, configure proxy settings:

```json
{
  "tag": "wisdom",
  "results_wanted": 500,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

**Proxy Recommendations:**
- **Residential proxies**: Best for large-scale scraping
- **Datacenter proxies**: Cost-effective for moderate usage
- **No proxy**: Suitable for small test runs only

## ⚡ Performance & Limits

- **Speed**: Scrapes 30-50 quotes per page
- **Efficiency**: JSON API prioritized for faster extraction
- **Reliability**: Automatic fallback to HTML parsing
- **Pagination**: Each page loads ~30 quotes
- **Rate Limiting**: Built-in request throttling

### Estimated Scraping Times

| Quotes | Pages | Approximate Time |
|--------|-------|------------------|
| 50     | 2     | 10-20 seconds    |
| 100    | 4     | 20-40 seconds    |
| 500    | 17    | 2-4 minutes      |
| 1000   | 34    | 4-8 minutes      |

## 🎨 Data Export Options

Export your scraped data in multiple formats:

- **JSON**: Raw structured data
- **CSV**: Spreadsheet-compatible format
- **Excel**: Formatted workbook
- **HTML**: Web-ready table format
- **RSS**: Feed format for content distribution

Access exports through the Apify platform dashboard after scraping completes.

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Issue**: No quotes extracted
- **Solution**: Verify the tag/author name exists on Goodreads
- **Solution**: Try using a direct URL instead

**Issue**: Scraper stops early
- **Solution**: Increase `max_pages` parameter
- **Solution**: Enable proxy configuration

**Issue**: Duplicate quotes
- **Solution**: Built-in deduplication is automatic; duplicates indicate the same quote across pages

**Issue**: Missing data fields
- **Solution**: Some quotes may not have all fields (e.g., book title)
- **Solution**: Check HTML structure changes on Goodreads

## 📊 Data Quality

Our scraper ensures high-quality data through:

- **Text Normalization**: Removes extra whitespace and special characters
- **Encoding Handling**: Properly processes Unicode quotes and characters
- **Validation**: Filters out invalid or incomplete entries
- **Deduplication**: Prevents duplicate quotes in results
- **Error Handling**: Gracefully handles missing or malformed data

## ⚖️ Legal & Ethical Considerations

- This tool is designed for personal, educational, and research purposes
- Respect Goodreads' terms of service and robots.txt
- Implement rate limiting for large-scale scraping
- Do not use scraped data for commercial purposes without proper authorization
- Consider adding delays between requests to be respectful
- Always provide attribution when using quotes publicly

## 🎓 Best Practices

1. **Start Small**: Test with 50-100 quotes before scaling up
2. **Use Tags**: Tag-based searches are faster and more reliable
3. **Enable Proxies**: Essential for scraping more than 200 quotes
4. **Monitor Runs**: Check logs for any errors or warnings
5. **Respect Limits**: Don't overwhelm the site with requests
6. **Cache Results**: Store scraped data to avoid re-scraping
7. **Regular Updates**: Re-scrape periodically for fresh content

## 📈 Version History

- **v1.0.0** - Initial release with JSON API and HTML parsing support

## 🤝 Support & Feedback

Need help or have suggestions?

- Review the [Apify documentation](https://docs.apify.com)
- Check the [Apify community forum](https://community.apify.com)
- Report issues through the Apify platform

## 🌟 Related Actors

Enhance your data collection with these complementary actors:

- **Book Scraper**: Extract book details and reviews
- **Author Information Scraper**: Gather author biographies and bibliographies
- **Social Media Quote Poster**: Automate quote sharing
- **Content Analyzer**: Analyze quote themes and sentiment

---

<p align="center">
  <strong>Start extracting inspiring quotes today!</strong><br>
  Fast • Reliable • Easy to Use
</p>
