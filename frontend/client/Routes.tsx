import React from 'react';
import { hot } from 'react-hot-loader';
import { Switch, Route, Redirect } from 'react-router';
import AuthRoute from 'components/AuthRoute';
import loadable from 'loadable-components';

// wrap components in loadable...import & they will be split
const Home = loadable(() => import('pages/index'));
const Create = loadable(() => import('pages/create'));
const Proposals = loadable(() => import('pages/proposals'));
const Proposal = loadable(() => import('pages/proposal'));
const Auth = loadable(() => import('pages/auth'));
const Profile = loadable(() => import('pages/profile'));

import 'styles/style.less';

class Routes extends React.Component<any> {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/create" component={Create} />
        <Route exact path="/proposals" component={Proposals} />
        <Route path="/proposals/:id" component={Proposal} />
        <AuthRoute exact path="/profile" component={Profile} />
        <AuthRoute path="/auth" component={Auth} onlyLoggedOut />
        {/* TODO: Replace with 404 */}
        <Route path="/*" render={() => <Redirect to="/" />} />
      </Switch>
    );
  }
}

export default hot(module)(Routes);
