import { supabase } from './supabase';

export const ticketService = {
  /**
   * Upload ticket image to Supabase Storage.
   * Returns public URL.
   */
  async uploadImage(file) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No auth');

    const ext = file.name.split('.').pop();
    const path = `${session.user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('tickets')
      .upload(path, file, { contentType: file.type });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('tickets')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  /**
   * Process image with Tesseract.js OCR.
   * Returns array of { name, price } items + total.
   */
  async processOCR(imageFile) {
    // Dynamically load tesseract.js
    if (!window.Tesseract) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const worker = await window.Tesseract.createWorker('spa');
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();

    return parseTicketText(text);
  },
};

/**
 * Parse OCR text into structured items.
 * Looks for patterns like "ITEM NAME    $1,234.56" or "ITEM NAME  1234"
 */
function parseTicketText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let total = 0;

  // Price pattern: captures numbers with optional dots/commas
  const priceRe = /(\d[\d.,]*\d)\s*$/;
  const totalRe = /total/i;

  for (const line of lines) {
    const match = priceRe.exec(line);
    if (!match) continue;

    const priceStr = match[1].replace(/\./g, '').replace(',', '.');
    const price = Math.round(parseFloat(priceStr));
    if (isNaN(price) || price <= 0) continue;

    const name = line.substring(0, match.index).replace(/[.\-_*]+$/g, '').trim();
    if (!name || name.length < 2) continue;

    if (totalRe.test(name)) {
      total = price;
    } else {
      items.push({ name: name.toUpperCase(), price, id: crypto.randomUUID() });
    }
  }

  // If no explicit total found, sum items
  if (!total && items.length) {
    total = items.reduce((s, i) => s + i.price, 0);
  }

  return { items, total };
}
