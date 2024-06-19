import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import { URL } from 'url';

const targetUrl = process.argv[2]; // The website URL to check
const numberOfTries = parseInt(process.argv[3]) || 10; // Number of times to run the test

if (!targetUrl) {
  console.error('Please provide a URL to check.');
  process.exit(1);
}

async function measureFullPageLoad(url, tries) {
  const results = [];

  for (let i = 0; i < tries; i++) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Disable cache
      await page.setCacheEnabled(false);

      // Set user agent to a typical browser user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Navigate to the URL and wait for the 'load' event
      await page.goto(url, { waitUntil: 'load' });

      // Capture performance metrics
      const performanceTiming = JSON.parse(
        await page.evaluate(() => JSON.stringify(window.performance.timing))
      );

      // Calculate full page load time
      const fullPageLoadTime = (performanceTiming.loadEventEnd - performanceTiming.navigationStart) / 1000; // in seconds

      results.push({
        try: i + 1,
        fullPageLoadTime: fullPageLoadTime,
        timestamp: new Date().toISOString()
      });

      console.log(`Run ${i + 1}: Full Page Load Time = ${fullPageLoadTime.toFixed(2)} seconds`);
    } catch (error) {
      console.error(`Error in page load run ${i + 1}:`, error);
    } finally {
      await browser.close();
    }
  }

  return results;
}

async function saveResultsToCSV(results, targetUrl) {
  const parsedUrl = new URL(targetUrl);
  const host = parsedUrl.host.replace(/[^a-zA-Z0-9]/g, '-');
  const dateTime = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const fileName = `site-speed-${host}-${dateTime}.csv`;

  const csvWriter = createObjectCsvWriter({
    path: fileName,
    header: [
      { id: 'try', title: 'TRY' },
      { id: 'fullPageLoadTime', title: 'FULL_PAGE_LOAD_TIME (s)' },
      { id: 'timestamp', title: 'TIMESTAMP' }
    ]
  });

  try {
    await csvWriter.writeRecords(results);
    console.log(`Results saved to ${fileName}`);
  } catch (error) {
    console.error('Error writing CSV file:', error);
  }
}

async function main() {
  try {
    const results = await measureFullPageLoad(targetUrl, numberOfTries);
    await saveResultsToCSV(results, targetUrl);
  } catch (error) {
    console.error('Error in the main process:', error);
  }
}

main();
