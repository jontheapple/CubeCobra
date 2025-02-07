import React from 'react';
import PropTypes from 'prop-types';

import { Card, CardHeader, CardBody, Row, Col } from 'reactstrap';

import DynamicFlash from 'components/DynamicFlash';
import ButtonLink from 'components/ButtonLink';
import MainLayout from 'layouts/MainLayout';
import RenderToRoot from 'utils/RenderToRoot';
import TimeAgo from 'react-timeago';

const NoticePage = ({ loginCallback, notices }) => {
  const applications = notices.filter((notice) => notice.type === 'a');
  const reports = notices.filter((notice) => notice.type === 'cr');

  return (
    <MainLayout loginCallback={loginCallback}>
      <DynamicFlash />
      <Card className="my-3">
        <CardHeader>
          <h5>Content Creator Applications</h5>
        </CardHeader>
        {applications.map((application) => (
          <Card>
            <CardBody>
              <p>
                Details:
                <Card>
                  {application.body.split('\n').map((item) => (
                    <>
                      {item}
                      <br />
                    </>
                  ))}
                </Card>
              </p>
              <p>
                Submitted by by:{' '}
                <a href={`/user/view/${application.user}`} target="_blank" rel="noopener noreferrer">
                  {application.user}
                </a>
                - <TimeAgo date={application.date} />
              </p>
              <Row>
                <Col xs="12" sm="6">
                  <ButtonLink color="accent" block outline href={`/admin/application/approve/${application.id}`}>
                    Approve
                  </ButtonLink>
                </Col>
                <Col xs="12" sm="6">
                  <ButtonLink color="unsafe" block outline href={`/admin/application/decline/${application.id}`}>
                    Decline
                  </ButtonLink>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ))}
      </Card>
      <Card className="my-3">
        <CardHeader>
          <h5>Recent Comment Reports</h5>
        </CardHeader>
        {reports.map((report) => (
          <Card>
            <CardBody>
              <p>
                Comment:{' '}
                <a href={`/comment/${report.subject}`} target="_blank" rel="noopener noreferrer">
                  {report.subject}
                </a>
              </p>
              <p>Reason: {report.body}</p>
              <p>
                Reported by:{' '}
                <a href={`/user/view/${report.user}`} target="_blank" rel="noopener noreferrer">
                  {report.user}
                </a>
                - <TimeAgo date={report.date} />
              </p>
              <Row>
                <Col xs="12" sm="6">
                  <ButtonLink color="accent" block outline href={`/admin/ignorereport/${report.id}`}>
                    Ignore
                  </ButtonLink>
                </Col>
                <Col xs="12" sm="6">
                  <ButtonLink color="unsafe" block outline href={`/admin/removecomment/${report.id}`}>
                    Remove Comment
                  </ButtonLink>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ))}
      </Card>
    </MainLayout>
  );
};

NoticePage.propTypes = {
  loginCallback: PropTypes.string,
  notices: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

NoticePage.defaultProps = {
  loginCallback: '/',
};

export default RenderToRoot(NoticePage);
