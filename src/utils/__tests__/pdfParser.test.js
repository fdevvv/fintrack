import { describe, it, expect } from 'vitest';
import { PDFParser } from '../pdfParser';

// ─── helpers ────────────────────────────────────────────────────────────────
const names  = (items) => items.map(i => i.nombre);
const montos = (items) => items.map(i => i.monto);

// ─── parseAmt ───────────────────────────────────────────────────────────────
describe('parseAmt', () => {
  it('parsea monto sin miles', () => expect(PDFParser.parseAmt('1.500,00')).toBe(1500));
  it('parsea monto con miles',  () => expect(PDFParser.parseAmt('12.345,67')).toBe(12346));
  it('parsea monto pequeño',    () => expect(PDFParser.parseAmt('250,00')).toBe(250));
});

// ─── nameMatch ──────────────────────────────────────────────────────────────
describe('nameMatch', () => {
  it('match exacto',       () => expect(PDFParser.nameMatch('NETFLIX', 'NETFLIX')).toBe(true));
  it('match parcial',      () => expect(PDFParser.nameMatch('NETFLIX INC', 'NETFLIX')).toBe(true));
  it('no match distinto',  () => expect(PDFParser.nameMatch('SPOTIFY', 'NETFLIX')).toBe(false));
  it('ignora strings vacíos', () => expect(PDFParser.nameMatch('', 'NETFLIX')).toBe(false));
  it('ignora strings cortos', () => expect(PDFParser.nameMatch('AB', 'AB')).toBe(false));
});

// ─── parseVisa (Galicia Visa) ────────────────────────────────────────────────
describe('parseVisa — Galicia', () => {
  const lines = [
    'DETALLE DEL CONSUMO',
    '05-03-25 NETFLIX 1.500,00',
    '06-03-25 SUPERMERCADO DIA 03/12 8.200,50',
    '07-03-25 SPOTIFY 900,00',
    '08-03-25 ZAPATILLAS ADIDAS 02/06 15.000,00',
    'TOTAL A PAGAR 25.600,50',
    'Cuotas a vencer',
  ];

  it('detecta items dentro del bloque de consumos', () => {
    const r = PDFParser.parseVisa(lines);
    expect(r.length).toBe(4);
  });
  it('extrae nombre correctamente', () => {
    const r = PDFParser.parseVisa(lines);
    expect(names(r)).toContain('NETFLIX');
    expect(names(r)).toContain('SPOTIFY');
  });
  it('extrae monto correctamente', () => {
    const r = PDFParser.parseVisa(lines);
    expect(r.find(i => i.nombre === 'NETFLIX').monto).toBe(1500);
  });
  it('detecta cuotas', () => {
    const r = PDFParser.parseVisa(lines);
    const adidas = r.find(i => i.nombre.includes('ADIDAS') || i.nombre.includes('ZAPATILLAS'));
    expect(adidas.cuotaActual).toBe(2);
    expect(adidas.cuotaTotal).toBe(6);
  });
  it('ignora TOTAL A PAGAR', () => {
    const r = PDFParser.parseVisa(lines);
    expect(names(r)).not.toContain('TOTAL A PAGAR');
  });
  it('no incluye items fuera del bloque', () => {
    const r = PDFParser.parseVisa(lines);
    expect(r.length).toBe(4);
  });
  it('marca tarjeta como VISA', () => {
    const r = PDFParser.parseVisa(lines);
    r.forEach(i => expect(i.tarjeta).toBe('VISA'));
  });
});

// ─── parseVisa — USD ────────────────────────────────────────────────────────
describe('parseVisa — items USD', () => {
  const lines = [
    'CONSUMOS EN MONEDA EXTRANJERA',
    '10-03-25 AMAZON USD 15,99 1.500,00',
    '11-03-25 APPLE USD 9,99 900,00',
    'Cuotas a vencer',
  ];

  it('detecta items USD', () => {
    const r = PDFParser.parseVisa(lines);
    expect(r.length).toBe(2);
    r.forEach(i => expect(i.isUSD).toBe(true));
  });
  it('monto es el último valor de la línea (ARS equivalente)', () => {
    const r = PDFParser.parseVisa(lines);
    // El parser toma el último monto de la línea; el flag isUSD indica que es USD
    expect(r[0].monto).toBe(1500);
    expect(r[0].isUSD).toBe(true);
  });
});

