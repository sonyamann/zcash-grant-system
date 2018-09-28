import React from 'react';
import { Form, Input, Button } from 'antd';
import { AUTH_PROVIDER, AUTH_PROVIDERS, generateAuthMessage } from 'utils/auth';

interface Props {
  provider: AUTH_PROVIDER;
  address: string;
  onSign(signedMessage: string, rawMessage: string): void;
}

interface State {
  rawMessage: string;
  signedMessage: string;
}

export class SignMessageForm extends React.PureComponent<Props, State> {
  state: State = {
    rawMessage: generateAuthMessage(this.props.address),
    signedMessage: '',
  };

  render() {
    const { rawMessage, signedMessage } = this.state;
    const provider = AUTH_PROVIDERS[this.props.provider];

    if (provider.canSignMessage) {
      return (
        <Button type="primary" onClick={this.signMessage}>
          Prove Identity
        </Button>
      );
    } else {
      return (
        <Form onSubmit={this.handleSubmit}>
          <Form.Item label="Message to sign">
            <Input.TextArea value={rawMessage} readOnly />
          </Form.Item>

          <Form.Item label="Signed message">
            <Input.TextArea
              value={signedMessage}
              onChange={this.handleChange}
              placeholder="Paste the signed message here"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block>
            Prove Identity
          </Button>
        </Form>
      );
    }
  }

  private signMessage = () => {
    // TODO: Move this logic into redux?
  };

  private handleChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ signedMessage: ev.currentTarget.value });
  };

  private handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    // TODO: Verify signed message is legit, otherwise show error
  };
}
