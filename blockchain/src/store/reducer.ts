import type, { AddressCollection } from './types';
import { ActionTypes } from './actions';
import { dedupeArray, removeItem } from '../util';

export interface StoreState {
  startingBlockHeight: number | null;
  watchAddresses: { [contributionId: number]: AddressCollection };
  watchDisclosures: { [contributionId: number]: string };
}

const INITIAL_STATE: StoreState = {
  startingBlockHeight: null,
  watchAddresses: {},
  watchDisclosures: {},
};

export function reducer(state: StoreState = INITIAL_STATE, action: ActionTypes): StoreState {
  switch(action.type) {
    case type.SET_STARTING_BLOCK_HEIGHT:
      return {
        ...state,
        startingBlockHeight: action.payload,
      };

    case type.GENERATE_ADDRESSES:
      return {
        ...state,
        watchAddresses: {
          ...state.watchAddresses,
          [action.payload.contributionId]: action.payload.addresses,
        },
      };
    
    case type.ADD_PAYMENT_DISCLOSURE:
      return {
        ...state,
        watchDisclosures: {
          ...state.watchDisclosures,
          [action.payload.contributionId]: action.payload.disclosure,
        },
      };

    case type.CONFIRM_PAYMENT_DISCLOSURE: {
      const watchDisclosures = { ...state.watchDisclosures };
      delete watchDisclosures[action.payload.contributionId];
      return {
        ...state,
        watchDisclosures,
      };
    }
  }
  return state;
}
