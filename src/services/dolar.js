const DOLAR_API = 'https://dolarapi.com/v1/dolares';

export const dolarService = {
  async fetchAll() {
    const r = await fetch(DOLAR_API);
    const data = await r.json();
    if (!Array.isArray(data)) throw new Error('Invalid response');
    return data;
  },

  async getOficialRate() {
    const data = await this.fetchAll();
    const oficial = data.find(x => x.nombre === 'Oficial');
    return oficial?.venta || 0;
  },
};
