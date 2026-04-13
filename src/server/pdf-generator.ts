import { chromium, Browser } from "playwright";

let browser: Browser | null = null;

export const getBrowser = async (): Promise<Browser> => {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
};

export const closeBrowser = async (): Promise<void> => {
  if (browser) {
    await browser.close();
    browser = null;
  }
};

export const generateInvoicePdf = async (htmlContent: string): Promise<Buffer> => {
  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A5",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
};
