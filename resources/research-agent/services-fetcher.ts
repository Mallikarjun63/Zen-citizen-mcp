import axios from "axios";
import type { GovernmentService } from "./types.js";

// Simple HTML href extractor (lightweight - avoids adding cheerio)
function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const regex = /href=["']([^"'#>]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

// Keywords that likely point to forms, downloads, or document pages
const DOC_KEYWORDS = ["form", "application", "download", "document", "apply", "how-to", "howto", "applyonline", "requirements", "checklist", "guidelines", "procedure"];

export async function enrichGovernmentService(service: GovernmentService): Promise<GovernmentService> {
  const discovered: string[] = [];

  for (const baseUrl of service.officialLinks || []) {
    try {
      const res = await axios.get(baseUrl, { timeout: 5000 });
      const html = String(res.data || "");

      // Try to find obvious document/form links on the page
      const hrefs = extractHrefs(html).map(h => {
        // Resolve protocol-relative and relative links to absolute when possible
        if (h.startsWith("//")) return `${new URL(baseUrl).protocol}${h}`;
        if (h.startsWith("/")) return `${new URL(baseUrl).origin}${h}`;
        return h;
      });

      for (const h of hrefs) {
        try {
          const lower = h.toLowerCase();
          if (DOC_KEYWORDS.some(k => lower.includes(k)) || lower.includes("pdf") || lower.includes(".pdf")) {
            // Keep only same-origin or clearly relevant links
            if (h.startsWith("http") && !discovered.includes(h)) discovered.push(h);
          }
        } catch (err) {
          // ignore malformed hrefs
        }
        if (discovered.length >= 12) break;
      }
    } catch (err) {
      // network errors are non-fatal; skip this URL
      continue;
    }
    if (discovered.length >= 12) break;
  }

  return { ...service, documentLinks: discovered };
}
