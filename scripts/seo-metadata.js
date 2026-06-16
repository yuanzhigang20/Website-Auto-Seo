export const SITE = { name: 'Pawstool', origin: 'https://pawstool.com' };
export function toolTitle(toolName, categoryLabel) { return `${toolName} - Free Online ${categoryLabel} Tool | Pawstool`; }
export function canonical(path) { return new URL(path, SITE.origin).toString(); }
export function toolJsonLd({ name, description, url, category, faqs = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory: category,
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } }))
  };
}
