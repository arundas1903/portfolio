export type PaymentTab = 'home' | 'history' | 'profile';

export type PaymentFlow = 'idle' | 'pay' | 'success';

export const DEMO_RECIPIENT = {
  name: 'Priya',
  upi: 'priya@okhdfcbank',
};

export function buildTransactionMessage(amount: number): string {
  return `Your transaction of amount ${amount} is successful`;
}

export const BFSI_PAYMENT_OWNER_EMAIL = 'bank@bankalerts.com';

export function getBfsiOwnerEmail(): string {
  return BFSI_PAYMENT_OWNER_EMAIL;
}

export interface Contact {
  id: string;
  name: string;
  upi: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  name: string;
  upi: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface PaymentProfile {
  name: string;
  upi: string;
  phone: string;
  email: string;
  balance: number;
}

export interface PaymentState {
  onboarded: boolean;
  profile: PaymentProfile;
  contacts: Contact[];
  transactions: Transaction[];
}

export const INITIAL_PAYMENT_STATE: PaymentState = {
  onboarded: false,
  profile: {
    name: 'Arundas',
    upi: 'arundas@okaxis',
    phone: '',
    email: '',
    balance: 10000,
  },
  contacts: [
    { id: '1', name: 'Priya', upi: 'priya@okhdfcbank', color: '#e57373' },
    { id: '2', name: 'Rahul', upi: 'rahul@paytm', color: '#64b5f6' },
    { id: '3', name: 'Ananya', upi: 'ananya@ybl', color: '#81c784' },
    { id: '4', name: 'Vikram', upi: 'vikram@okicici', color: '#ffb74d' },
    { id: '5', name: 'Meera', upi: 'meera@oksbi', color: '#ba68c8' },
  ],
  transactions: [
    {
      id: 'seed-1',
      type: 'sent',
      name: 'Priya',
      upi: 'priya@okhdfcbank',
      amount: 250,
      note: 'Lunch',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'seed-2',
      type: 'received',
      name: 'Rahul',
      upi: 'rahul@paytm',
      amount: 500,
      note: 'Split bill',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};
