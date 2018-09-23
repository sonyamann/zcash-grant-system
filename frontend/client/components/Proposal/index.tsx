import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import Markdown from 'components/Markdown';
import { proposalActions } from 'modules/proposals';
import { bindActionCreators, Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import { ProposalWithCrowdFund } from 'modules/proposals/reducers';
import { getProposal } from 'modules/proposals/selectors';
import { Spin, Tabs, Icon } from 'antd';
import CampaignBlock from './CampaignBlock';
import TeamBlock from './TeamBlock';
import Milestones from './Milestones';

import CommentsTab from './Comments';
import UpdatesTab from './Updates';
import GovernanceTab from './Governance';
import ContributorsTab from './Contributors';
// import CommunityTab from './Community';
import './style.less';
import classnames from 'classnames';
import { withRouter } from 'react-router';
import Web3Container from 'lib/Web3Container';
import { web3Actions } from 'modules/web3';

interface OwnProps {
  proposalId: string;
  isPreview?: boolean;
}

interface StateProps {
  proposal: ProposalWithCrowdFund;
}

interface DispatchProps {
  fetchProposal: proposalActions.TFetchProposal;
}

type Props = StateProps & DispatchProps & OwnProps;

interface State {
  isBodyExpanded: boolean;
  isBodyOverflowing: boolean;
  bodyId: string;
}

export class ProposalDetail extends React.Component<Props, State> {
  state: State = {
    isBodyExpanded: false,
    isBodyOverflowing: false,
    bodyId: `body-${Math.floor(Math.random() * 1000000)}`,
  };

  componentDidMount() {
    if (!this.props.proposal) {
      this.props.fetchProposal(this.props.proposalId);
    } else {
      this.checkBodyOverflow();
    }
    window.addEventListener('resize', this.checkBodyOverflow);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkBodyOverflow);
  }

  componentDidUpdate() {
    if (this.props.proposal) {
      this.checkBodyOverflow();
    }
  }

  render() {
    const { proposal, isPreview } = this.props;
    const { isBodyExpanded, isBodyOverflowing, bodyId } = this.state;
    const showExpand = !isBodyExpanded && isBodyOverflowing;

    if (!proposal) {
      return <Spin />;
    } else {
      const { crowdFund } = proposal;
      return (
        <div className="Proposal">
          <div className="Proposal-top">
            <div className="Proposal-top-main">
              <h1 className="Proposal-top-main-title">
                {proposal ? proposal.title : <span>&nbsp;</span>}
              </h1>
              <div className="Proposal-top-main-block" style={{ flexGrow: 1 }}>
                <div
                  id={bodyId}
                  className={classnames({
                    ['Proposal-top-main-block-bodyText']: true,
                    ['is-expanded']: isBodyExpanded,
                  })}
                >
                  {proposal ? <Markdown source={proposal.body} /> : <Spin size="large" />}
                </div>
                {showExpand && (
                  <button
                    className="Proposal-top-main-block-bodyExpand"
                    onClick={this.expandBody}
                  >
                    Read more <Icon type="arrow-down" style={{ fontSize: '0.7rem' }} />
                  </button>
                )}
              </div>
            </div>
            <div className="Proposal-top-side">
              <CampaignBlock proposal={proposal} isPreview={isPreview} />
              <TeamBlock crowdFund={crowdFund} />
            </div>
          </div>

          {proposal && (
            <Tabs>
              <Tabs.TabPane tab="Milestones" key="milestones">
                <div style={{ marginTop: '1.5rem', padding: '0 2rem' }}>
                  <Milestones proposal={proposal} />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Discussion" key="discussions" disabled={isPreview}>
                <CommentsTab proposalId={proposal.proposalId} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Updates" key="updates" disabled={isPreview}>
                <div style={{ marginTop: '1.5rem' }} />
                <UpdatesTab proposalId={proposal.proposalId} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Governance" key="governance">
                <GovernanceTab proposal={proposal} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Contributors" key="contributors">
                <ContributorsTab crowdFund={proposal.crowdFund} />
              </Tabs.TabPane>
            </Tabs>
          )}
        </div>
      );
    }
  }

  private expandBody = () => {
    this.setState({ isBodyExpanded: true });
  };

  private checkBodyOverflow = () => {
    const { isBodyExpanded, bodyId, isBodyOverflowing } = this.state;
    if (isBodyExpanded) {
      return;
    }

    // Use id instead of ref because styled component ref doesn't return html element
    const bodyEl = document.getElementById(bodyId);
    if (!bodyEl) {
      return;
    }

    if (isBodyOverflowing && bodyEl.scrollHeight <= bodyEl.clientHeight) {
      this.setState({ isBodyOverflowing: false });
    } else if (!isBodyOverflowing && bodyEl.scrollHeight > bodyEl.clientHeight) {
      this.setState({ isBodyOverflowing: true });
    }
  };
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    proposal: getProposal(state, ownProps.proposalId),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return bindActionCreators({ ...proposalActions, ...web3Actions }, dispatch);
}

const withConnect = connect<StateProps, DispatchProps, OwnProps, AppState>(
  mapStateToProps,
  mapDispatchToProps,
);

const ConnectedProposal = compose<Props, OwnProps>(
  withRouter,
  withConnect,
)(ProposalDetail);

export default (props: OwnProps) => (
  <Web3Container
    renderLoading={() => (
      <div className="Proposal">
        <div className="Proposal-top">
          <div className="Proposal-top-main">
            <Spin />
          </div>
        </div>
      </div>
    )}
    render={() => <ConnectedProposal {...props} />}
  />
);
