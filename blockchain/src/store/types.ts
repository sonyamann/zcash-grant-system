enum ACTION_TYPE {
  SET_STARTING_BLOCK_HEIGHT = 'SET_STARTING_BLOCK_HEIGHT',
  GENERATE_ADDRESSES = 'GENERATE_ADDRESSES',
  ADD_PAYMENT_DISCLOSURE = 'ADD_PAYMENT_DISCLOSURE',
  CONFIRM_PAYMENT_DISCLOSURE = 'CONFIRM_PAYMENT_DISCLOSURE',
}

export default ACTION_TYPE;

export interface AddressCollection {
  transparent: string;
  sprout: string;
}
