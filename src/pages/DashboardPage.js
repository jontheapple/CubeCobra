import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import CubePropType from 'proptypes/CubePropType';
import DeckPropType from 'proptypes/DeckPropType';
import BlogPostPropType from 'proptypes/BlogPostPropType';

import UserContext from 'contexts/UserContext';
import CubePreview from 'components/CubePreview';
import ArticlePreview from 'components/ArticlePreview';
import DeckPreview from 'components/DeckPreview';
import VideoPreview from 'components/VideoPreview';
import PodcastEpisodePreview from 'components/PodcastEpisodePreview';
import Banner from 'components/Banner';
import DynamicFlash from 'components/DynamicFlash';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import withModal from 'components/WithModal';
import CreateCubeModal from 'components/CreateCubeModal';
import Feed from 'components/Feed';

import { Button, Card, Col, Row, CardHeader, CardBody, CardFooter } from 'reactstrap';
import CubesCard from 'components/CubesCard';

const CreateCubeModalButton = withModal(Button, CreateCubeModal);

const DashboardPage = ({ posts, lastKey, decks, loginCallback, content, featured }) => {
  const user = useContext(UserContext);
  // where featured cubes are positioned on the screen
  let featuredPosition;
  if (!user.hide_featured) {
    featuredPosition = user.cubes.length > 2 ? 'right' : 'left';
  }

  // the number of drafted decks shown, based on where cubes are located
  let filteredDecks = decks;
  if (featuredPosition === 'right') {
    filteredDecks = decks.slice(0, 4);
  }
  if (!featuredPosition && user.cubes.length <= 2) {
    filteredDecks = decks.slice(0, 6);
  }

  return (
    <MainLayout loginCallback={loginCallback}>
      <Banner />
      <DynamicFlash />
      <Row className="mt-3">
        <Col xs="12" md="6">
          <Card>
            <CardHeader>
              <h5>Your cubes</h5>
            </CardHeader>
            <CardBody className="p-0">
              <Row className="g-0">
                {user.cubes.length > 0 ? (
                  user.cubes.slice(0, 4).map((cube) => (
                    <Col key={cube.id} xs="12" sm="12" md="12" lg="6">
                      <CubePreview cube={cube} />
                    </Col>
                  ))
                ) : (
                  <p className="m-2">
                    You don't have any cubes.{' '}
                    <CreateCubeModalButton color="accent">Add a new cube?</CreateCubeModalButton>
                  </p>
                )}
              </Row>
            </CardBody>
            {featuredPosition !== 'left' && (
              <CardFooter>{user.cubes.length > 2 && <a href={`/user/view/${user.id}`}>View All</a>}</CardFooter>
            )}
          </Card>
          {featuredPosition === 'left' && (
            <CubesCard
              title="featured cubes"
              cubes={featured}
              lean
              header={{ hLevel: 5, sideLink: '/donate', sideText: 'Learn more...' }}
            />
          )}
        </Col>
        <Col xs="12" md="6">
          {featuredPosition === 'right' && (
            <CubesCard
              className="mb-4"
              title="featured cubes"
              cubes={featured}
              lean
              header={{ hLevel: 5, sideLink: '/donate', sideText: 'Learn more...' }}
            />
          )}
          <Card>
            <CardHeader>
              <h5>Recent Drafts of Your cubes</h5>
            </CardHeader>
            <CardBody className="p-0">
              {decks.length > 0 ? (
                filteredDecks.map((deck) => <DeckPreview key={deck.id} deck={deck} nextURL="/dashboard" canEdit />)
              ) : (
                <p className="m-2">
                  Nobody has drafted your cubes! Perhaps try reaching out on the{' '}
                  <a href="https://discord.gg/Hn39bCU">Discord draft exchange?</a>
                </p>
              )}
            </CardBody>
            <CardFooter>
              <a href="/dashboard/decks/0">View All</a>
            </CardFooter>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="8">
          <h5 className="mt-3">Feed</h5>
          <Feed items={posts} lastKey={lastKey} />
        </Col>
        <Col className="d-none d-md-block mt-3" md="4">
          <Row>
            <Col xs="12">
              <Row>
                <Col xs="6">
                  <h5>Latest Content</h5>
                </Col>
                <Col xs="6">
                  <a className="float-end" href="/content/browse">
                    View more...
                  </a>
                </Col>
              </Row>
            </Col>
            {content.map((item) => (
              <Col key={item.id} className="mb-3" xs="12">
                {item.type === 'a' && <ArticlePreview article={item} />}
                {item.type === 'v' && <VideoPreview video={item} />}
                {item.type === 'e' && <PodcastEpisodePreview episode={item} />}
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </MainLayout>
  );
};

DashboardPage.propTypes = {
  posts: PropTypes.arrayOf(BlogPostPropType).isRequired,
  decks: PropTypes.arrayOf(DeckPropType).isRequired,
  content: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  loginCallback: PropTypes.string,
  featured: PropTypes.arrayOf(CubePropType),
  lastKey: PropTypes.string,
};

DashboardPage.defaultProps = {
  loginCallback: '/',
  featured: [],
  lastKey: null,
};

export default RenderToRoot(DashboardPage);
