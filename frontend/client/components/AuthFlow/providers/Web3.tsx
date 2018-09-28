import React from 'react';

interface Props {
  onSelectAddress(addr: string): void;
}

export default (p: Props) => <div>{typeof p}</div>;
