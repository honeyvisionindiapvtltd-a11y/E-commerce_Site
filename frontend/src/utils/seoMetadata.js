const SITE_ORIGIN = "https://honeyvision.co.in";
const DEFAULT_TITLE = "Honey Vision | Smart Home & Lifestyle Solutions";
const DEFAULT_DESCRIPTION = "Discover smart home, home appliances, electronics, and premium lifestyle products from Honey Vision.";
const DEFAULT_IMAGE = "https://res.cloudinary.com/vhrkwyzs/image/upload/v1786269504/logo.png_tun5nq.png";

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

function upsertJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function setPageMetadata({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl = `${SITE_ORIGIN}/`,
  image = DEFAULT_IMAGE,
  robots = "index,follow",
  type = "website",
}) {
  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", robots);
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:site_name", "Honey Vision");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:image:alt", title);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);
  upsertCanonical(canonicalUrl);
}

export function setJsonLd(id, data) {
  upsertJsonLd(id, data);
}

export function removeJsonLd(...ids) {
  ids.forEach((id) => document.getElementById(id)?.remove());
}

export function getCanonicalUrl(path) {
  return new URL(path, SITE_ORIGIN).toString();
}

export const SEO_DEFAULTS = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: DEFAULT_IMAGE,
};