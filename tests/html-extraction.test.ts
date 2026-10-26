import { describe, it, expect } from "vitest";
import { HtmlExtractionService } from "../src/modules/crawler/html-extraction.service";

describe("HtmlExtractionService", () => {
  it("extracts core SEO signals from valid Shopify HTML", () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Running Shoes - Fast Store</title>
          <meta name="description" content="Shop the best performance running shoes online.">
          <link rel="canonical" href="https://example.com/products/running-shoes">
          <meta name="robots" content="index, follow">
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Running Shoes",
              "image": "https://example.com/shoe.jpg",
              "offers": {
                "@type": "Offer",
                "price": "120.00",
                "priceCurrency": "USD"
              }
            }
          </script>
        </head>
        <body>
          <h1>Performance Running Shoes</h1>
          <h2>Men's Collection</h2>
          <img src="/img/shoe1.jpg" alt="Red running shoe" width="600" height="400">
          <img src="/img/icon.png">
          <a href="/collections/all">All Collections</a>
          <a href="https://google.com">External Partner</a>
          <p>These shoes offer high-cushioned comfort for marathon runners and athletes.</p>
        </body>
      </html>
    `;

    const page = HtmlExtractionService.extract(
      "https://example.com/products/running-shoes",
      "https://example.com/products/running-shoes",
      200,
      {},
      sampleHtml,
      sampleHtml.length
    );

    expect(page.title).toBe("Running Shoes - Fast Store");
    expect(page.metaDescription).toBe("Shop the best performance running shoes online.");
    expect(page.canonicalUrl).toBe("https://example.com/products/running-shoes");
    expect(page.headings.h1).toEqual(["Performance Running Shoes"]);
    expect(page.headings.h2).toEqual(["Men's Collection"]);
    expect(page.images.length).toBe(2);
    expect(page.images[0].alt).toBe("Red running shoe");
    expect(page.images[1].alt).toBeUndefined();
    expect(page.links.length).toBe(2);
    expect(page.links[0].isInternal).toBe(true);
    expect(page.links[1].isInternal).toBe(false);
    expect(page.template).toBe("product");
    expect(page.jsonLd.length).toBe(1);
    expect(page.jsonLd[0]["@type"]).toBe("Product");
  });
});
