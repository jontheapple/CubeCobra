import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

import {
  Spinner,
  Card,
  CardBody,
  Row,
  Col,
  Nav,
  UncontrolledAlert,
  Button,
  InputGroup,
  InputGroupText,
  Input,
} from 'reactstrap';

import { csrfFetch } from 'utils/CSRF';

import UserContext from 'contexts/UserContext';
import DynamicFlash from 'components/DynamicFlash';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import Banner from 'components/Banner';
import useQueryParam from 'hooks/useQueryParam';
import Tab from 'components/Tab';
import CreatePackageModal from 'components/CreatePackageModal';
import withModal from 'components/WithModal';
import CardPackage from 'components/CardPackage';
import Paginate from 'components/Paginate';

const CreatePackageModalLink = withModal(Button, CreatePackageModal);

const PAGE_SIZE = 20;

const tabTypes = {
  '0': 'approved',
  '1': 'pending',
  '2': 'yourpackages',
};

const BrowsePackagesPage = ({ loginCallback }) => {
  const user = useContext(UserContext);
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useQueryParam('p', 0);
  const [filter, setFilter] = useQueryParam('f', '');
  const [filterTemp, setFilterTemp] = useState('');
  const [sort, setSort] = useQueryParam('s', 'votes');
  const [sortDirection, setSortDirection] = useQueryParam('d', '-1');
  const [selectedTab, setSelectedTab] = useQueryParam('tab', '0');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [lastKey, setLastKey] = useState(null);

  const addAlert = (color, message) => {
    setAlerts([...alerts, { color, message }]);
    setRefresh(true);
  };

  const changeTab = (i) => {
    setPage(0);
    setLastKey(null);
    setSelectedTab(i);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (refresh) {
        setRefresh(false);
      }
      setLoading(true);
      const post = filter.length > 0 ? `/${filter}` : '';
      const response = await csrfFetch(`/packages/getpackages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: tabTypes[selectedTab],
          keywords: post,
          lastKey,
          ascending: sortDirection,
        }),
      });
      if (response.ok) {
        const json = await response.json();
        setTotal(json.total);
        setLoading(false);
        setPackages(json.packages);
        setLastKey(json.lastKey);
      }
      return [];
    };
    fetchData().then(() => setFilterTemp(filter));
  }, [filter, page, sort, sortDirection, selectedTab, refresh, setRefresh, lastKey]);

  return (
    <MainLayout loginCallback={loginCallback}>
      <Banner />
      <DynamicFlash />
      {alerts.map(({ color, message }, index) => (
        <UncontrolledAlert color={color} key={/* eslint-disable-line react/no-array-index-key */ index}>
          {message}
        </UncontrolledAlert>
      ))}
      <Card>
        <div className="usercontrols pt-3 mb-3">
          <Row className="pb-3 me-1">
            <Col xs="6">
              <h3 className="mx-3">Browse Card Packages</h3>
            </Col>
            {user && (
              <Col xs="6">
                <div className="text-end">
                  <CreatePackageModalLink
                    outline
                    color="accent"
                    modalProps={{
                      onError: (message) => {
                        addAlert('danger', message);
                      },
                      onSuccess: (message) => {
                        addAlert('success', message);
                      },
                    }}
                  >
                    Create New Package
                  </CreatePackageModalLink>
                </div>
              </Col>
            )}
          </Row>
          <InputGroup className="mb-3 px-3">
            <InputGroupText htmlFor="filterInput">keywords</InputGroupText>
            <Input
              type="text"
              placeholder="Search for keywords or packages that include a card..."
              disabled={loading}
              valid={filterTemp !== filter}
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value)}
              onKeyDown={(e) => e.keyCode === 13 && setFilter(filterTemp)}
            />
            <Button color="accent" className="square-left" onClick={() => setFilter(filterTemp)}>
              Apply
            </Button>
          </InputGroup>
          <Row className="px-3">
            <Col xs={12} sm={6}>
              <InputGroup className="mb-3">
                <InputGroupText>Sort: </InputGroupText>
                <Input type="select" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="votes">Votes</option>
                  <option value="date">date</option>
                </Input>
              </InputGroup>
            </Col>
            <Col xs={12} sm={6}>
              <InputGroup className="mb-3">
                <InputGroupText>Direction: </InputGroupText>
                <Input type="select" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
                  <option value="1">Ascending</option>
                  <option value="-1">Descending</option>
                </Input>
              </InputGroup>
            </Col>
          </Row>
        </div>
        <Nav tabs>
          <Tab tab={selectedTab} setTab={changeTab} index="0">
            Approved
          </Tab>
          <Tab tab={selectedTab} setTab={changeTab} index="1">
            Submitted
          </Tab>
          {user && (
            <Tab tab={selectedTab} setTab={changeTab} index="2">
              Your Packages
            </Tab>
          )}
        </Nav>
        <CardBody>
          {total / PAGE_SIZE > 1 && (
            <Paginate count={Math.ceil(total / PAGE_SIZE)} active={page} onClick={(i) => setPage(i)} />
          )}
          {loading ? (
            <div className="centered py-3">
              <Spinner className="position-absolute" />
            </div>
          ) : (
            packages.map((pack) => <CardPackage key={pack.id} cardPackage={pack} refresh={() => setRefresh(true)} />)
          )}
          {total / PAGE_SIZE > 1 && (
            <Paginate count={Math.ceil(total / PAGE_SIZE)} active={page} onClick={(i) => setPage(i)} />
          )}
        </CardBody>
      </Card>
    </MainLayout>
  );
};

BrowsePackagesPage.propTypes = {
  loginCallback: PropTypes.string,
};

BrowsePackagesPage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(BrowsePackagesPage);
