import { NEW_RESTAURANTS } from '@/contexts/AuthContext';

export interface GRNLine {
  id: string;
  productName: string;
  batchId: string;
  expectedQty: number;
  receivedQty: number | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  unit: string;
  unitCost: number;
  expiryDate: string;
  temperature: string | null;
  condition: 'good' | 'damaged' | 'short' | 'missing' | 'pending';
  note: string;
}

export interface GRN {
  id: string;
  grnId: string;
  dispatchRef: string;
  restaurant: string;
  restaurantCode: string;
  receivedBy: string;
  receivedAt: string;
  status: 'pending' | 'in-progress' | 'completed' | 'discrepancy' | 'approved';
  totalExpectedValue: number;
  totalAcceptedValue: number;
  discrepancyValue: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  lines: GRNLine[];
  notes: string;
}

export const grnRecords: GRN[] = [
  {
    id: 'grn-001',
    grnId: 'GRN-0089',
    dispatchRef: 'DSP-0040',
    restaurant: 'Samko Dartford',
    restaurantCode: 'DAR',
    receivedBy: 'Priya Sundaram',
    receivedAt: '11/10/2026 06:04',
    status: 'discrepancy',
    totalExpectedValue: 134.20,
    totalAcceptedValue: 121.80,
    discrepancyValue: 12.40,
    approvalStatus: 'pending',
    approvedBy: null,
    notes: 'Idly batter 2 kg short on delivery. Driver confirmed vehicle capacity issue. Photographs taken.',
    lines: [
      { id: 'grnl-001-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', expectedQty: 15, receivedQty: 15, acceptedQty: 15, rejectedQty: 0, unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-001-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', expectedQty: 10, receivedQty: 8, acceptedQty: 8, rejectedQty: 0, unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026', temperature: '4°C', condition: 'short', note: '2 kg not delivered — driver capacity issue' },
      { id: 'grnl-001-3', productName: 'Sambar', batchId: 'PB-2024-0110', expectedQty: 14, receivedQty: 14, acceptedQty: 14, rejectedQty: 0, unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-001-4', productName: 'White Chutney', batchId: 'PB-2024-0108', expectedQty: 7, receivedQty: 7, acceptedQty: 7, rejectedQty: 0, unit: 'kg', unitCost: 5.66, expiryDate: '12/10/2026', temperature: '4°C', condition: 'good', note: '' },
    ],
  },
  {
    id: 'grn-002',
    grnId: 'GRN-0088',
    dispatchRef: 'DSP-0041',
    restaurant: 'Samko Reading',
    restaurantCode: 'REA',
    receivedBy: 'Anbu Selvam',
    receivedAt: '11/10/2026 05:38',
    status: 'approved',
    totalExpectedValue: 156.80,
    totalAcceptedValue: 156.80,
    discrepancyValue: 0,
    approvalStatus: 'approved',
    approvedBy: 'Ravi Kumar',
    notes: 'All items received in good condition. Temperature checks passed.',
    lines: [
      { id: 'grnl-002-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', expectedQty: 18, receivedQty: 18, acceptedQty: 18, rejectedQty: 0, unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', temperature: '3°C', condition: 'good', note: '' },
      { id: 'grnl-002-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', expectedQty: 12, receivedQty: 12, acceptedQty: 12, rejectedQty: 0, unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026', temperature: '3°C', condition: 'good', note: '' },
      { id: 'grnl-002-3', productName: 'Sambar', batchId: 'PB-2024-0110', expectedQty: 16, receivedQty: 16, acceptedQty: 16, rejectedQty: 0, unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-002-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', expectedQty: 3, receivedQty: 3, acceptedQty: 3, rejectedQty: 0, unit: 'kg', unitCost: 3.42, expiryDate: '12/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-002-5', productName: 'Vada Batter', batchId: 'PB-2024-0107', expectedQty: 7, receivedQty: 7, acceptedQty: 7, rejectedQty: 0, unit: 'kg', unitCost: 5.28, expiryDate: '14/10/2026', temperature: '3°C', condition: 'good', note: '' },
    ],
  },
  {
    id: 'grn-003',
    grnId: 'GRN-0087',
    dispatchRef: 'DSP-0039',
    restaurant: 'Samko Leicester',
    restaurantCode: 'LEI',
    receivedBy: 'Nandini Pillai',
    receivedAt: '11/10/2026 06:22',
    status: 'approved',
    totalExpectedValue: 128.60,
    totalAcceptedValue: 128.60,
    discrepancyValue: 0,
    approvalStatus: 'approved',
    approvedBy: 'Ravi Kumar',
    notes: '',
    lines: [
      { id: 'grnl-003-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', expectedQty: 12, receivedQty: 12, acceptedQty: 12, rejectedQty: 0, unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-003-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', expectedQty: 8, receivedQty: 8, acceptedQty: 8, rejectedQty: 0, unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-003-3', productName: 'Sambar', batchId: 'PB-2024-0110', expectedQty: 12, receivedQty: 12, acceptedQty: 12, rejectedQty: 0, unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-003-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', expectedQty: 2.5, receivedQty: 2.5, acceptedQty: 2.5, rejectedQty: 0, unit: 'kg', unitCost: 3.42, expiryDate: '12/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-003-5', productName: 'Dosa Masala', batchId: 'PB-2024-0113', expectedQty: 8, receivedQty: 8, acceptedQty: 8, rejectedQty: 0, unit: 'kg', unitCost: 5.07, expiryDate: '14/10/2026', temperature: '5°C', condition: 'good', note: '' },
    ],
  },
  {
    id: 'grn-004',
    grnId: 'GRN-0086',
    dispatchRef: 'DSP-0038',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    receivedBy: 'Suresh Patel',
    receivedAt: '10/10/2026 06:15',
    status: 'completed',
    totalExpectedValue: 210.40,
    totalAcceptedValue: 204.90,
    discrepancyValue: 5.50,
    approvalStatus: 'approved',
    approvedBy: 'Ravi Kumar',
    notes: 'Minor short delivery on paneer — accepted with note.',
    lines: [
      { id: 'grnl-004-1', productName: 'Dosa Batter', batchId: 'PB-2024-0104', expectedQty: 25, receivedQty: 25, acceptedQty: 25, rejectedQty: 0, unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
      { id: 'grnl-004-2', productName: 'Paneer', batchId: 'SUPP-PAN-0041', expectedQty: 10, receivedQty: 9.5, acceptedQty: 9.5, rejectedQty: 0, unit: 'kg', unitCost: 5.50, expiryDate: '14/10/2026', temperature: '3°C', condition: 'short', note: '0.5 kg short — supplier short delivery' },
      { id: 'grnl-004-3', productName: 'Sambar', batchId: 'PB-2024-0109', expectedQty: 20, receivedQty: 20, acceptedQty: 20, rejectedQty: 0, unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', temperature: '4°C', condition: 'good', note: '' },
    ],
  },
  {
    id: 'grn-005',
    grnId: 'GRN-0090',
    dispatchRef: 'DSP-0042',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    receivedBy: 'Pending',
    receivedAt: 'Expected 07:00',
    status: 'pending',
    totalExpectedValue: 182.40,
    totalAcceptedValue: 0,
    discrepancyValue: 0,
    approvalStatus: 'pending',
    approvedBy: null,
    notes: 'Delivery in transit — DSP-0042 expected 07:00.',
    lines: [
      { id: 'grnl-005-1', productName: 'Dosa Batter', batchId: 'PB-2024-0111', expectedQty: 20, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', temperature: null, condition: 'pending', note: '' },
      { id: 'grnl-005-2', productName: 'Idly Batter', batchId: 'PB-2024-0112', expectedQty: 15, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026', temperature: null, condition: 'pending', note: '' },
      { id: 'grnl-005-3', productName: 'Sambar', batchId: 'PB-2024-0110', expectedQty: 20, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', temperature: null, condition: 'pending', note: '' },
      { id: 'grnl-005-4', productName: 'Red Chutney', batchId: 'PB-2024-0109', expectedQty: 4, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: 'kg', unitCost: 3.42, expiryDate: '12/10/2026', temperature: null, condition: 'pending', note: '' },
      { id: 'grnl-005-5', productName: 'White Chutney', batchId: 'PB-2024-0108', expectedQty: 3.5, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: 'kg', unitCost: 5.18, expiryDate: '12/10/2026', temperature: null, condition: 'pending', note: '' },
    ],
  },
  ...NEW_RESTAURANTS.flatMap((r, i): GRN[] => {
    const code = r.code.toLowerCase();
    const items = [
      { productName: 'Dosa Batter', batchId: 'PB-2024-0111', unit: 'kg', unitCost: 0.98, expiryDate: '13/10/2026', base: 16 },
      { productName: 'Idly Batter', batchId: 'PB-2024-0112', unit: 'kg', unitCost: 1.24, expiryDate: '14/10/2026', base: 12 },
      { productName: 'Sambar', batchId: 'PB-2024-0110', unit: 'litres', unitCost: 4.82, expiryDate: '13/10/2026', base: 14 },
    ];
    const completedLines: GRNLine[] = items.map((it, k) => {
      const q = Math.max(2, Math.round(it.base * r.scale));
      return { id: `grnl-${code}-1-${k + 1}`, productName: it.productName, batchId: it.batchId, expectedQty: q, receivedQty: q, acceptedQty: q, rejectedQty: 0, unit: it.unit, unitCost: it.unitCost, expiryDate: it.expiryDate, temperature: '4°C', condition: 'good', note: '' };
    });
    const pendingLines: GRNLine[] = items.map((it, k) => {
      const q = Math.max(2, Math.round((it.base + 4) * r.scale));
      return { id: `grnl-${code}-2-${k + 1}`, productName: it.productName, batchId: it.batchId, expectedQty: q, receivedQty: null, acceptedQty: null, rejectedQty: null, unit: it.unit, unitCost: it.unitCost, expiryDate: it.expiryDate, temperature: null, condition: 'pending', note: '' };
    });
    const val = (ls: GRNLine[]) => Number(ls.reduce((s, l) => s + l.expectedQty * l.unitCost, 0).toFixed(2));
    const completedVal = val(completedLines);
    return [
      {
        id: `grn-${code}-1`,
        grnId: `GRN-${200 + i * 2}`,
        dispatchRef: `DSP-${101 + i * 2}`,
        restaurant: r.fullName,
        restaurantCode: r.code,
        receivedBy: r.managerName,
        receivedAt: '11/10/2026 06:50',
        status: 'completed',
        totalExpectedValue: completedVal,
        totalAcceptedValue: completedVal,
        discrepancyValue: 0,
        approvalStatus: 'approved',
        approvedBy: r.managerName,
        notes: 'Delivery received in full. Temperatures checked on arrival.',
        lines: completedLines,
      },
      {
        id: `grn-${code}-2`,
        grnId: `GRN-${201 + i * 2}`,
        dispatchRef: `DSP-${100 + i * 2}`,
        restaurant: r.fullName,
        restaurantCode: r.code,
        receivedBy: 'Pending',
        receivedAt: 'Expected 07:15',
        status: 'pending',
        totalExpectedValue: val(pendingLines),
        totalAcceptedValue: 0,
        discrepancyValue: 0,
        approvalStatus: 'pending',
        approvedBy: null,
        notes: `Delivery in transit — DSP-${100 + i * 2} expected 07:15.`,
        lines: pendingLines,
      },
    ];
  }),
];