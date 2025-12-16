import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Button, Paper, CircularProgress, Box, Card, CardMedia, CardContent } from '@mui/material';
// import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { fetchUser, fetchUserPhotoHighlights } from '../../lib/fetchData';
import useStore from '../../lib/store';

import './styles.css';

function UserDetail({ userId }) {
  const navigate = useNavigate();
  const advViewEnabled = useStore((state) => state.advViewEnabled);

  // NEW QUERY CODE

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, //see if userId even exists
  });

  const { data: highlights, isLoading: highlightsLoading } = useQuery({
    queryKey: ['photo-highlights', userId],
    queryFn: () => fetchUserPhotoHighlights(userId),
    enabled: !!userId,
  });

  // Handle loading and error
  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography>{error.message}</Typography>;
  // If user actually doesn't exist
  if (!user) return <Typography>User doesn&apost exist</Typography>;

  const handlePhotoClick = (photoId) => {
    if (advViewEnabled) {
      navigate(`/photos/${userId}/${photoId}`);
    } else {
      navigate(`/photos/${userId}`);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: '20px' }}>
      <Typography variant="h4">{`${user.first_name} ${user.last_name}`}</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        <strong>Location:</strong> {user.location}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        <strong>Occupation:</strong> {user.occupation}
      </Typography>
      <Typography variant="body1" paragraph>
        <strong>Description:</strong> {user.description}

        {/* The line below allows for html formatting to be rendered to the description. One of the examples in the demo data has a description in italic <i> tags, so that's why I tested the following line. However, most sources said that it's not a good practice to directly render text as inner html, so I've commented it out. */}

        {/* <div dangerouslySetInnerHTML={{__html: user.description}} /> */}

      </Typography>

      {/* Photo Highlights with most recent photo and the photo with the most comments */}
      {highlightsLoading ? (
        <CircularProgress size={20} />
      ) : highlights && (highlights.mostRecent || highlights.mostComments) ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Photo Highlights</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {highlights.mostRecent && (
              <Card
                sx={{ width: 150, cursor: 'pointer' }}
                onClick={() => handlePhotoClick(highlights.mostRecent._id)}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={`/images/${highlights.mostRecent.file_name}`}
                  alt="Most Recent"
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="caption" fontWeight="bold">Most Recent</Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    {new Date(highlights.mostRecent.date_time).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            )}
            {highlights.mostComments && highlights.mostComments.commentCount > 0 && (
              <Card
                sx={{ width: 150, cursor: 'pointer' }}
                onClick={() => handlePhotoClick(highlights.mostComments._id)}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={`/images/${highlights.mostComments.file_name}`}
                  alt="Most Commented"
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="caption" fontWeight="bold">Most Commented</Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    {highlights.mostComments.commentCount} comments
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      ) : null}

      <Button
        variant="contained"
        color="primary"
        component={Link}
        to={`/photos/${user._id}`}
        sx={{ mt: 2 }}
      >
        View Photos
      </Button>
    </Paper>
  );
}

UserDetail.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserDetail;
