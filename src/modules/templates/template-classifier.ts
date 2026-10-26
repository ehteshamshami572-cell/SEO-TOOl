import { PageTemplateType } from "../audits/audit.types";

export class TemplateClassifier {
  /**
   * Classifies a Shopify page URL and HTML signals into a canonical template type
   */
  public static classify(url: string, htmlContent?: string): PageTemplateType {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.toLowerCase().replace(/\/+$/, "") || "/";

      // 1. Root Homepage
      if (path === "/" || path === "") {
        return "homepage";
      }

      // 2. Products (/products/something)
      if (path.startsWith("/products/")) {
        return "product";
      }

      // 3. Collections (/collections/something)
      if (path.startsWith("/collections")) {
        return "collection";
      }

      // 4. Standard Pages (/pages/about-us)
      if (path.startsWith("/pages/")) {
        return "page";
      }

      // 5. Blog vs Article
      // Shopify blog article URLs are typically /blogs/news/first-post (2 path segments after blogs)
      // Blog listing is /blogs/news (1 path segment after blogs)
      if (path.startsWith("/blogs/")) {
        const parts = path.split("/").filter(Boolean); // ['blogs', 'news', 'article-title']
        if (parts.length >= 3) {
          return "article";
        }
        return "blog";
      }

      // Secondary signals from HTML if URL is non-standard
      if (htmlContent) {
        if (htmlContent.includes('"@type":"Product"') || htmlContent.includes('"@type": "Product"')) {
          return "product";
        }
        if (htmlContent.includes("template-collection") || htmlContent.includes("collection-grid")) {
          return "collection";
        }
        if (htmlContent.includes("template-article") || htmlContent.includes('"@type":"BlogPosting"')) {
          return "article";
        }
        if (htmlContent.includes("template-page")) {
          return "page";
        }
        if (htmlContent.includes("template-index")) {
          return "homepage";
        }
      }

      return "unknown";
    } catch {
      return "unknown";
    }
  }
}
