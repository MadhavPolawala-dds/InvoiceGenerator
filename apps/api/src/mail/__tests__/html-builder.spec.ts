import { escapeHtml, buildItemsHtml, buildCustomFieldsHtml } from '../html-builder';

describe('Mail HTML Builder & XSS Injection Protection', () => {
  describe('escapeHtml', () => {
    it('escapes standard HTML special characters', () => {
      expect(escapeHtml('Hello & Welcome')).toBe('Hello &amp; Welcome');
      expect(escapeHtml('<div class="box">Text</div>')).toBe('&lt;div class=&quot;box&quot;&gt;Text&lt;/div&gt;');
      expect(escapeHtml("John's Invoice")).toBe('John&#39;s Invoice');
    });

    it('neutralizes malicious <script> tags', () => {
      const malicious = "<script>alert('pwned')</script>";
      const escaped = escapeHtml(malicious);
      expect(escaped).toBe('&lt;script&gt;alert(&#39;pwned&#39;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('safely handles empty, null and undefined inputs', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('buildItemsHtml', () => {
    it('renders line items with HTML-escaped descriptions', () => {
      const items = [
        {
          description: '<script>fetch("evil.com")</script> Web Dev',
          quantityMilli: 2000,
          unitPriceCents: 5000,
          lineTotalCents: 10000,
        },
      ];

      const html = buildItemsHtml(items);
      expect(html).toContain('&lt;script&gt;fetch(&quot;evil.com&quot;)&lt;/script&gt; Web Dev');
      expect(html).not.toContain('<script>');
      expect(html).toContain('$50.00');
      expect(html).toContain('$100.00');
    });

    it('handles empty line items array gracefully', () => {
      const html = buildItemsHtml([]);
      expect(html).toContain('No line items');
    });
  });

  describe('buildCustomFieldsHtml', () => {
    it('renders ONLY visible custom fields and strictly omits hidden fields', () => {
      const fields = [
        { id: '1', label: 'PO Number', value: 'PO-9912', visible: true, position: 0 },
        { id: '2', label: 'Internal Secret', value: 'SECRET-KEY', visible: false, position: 1 },
        { id: '3', label: 'Project Lead', value: 'Jane Doe', visible: true, position: 2 },
      ];

      const html = buildCustomFieldsHtml(fields);
      // Visible fields are rendered
      expect(html).toContain('PO Number');
      expect(html).toContain('PO-9912');
      expect(html).toContain('Project Lead');
      expect(html).toContain('Jane Doe');

      // Hidden field is strictly absent
      expect(html).not.toContain('Internal Secret');
      expect(html).not.toContain('SECRET-KEY');
    });

    it('escapes malicious scripts inside custom field labels and values', () => {
      const fields = [
        {
          id: '1',
          label: '<script>alert(1)</script>',
          value: '<img src=x onerror=alert(2)>',
          visible: true,
          position: 0,
        },
      ];

      const html = buildCustomFieldsHtml(fields);
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).toContain('&lt;img src=x onerror=alert(2)&gt;');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img');
    });

    it('returns empty string when all custom fields are hidden', () => {
      const fields = [
        { id: '1', label: 'Internal Tag', value: 'Tag 1', visible: false, position: 0 },
      ];
      expect(buildCustomFieldsHtml(fields)).toBe('');
    });
  });
});
