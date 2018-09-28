import React from 'react';
import { AUTH_PROVIDER } from 'utils/auth';
import AddressProvider from './providers/Address';
import LedgerProvider from './providers/Ledger';
import TrezorProvider from './providers/Trezor';
import Web3Provider from './providers/Web3';

interface Props {
  provider: AUTH_PROVIDER;
  onSelectAddress(addr: string): void;
}

export default (props: Props) => {
  switch (props.provider) {
    case AUTH_PROVIDER.ADDRESS:
      return <AddressProvider onSelectAddress={props.onSelectAddress} />;
    case AUTH_PROVIDER.LEDGER:
      return <LedgerProvider onSelectAddress={props.onSelectAddress} />;
    case AUTH_PROVIDER.TREZOR:
      return <TrezorProvider onSelectAddress={props.onSelectAddress} />;
    case AUTH_PROVIDER.WEB3:
      return <Web3Provider onSelectAddress={props.onSelectAddress} />;
  }
};