// ─── parseMC (Galicia Mastercard) ───────────────────────────────────────────
describe('parseMC — Galicia', () => {
  const lines = [
    'DETALLE DEL CONSUMO',
    '05-MAR-25 NETFLIX 1.500,00',
    '06-MAR-25 YPF COMBUSTIBLE 12.000,00',
    '07-MAR-25 SPOTIFY 900,00',
    'TOTAL A PAGAR 14.400,00',
    'Cuotas a vencer',
  ];

  it('detecta 3 items', () => {
    const r = PDFParser.parseMC(lines);
    expect(r.length).toBe(3);
  });
  it('extrae nombres', () => {
    const r = PDFParser.parseMC(lines);
    expect(names(r)).toContain('NETFLIX');
    expect(names(r)).toContain('SPOTIFY');
  });
  it('extrae montos', () => {
    const r = PDFParser.parseMC(lines);
    expect(r.find(i => i.nombre === 'NETFLIX').monto).toBe(1500);
  });
  it('ignora TOTAL A PAGAR', () => {
    const r = PDFParser.parseMC(lines);
    expect(names(r)).not.toContain('TOTAL A PAGAR');
  });
  it('marca tarjeta como MASTERCARD', () => {
    const r = PDFParser.parseMC(lines);
    r.forEach(i => expect(i.tarjeta).toBe('MASTERCARD'));
  });
});

// ─── parseGeneric — BBVA ────────────────────────────────────────────────────
describe('parseGeneric — simulando BBVA', () => {
  const lines = [
    'RESUMEN DE CUENTA - VISA BBVA',
    'FECHA          DESCRIPCION                IMPORTE',
    '05/03/2025     MERCADOPAGO *UBER           3.500,00',
    '06/03/2025     NETFLIX COM                 2.800,00',
    '07/03/2025     SUPERMERCADO COTO           9.200,00',
    '08/03/2025     RAPPI AR                    1.800,00',
    'TOTAL A PAGAR                              17.300,00',
    'SALDO ANTERIOR                             5.000,00',
  ];

  it('detecta items de consumo', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(r.length).toBeGreaterThanOrEqual(3);
  });
  it('extrae NETFLIX', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('NETFLIX'))).toBe(true);
  });
  it('extrae SUPERMERCADO', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('SUPERMERCADO'))).toBe(true);
  });
  it('ignora TOTAL A PAGAR', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('TOTAL'))).toBe(false);
  });
  it('ignora SALDO ANTERIOR', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('SALDO'))).toBe(false);
  });
  it('ignora montos menores a 200', () => {
    const lines2 = ['05/03/2025 CAFE 150,00', '05/03/2025 ALMUERZO 850,00'];
    const r = PDFParser.parseGeneric(lines2);
    expect(r.length).toBe(1);
    expect(r[0].monto).toBe(850);
  });
});

// ─── parseGeneric — Santander ───────────────────────────────────────────────
describe('parseGeneric — simulando Santander', () => {
  const lines = [
    'Resumen de Tarjeta de Crédito Santander',
    '2025-03-05 SPOTIFY ARGENTINA 1.200,00',
    '2025-03-06 AMAZON WEB SERVICES 4.500,00',
    '2025-03-07 FARMACITY 2.300,00',
    '2025-03-08 SUBTE SUBE 350,00',
    'IMPUESTO DE SELLOS 120,00',
    'VENCIMIENTO 10/04/2025',
    'TOTAL 8.350,00',
  ];

  it('detecta consumos', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(r.length).toBeGreaterThanOrEqual(3);
  });
  it('extrae SPOTIFY', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('SPOTIFY'))).toBe(true);
  });
  it('extrae FARMACITY', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('FARMACITY'))).toBe(true);
  });
  it('ignora IMPUESTO DE SELLOS', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('IMPUESTO'))).toBe(false);
  });
  it('elimina fecha del inicio del nombre', () => {
    const r = PDFParser.parseGeneric(lines);
    r.forEach(i => expect(i.nombre).not.toMatch(/^\d{4}-\d{2}-\d{2}/));
  });
});

