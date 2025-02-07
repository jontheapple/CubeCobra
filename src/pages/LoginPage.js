import React from 'react';
import PropTypes from 'prop-types';

import { Card, CardBody, FormGroup, Label, Input, Button, Col, Row, CardHeader } from 'reactstrap';

import CSRFForm from 'components/CSRFForm';
import DynamicFlash from 'components/DynamicFlash';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import Banner from 'components/Banner';

const LoginPage = ({ loginCallback }) => (
  <MainLayout loginCallback={loginCallback}>
    <Banner />
    <DynamicFlash />
    <Card className="my-3">
      <CardHeader>
        <h5>Login</h5>
      </CardHeader>
      <CardBody>
        <CSRFForm method="POST" action="/user/login">
          <FormGroup>
            <Row>
              <Col sm="3">
                <Label>username or email Address:</Label>
              </Col>
              <Col sm="9">
                <Input maxLength="1000" name="username" id="email" type="text" />
              </Col>
            </Row>
          </FormGroup>
          <FormGroup>
            <Row>
              <Col sm="3">
                <Label>Password:</Label>
              </Col>
              <Col sm="9">
                <Input maxLength="1000" name="password" id="password" type="password" />
              </Col>
            </Row>
            <Row>
              <Col sm="3" />
              <Col sm="9">
                <a href="/user/lostpassword">Forgot password?</a>
              </Col>
            </Row>
          </FormGroup>
          <Button type="submit" color="accent" block outline>
            Login
          </Button>
        </CSRFForm>
      </CardBody>
    </Card>
  </MainLayout>
);

LoginPage.propTypes = {
  loginCallback: PropTypes.string,
};

LoginPage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(LoginPage);
