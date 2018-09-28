import React from 'react';
import { connect } from 'react-redux';
import { AppState } from 'store/reducers';
import { AUTH_PROVIDER } from 'utils/auth';
import SignIn from './SignIn';
import SignUp from './SignUp';
import SelectProvider from './SelectProvider';
import ProvideIdentity from './ProvideIdentity';
import './index.less';

interface StateProps {
  web3Accounts: AppState['web3']['accounts'];
}

interface DispatchProps {}

type Props = StateProps & DispatchProps;

interface State {
  provider: AUTH_PROVIDER | null;
  address: string | null;
}

class AuthFlow extends React.Component<Props> {
  state: State = {
    provider: null,
    address: null,
  };

  private pages = {
    SIGN_IN: {
      title: 'Prove your Identity',
      subtitle: 'Log into your Grant.io account by proving your identity',
      render: () => <SignIn />,
    },
    SIGN_UP: {
      title: 'Claim your Identity',
      subtitle: 'Create a Grant.io account by claiming your identity',
      render: () => <SignUp />,
    },
    SELECT_PROVIDER: {
      title: 'Provide an Identity',
      subtitle: 'Sign in or create a new account by selecting your identity provider',
      render: () => <SelectProvider onSelect={this.setProvider} />,
    },
    PROVIDE_ADDRESS: {
      title: 'Provide an Identity',
      subtitle: 'Enter your Ethereum Address',
      render: () => (
        <ProvideIdentity
          onSelectAddress={this.setAddress}
          provider={this.state.provider}
        />
      ),
    },
  };

  componentDidMount() {
    // If web3 is available, default to it
    const { web3Accounts } = this.props;
    if (web3Accounts && web3Accounts[0]) {
      this.setState({
        provider: AUTH_PROVIDER.WEB3,
        address: web3Accounts[0],
      });
    }
  }

  render() {
    const { provider, address } = this.state;
    let page;

    if (provider) {
      if (address) {
        // TODO: If address results in user, show SIGN_IN.
        page = this.pages.SIGN_UP;
      } else {
        page = this.pages.PROVIDE_ADDRESS;
      }
    } else {
      page = this.pages.SELECT_PROVIDER;
    }

    return (
      <div className="AuthFlow">
        <h1 className="AuthFlow-title">{page.title}</h1>
        <p className="AuthFlow-subtitle">{page.subtitle}</p>
        <div className="AuthFlow-content">{page.render()}</div>
      </div>
    );
  }

  private setProvider = (provider: AUTH_PROVIDER) => {
    this.setState({ provider });
  };

  private setAddress = (address: string) => {
    this.setState({ address });
  };
}

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    web3Accounts: state.web3.accounts,
  }),
  {},
)(AuthFlow);
