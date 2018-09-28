export enum AUTH_PROVIDER {
  WEB3 = 'WEB3',
  LEDGER = 'LEDGER',
  TREZOR = 'TREZOR',
  ADDRESS = 'ADDRESS',
}

interface AuthProvider {
  type: AUTH_PROVIDER;
  name: string;
}

export const AUTH_PROVIDERS: { [key in AUTH_PROVIDER]: AuthProvider } = {
  [AUTH_PROVIDER.WEB3]: {
    type: AUTH_PROVIDER.WEB3,
    name: 'MetaMask', // TODO: Set dynamically based on provider
  },
  [AUTH_PROVIDER.LEDGER]: {
    type: AUTH_PROVIDER.LEDGER,
    name: 'Ledger',
  },
  [AUTH_PROVIDER.TREZOR]: {
    type: AUTH_PROVIDER.TREZOR,
    name: 'TREZOR',
  },
  [AUTH_PROVIDER.ADDRESS]: {
    type: AUTH_PROVIDER.ADDRESS,
    name: 'Address',
  },
};
