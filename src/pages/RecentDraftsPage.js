import React from 'react';
import PropTypes from 'prop-types';
import DeckPropType from 'proptypes/DeckPropType';

import DeckPreview from 'components/DeckPreview';
import Paginate from 'components/Paginate';
import DynamicFlash from 'components/DynamicFlash';
import Banner from 'components/Banner';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';

import { Card, Col, Row, CardHeader, CardBody, CardFooter } from 'reactstrap';

const PER_PAGE = 30;

const RecentDraftsPage = ({ decks, currentPage, totalPages, count, loginCallback }) => (
  <MainLayout loginCallback={loginCallback}>
    <Banner />
    <DynamicFlash />
    <Row className="my-3">
      <Col xs="12">
        <Card>
          <CardHeader>
            {totalPages > 1 ? (
              <>
                <h5>
                  {`Displaying ${PER_PAGE * currentPage + 1}-${Math.min(
                    count,
                    PER_PAGE * (currentPage + 1),
                  )} of ${count} Drafts of Your cubes`}
                </h5>
                <Paginate count={totalPages} active={currentPage} urlF={(i) => `/dashboard/decks/${i}`} />
              </>
            ) : (
              <h5>{`Displaying all ${count} Drafts of Your cubes`}</h5>
            )}
          </CardHeader>
          <CardBody className="p-0">
            {decks.length > 0 ? (
              decks.map((deck) => <DeckPreview key={deck.id} deck={deck} nextURL="/dashboard" canEdit />)
            ) : (
              <p className="m-2">
                Nobody has drafted your cubes! Perhaps try reaching out on the{' '}
                <a href="https://discord.gg/Hn39bCU">Discord draft exchange?</a>
              </p>
            )}
          </CardBody>
          <CardFooter>
            <Paginate count={totalPages} active={currentPage} urlF={(i) => `/dashboard/decks/${i}`} />
          </CardFooter>
        </Card>
      </Col>
    </Row>
  </MainLayout>
);

RecentDraftsPage.propTypes = {
  decks: PropTypes.arrayOf(DeckPropType).isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  loginCallback: PropTypes.string,
};

RecentDraftsPage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(RecentDraftsPage);
