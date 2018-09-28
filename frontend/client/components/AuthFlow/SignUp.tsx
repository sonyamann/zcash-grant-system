import React from 'react';
import { Form, Input, Button } from 'antd';
import Identicon from 'components/Identicon';
import ShortAddress from 'components/ShortAddress';
import { AUTH_PROVIDER } from 'utils/auth';
import './SignUp.less';

interface Props {
  address: string;
  provider: AUTH_PROVIDER;
}

interface State {
  name: string;
  email: string;
}

export default class SignUp extends React.PureComponent<Props, State> {
  state: State = {
    name: '',
    email: '',
  };

  render() {
    const { address } = this.props;
    const { name, email } = this.state;
    return (
      <div className="SignUp">
        <div className="SignUp-identity">
          <Identicon address={address} className="SignUp-identity-identicon" />
          <ShortAddress address={address} className="SignUp-identity-address" />
        </div>

        <Form className="SignUp-form" onSubmit={this.handleSubmit} layout="vertical">
          <Form.Item className="SignUp-form-item" label="Display name">
            <Input
              name="name"
              value={name}
              onChange={this.handleChange}
              placeholder="Non-unique name that others will see you as"
              size="large"
            />
          </Form.Item>

          <Form.Item className="SignUp-form-item" label="Email address">
            <Input
              name="email"
              value={email}
              onChange={this.handleChange}
              placeholder="We promise not to spam you or share your email"
              size="large"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block>
            Claim Identity
          </Button>
        </Form>
      </div>
    );
  }

  private handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.currentTarget;
    this.setState({ [name]: value } as any);
  };

  private handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    console.log(this.state);
  };
}
