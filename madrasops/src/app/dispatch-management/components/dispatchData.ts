import { NEW_RESTAURANTS } from '@/contexts/AuthContext';

export interface DispatchLine {
  id: string;
  productName: string;
  batchId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  expiryDate: string;
}

export interface DispatchOrder {
  id: string;
  dispatchId: string;
  destination: string;
  destinationCode: string;
  itemCount: number;
  totalValue: number;
  status: 'created' | 'reserved' | 'in-transit' | 'delivered' | 'discrepancy' | 'cancelled';
  driver: string;
  vehicle: string;
  departureTime: string;
  expectedArrival: string;
  createdAt: string;
  createdBy: string;
  lines: DispatchLine[];
  discrepancyNote?: string;
}

export const dispatchOrders: DispatchOrder[] = [
  {
    id: 'dsp-001',
    dispatchId: 'DSP-0042',
    destination: 'Samko Hounslow',
    destinationCode: 'HOU',
    itemCount: 5,
    totalValue: 182.40,
    status: 'in-transit',
    driver: 'Vijay Murugan',
    vehicle: 'LJ21 KTR',
    departureTime: '05:30',
    expectedArrival: '07:00',
    createdAt: '11/10/2026 04:45',
    createdBy: 'Suresh Pillai',
    lines: [
      { id: 'dl-001-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', quantity: 20, unit: 'kg', unitCost: 0.98, totalValue: 19.60, expiryDate: '13/10/2026' },
      { id: 'dl-001-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', quantity: 15, unit: 'kg', unitCost: 1.24, totalValue: 18.60, expiryDate: '14/10/2026' },
      { id: 'dl-001-3', productName: 'Sambar', batchId: 'PB-2024-0110', quantity: 20, unit: 'litres', unitCost: 4.82, totalValue: 96.40, expiryDate: '13/10/2026' },
      { id: 'dl-001-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', quantity: 4, unit: 'kg', unitCost: 3.42, totalValue: 13.68, expiryDate: '12/10/2026' },
      { id: 'dl-001-5', productName: 'White Chutney', batchId: 'PB-2024-0108', quantity: 3.5, unit: 'kg', unitCost: 5.18, totalValue: 18.13, expiryDate: '12/10/2026' },
    ],
  },
  {
    id: 'dsp-002',
    dispatchId: 'DSP-0041',
    destination: 'Samko Reading',
    destinationCode: 'REA',
    itemCount: 5,
    totalValue: 156.80,
    status: 'delivered',
    driver: 'Pradeep Kumar',
    vehicle: 'RG70 MFR',
    departureTime: '04:00',
    expectedArrival: '05:30',
    createdAt: '11/10/2026 03:30',
    createdBy: 'Suresh Pillai',
    lines: [
      { id: 'dl-002-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', quantity: 18, unit: 'kg', unitCost: 0.98, totalValue: 17.64, expiryDate: '13/10/2026' },
      { id: 'dl-002-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', quantity: 12, unit: 'kg', unitCost: 1.24, totalValue: 14.88, expiryDate: '14/10/2026' },
      { id: 'dl-002-3', productName: 'Sambar', batchId: 'PB-2024-0110', quantity: 16, unit: 'litres', unitCost: 4.82, totalValue: 77.12, expiryDate: '13/10/2026' },
      { id: 'dl-002-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', quantity: 3, unit: 'kg', unitCost: 3.42, totalValue: 10.26, expiryDate: '12/10/2026' },
      { id: 'dl-002-5', productName: 'Vada Batter', batchId: 'PB-2024-0107', quantity: 7, unit: 'kg', unitCost: 5.28, totalValue: 36.96, expiryDate: '14/10/2026' },
    ],
  },
  {
    id: 'dsp-003',
    dispatchId: 'DSP-0040',
    destination: 'Samko Dartford',
    destinationCode: 'DAR',
    itemCount: 4,
    totalValue: 134.20,
    status: 'discrepancy',
    driver: 'Rajan Selvam',
    vehicle: 'KT19 MFD',
    departureTime: '04:15',
    expectedArrival: '06:00',
    createdAt: '11/10/2026 03:45',
    createdBy: 'Meena Krishnan',
    discrepancyNote: 'Idly batter 2 kg short on delivery — driver reported vehicle space issue. GRN raised with partial acceptance. Manager approval pending.',
    lines: [
      { id: 'dl-003-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', quantity: 15, unit: 'kg', unitCost: 0.98, totalValue: 14.70, expiryDate: '13/10/2026' },
      { id: 'dl-003-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', quantity: 10, unit: 'kg', unitCost: 1.24, totalValue: 12.40, expiryDate: '14/10/2026' },
      { id: 'dl-003-3', productName: 'Sambar', batchId: 'PB-2024-0110', quantity: 14, unit: 'litres', unitCost: 4.82, totalValue: 67.48, expiryDate: '13/10/2026' },
      { id: 'dl-003-4', productName: 'White Chutney', batchId: 'PB-2024-0108', quantity: 7, unit: 'kg', unitCost: 5.66, totalValue: 39.62, expiryDate: '12/10/2026' },
    ],
  },
  {
    id: 'dsp-004',
    dispatchId: 'DSP-0039',
    destination: 'Samko Leicester',
    destinationCode: 'LEI',
    itemCount: 5,
    totalValue: 128.60,
    status: 'delivered',
    driver: 'Arjun Patel',
    vehicle: 'LE21 MFL',
    departureTime: '03:30',
    expectedArrival: '06:15',
    createdAt: '10/10/2026 22:00',
    createdBy: 'Suresh Pillai',
    lines: [
      { id: 'dl-004-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', quantity: 12, unit: 'kg', unitCost: 0.98, totalValue: 11.76, expiryDate: '13/10/2026' },
      { id: 'dl-004-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', quantity: 8, unit: 'kg', unitCost: 1.24, totalValue: 9.92, expiryDate: '14/10/2026' },
      { id: 'dl-004-3', productName: 'Sambar', batchId: 'PB-2024-0110', quantity: 12, unit: 'litres', unitCost: 4.82, totalValue: 57.84, expiryDate: '13/10/2026' },
      { id: 'dl-004-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', quantity: 2.5, unit: 'kg', unitCost: 3.42, totalValue: 8.55, expiryDate: '12/10/2026' },
      { id: 'dl-004-5', productName: 'Dosa Masala', batchId: 'PB-2024-0113', quantity: 8, unit: 'kg', unitCost: 5.07, totalValue: 40.56, expiryDate: '14/10/2026' },
    ],
  },
  {
    id: 'dsp-005',
    dispatchId: 'DSP-0043',
    destination: 'Samko Hounslow',
    destinationCode: 'HOU',
    itemCount: 3,
    totalValue: 94.20,
    status: 'reserved',
    driver: 'TBC',
    vehicle: 'TBC',
    departureTime: '08:00',
    expectedArrival: '09:30',
    createdAt: '11/10/2026 06:00',
    createdBy: 'Karthik Nair',
    lines: [
      { id: 'dl-005-1', productName: 'Dosa Masala', batchId: 'PB-2024-0113', quantity: 12, unit: 'kg', unitCost: 5.07, totalValue: 60.84, expiryDate: '14/10/2026' },
      { id: 'dl-005-2', productName: 'Vada Batter', batchId: 'PB-2024-0114', quantity: 6, unit: 'kg', unitCost: 4.14, totalValue: 24.84, expiryDate: '14/10/2026' },
      { id: 'dl-005-3', productName: 'Rasam', batchId: 'PB-2024-0106', quantity: 4, unit: 'litres', unitCost: 2.14, totalValue: 8.56, expiryDate: '11/10/2026' },
    ],
  },
  ...NEW_RESTAURANTS.flatMap((r, i): DispatchOrder[] => {
    const code = r.code.toLowerCase();
    const mk = (n: number, qty: number[]): DispatchLine[] => {
      const items = [
        { productName: 'Dosa Batter', batchId: 'PB-2024-0111', unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026' },
        { productName: 'Idly Batter', batchId: 'PB-2024-0112', unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026' },
        { productName: 'Sambar', batchId: 'PB-2024-0110', unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026' },
        { productName: 'Red Chutney', batchId: 'PB-2024-0109', unit: 'kg', unitCost: 3.42, expiryDate: '12/10/2026' },
      ];
      return items.map((it, k) => {
        const quantity = Math.max(2, Math.round(qty[k] * r.scale));
        return { id: `dl-${code}-${n}-${k + 1}`, ...it, quantity, totalValue: Number((quantity * it.unitCost).toFixed(2)) };
      });
    };
    const inTransitLines = mk(1, [20, 15, 20, 4]);
    const deliveredLines = mk(2, [16, 12, 14, 3]);
    const sum = (ls: DispatchLine[]) => Number(ls.reduce((s, l) => s + l.totalValue, 0).toFixed(2));
    return [
      {
        id: `dsp-${code}-1`,
        dispatchId: `DSP-${100 + i * 2}`,
        destination: r.fullName,
        destinationCode: r.code,
        itemCount: inTransitLines.length,
        totalValue: sum(inTransitLines),
        status: 'in-transit',
        driver: 'Vijay Murugan',
        vehicle: `LJ21 K${10 + i}R`,
        departureTime: '05:30',
        expectedArrival: '07:15',
        createdAt: '11/10/2026 04:45',
        createdBy: 'Suresh Pillai',
        lines: inTransitLines,
      },
      {
        id: `dsp-${code}-2`,
        dispatchId: `DSP-${101 + i * 2}`,
        destination: r.fullName,
        destinationCode: r.code,
        itemCount: deliveredLines.length,
        totalValue: sum(deliveredLines),
        status: 'delivered',
        driver: 'Ravi Subramanian',
        vehicle: `LK21 M${20 + i}T`,
        departureTime: '05:00',
        expectedArrival: '06:45',
        createdAt: '10/10/2026 18:30',
        createdBy: 'Karthik Nair',
        lines: deliveredLines,
      },
    ];
  }),
];