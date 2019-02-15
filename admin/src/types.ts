// backend
export interface SocialMedia {
  url: string;
  service: string;
  username: string;
}
// NOTE: sync with backend/grant/utils/enums.py MilestoneStage
export enum MILESTONE_STAGE {
  IDLE = 'IDLE',
  REQUESTED = 'REQUESTED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  PAID = 'PAID',
}
export interface Milestone {
  id: number;
  index: number;
  content: string;
  dateCreated: number;
  dateEstimated: number;
  dateRequested: number;
  dateAccepted: number;
  dateRejected: number;
  datePaid: number;
  immediatePayout: boolean;
  payoutPercent: string;
  stage: string;
  title: string;
}
// NOTE: sync with backend/grant/utils/enums.py RFPStatus
export enum RFP_STATUS {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  CLOSED = 'CLOSED',
}
export interface RFP {
  id: number;
  dateCreated: number;
  title: string;
  brief: string;
  content: string;
  category: string;
  status: string;
  proposals: Proposal[];
}
export interface RFPArgs {
  title: string;
  brief: string;
  content: string;
  category: string;
  status?: string;
}
// NOTE: sync with backend/grant/utils/enums.py ProposalArbiterStatus
export enum PROPOSAL_ARBITER_STATUS {
  MISSING = 'MISSING',
  NOMINATED = 'NOMINATED',
  ACCEPTED = 'ACCEPTED',
}
export interface ProposalArbiter {
  user?: User;
  proposal: Proposal;
  status: PROPOSAL_ARBITER_STATUS;
}
// NOTE: sync with backend/grant/utils/enums.py ProposalStatus
export enum PROPOSAL_STATUS {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LIVE = 'LIVE',
  DELETED = 'DELETED',
  STAKING = 'STAKING',
}
export interface Proposal {
  proposalId: number;
  brief: string;
  status: PROPOSAL_STATUS;
  payoutAddress: string;
  dateCreated: number;
  dateApproved: number;
  datePublished: number;
  title: string;
  content: string;
  stage: string;
  category: string;
  milestones: Milestone[];
  currentMilestone?: Milestone;
  team: User[];
  comments: Comment[];
  contractStatus: string;
  target: string;
  contributed: string;
  funded: string;
  rejectReason: string;
  contributionMatching: number;
  rfp?: RFP;
  arbiter: ProposalArbiter;
}
export interface Comment {
  commentId: string;
  proposalId: Proposal['proposalId'];
  proposal?: Proposal;
  dateCreated: number;
  content: string;
}
// NOTE: sync with backend/utils/enums.py
export enum CONTRIBUTION_STATUS {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DELETED = 'DELETED',
}
export interface Contribution {
  id: number;
  status: CONTRIBUTION_STATUS;
  txId: null | string;
  amount: string;
  dateCreated: number;
  user: User;
  proposal: Proposal;
  addresses: {
    transparent: string;
    sprout: string;
    memo: string;
  };
}
export interface ContributionArgs {
  proposalId: string | number;
  userId: string | number;
  amount: string;
  status: string;
  txId?: string;
}
export interface User {
  accountAddress: string;
  avatar: null | { imageUrl: string };
  displayName: string;
  emailAddress: string;
  socialMedias: SocialMedia[];
  title: string;
  userid: number;
  proposals: Proposal[];
  comments: Comment[];
  contributions: Contribution[];
  silenced: boolean;
  banned: boolean;
  bannedReason: string;
}

export interface EmailExample {
  info: {
    subject: string;
    title: string;
    preview: string;
  };
  html: string;
  text: string;
}

export enum PROPOSAL_CATEGORY {
  DAPP = 'DAPP',
  DEV_TOOL = 'DEV_TOOL',
  CORE_DEV = 'CORE_DEV',
  COMMUNITY = 'COMMUNITY',
  DOCUMENTATION = 'DOCUMENTATION',
  ACCESSIBILITY = 'ACCESSIBILITY',
}

export interface PageQuery {
  page: number;
  filters: string[];
  search: string;
  sort: string;
}

export interface PageData<T> extends PageQuery {
  pageSize: number;
  total: number;
  items: T[];
  fetching: boolean;
  fetched: boolean;
}