// ─── parseGeneric — Naranja ─────────────────────────────────────────────────
describe('parseGeneric — simulando Naranja X', () => {
  const lines = [
    'NARANJA X - RESUMEN MENSUAL',
    '03/03 PEDIDOSYA APP                       2.100,00',
    '04/03 NETFLIX                             1.500,00',
    '05/03 SHELL COMBUSTIBLE                   18.000,00',
    '06/03 MERCADOLIBRE                        5.600,00',
    'SUBTOTAL CONSUMOS                         27.200,00',
    'IVA                                       950,00',
    'TOTAL A ABONAR                            28.150,00',
  ];

  it('detecta consumos', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(r.length).toBeGreaterThanOrEqual(3);
  });
  it('extrae NETFLIX', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('NETFLIX'))).toBe(true);
  });
  it('ignora SUBTOTAL', () => {
    const r = PDFParser.parseGeneric(lines);
    expect(names(r).some(n => n.includes('SUBTOTAL'))).toBe(false);
  });
  it('elimina fecha DD/MM del inicio', () => {
    const r = PDFParser.parseGeneric(lines);
    r.forEach(i => expect(i.nombre).not.toMatch(/^\d{2}\/\d{2}/));
  });
});

// ─── autoParse — selección del mejor parser ──────────────────────────────────
describe('autoParse — elige el parser correcto', () => {
  it('elige parseVisa para Galicia Visa', () => {
    const lines = [
      'DETALLE DEL CONSUMO',
      '05-03-25 NETFLIX 1.500,00',
      '06-03-25 SPOTIFY 900,00',
      '07-03-25 UBER 1.200,00',
      'Cuotas a vencer',
    ];
    const r = PDFParser.autoParse(lines);
    expect(r.length).toBe(3);
    expect(r[0].tarjeta).toBe('VISA');
  });

  it('elige parseMC para Galicia MC', () => {
    const lines = [
      'DETALLE DEL CONSUMO',
      '05-MAR-25 NETFLIX 1.500,00',
      '06-MAR-25 SPOTIFY 900,00',
      '07-MAR-25 YPF 3.000,00',
      'Cuotas a vencer',
    ];
    const r = PDFParser.autoParse(lines);
    expect(r.length).toBe(3);
    expect(r[0].tarjeta).toBe('MASTERCARD');
  });

  it('cae a generic para banco desconocido', () => {
    const lines = [
      'RESUMEN HSBC ARGENTINA',
      '05/03/2025 NETFLIX 1.500,00',
      '06/03/2025 SUPERMERCADO DISCO 7.800,00',
      '07/03/2025 RAPPI 2.100,00',
      'TOTAL 11.400,00',
    ];
    const r = PDFParser.autoParse(lines);
    expect(r.length).toBeGreaterThanOrEqual(2);
  });

  it('devuelve array vacío para PDF sin transacciones', () => {
    const lines = ['RESUMEN SIN CONSUMOS', 'TOTAL 0,00'];
    const r = PDFParser.autoParse(lines);
    expect(r).toEqual([]);
  });
});

// ─── extractLines ────────────────────────────────────────────────────────────
describe('extractLines', () => {
  it('devuelve array vacío para content sin items', () => {
    expect(PDFParser.extractLines({ items: [] })).toEqual([]);
    expect(PDFParser.extractLines({})).toEqual([]);
  });

  it('agrupa tokens por posición Y y ordena por X', () => {
    const content = {
      items: [
        { transform: [1,0,0,1, 100, 200], str: 'NETFLIX' },
        { transform: [1,0,0,1, 200, 200], str: '1.500,00' },
        { transform: [1,0,0,1, 100, 100], str: 'SPOTIFY' },
        { transform: [1,0,0,1, 200, 100], str: '900,00' },
      ]
    };
    const lines = PDFParser.extractLines(content);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('NETFLIX');
    expect(lines[0]).toContain('1.500,00');
  });
});
