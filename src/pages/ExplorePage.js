import React from 'react';
import PropTypes from 'prop-types';
import CubePropType from 'proptypes/CubePropType';

import { Col, Row } from 'reactstrap';
import CubesCard from 'components/CubesCard';
import CubeSearchNavBar from 'components/CubeSearchNavBar';
import DynamicFlash from 'components/DynamicFlash';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';

const ExplorePage = ({ recents, featured, drafted, popular, loginCallback }) => {
  return (
    <MainLayout loginCallback={loginCallback}>
      <CubeSearchNavBar />
      <DynamicFlash />
      <Row>
        <Col lg={6} md={6} sm={12} xs={12}>
          <CubesCard title="featured cubes" className="mt-4" cubes={featured} />
          <CubesCard title="Recently Updated cubes" className="mt-4" cubes={recents} />
        </Col>
        <Col lg={6} md={6} sm={12} xs={12}>
          <CubesCard title="Most Popular cubes" className="mt-4" cubes={popular} />
          <CubesCard title="Recently drafted cubes" className="mt-4" cubes={drafted} />
        </Col>
      </Row>
    </MainLayout>
  );
};

const cubesListProp = PropTypes.arrayOf(CubePropType);

ExplorePage.propTypes = {
  recents: cubesListProp.isRequired,
  featured: cubesListProp.isRequired,
  drafted: cubesListProp.isRequired,
  popular: cubesListProp.isRequired,
  loginCallback: PropTypes.string,
};

ExplorePage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(ExplorePage);
