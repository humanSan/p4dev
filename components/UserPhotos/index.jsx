import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
// import axios from 'axios';
import './styles.css';
// import axios from 'axios';
import { Box } from '@mui/system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchPhotosOfUser, fetchUser, likePhoto, unlikePhoto, fetchFavorites, addToFavorites, deletePhoto, deleteComment } from '../../lib/fetchData';
import useStore from '../../lib/store';
import CommentDialog from '../CommentDIalog';

// New props for advanced view
function UserPhotos({ userId, photoId }) {
  const navigate = useNavigate(); //useNavigate allows for in app navigation, used for stepping through photos using back and forward button

  // GET ADVANCED VIEW FROM ZUSTAND
  const advViewEnabled = useStore((state) => state.advViewEnabled);
  // const advViewFromLink = !!useMatch('photos/:userId/:photoId');
  // const advViewEnabled = advOptionOn || advViewFromLink;


  // NEW QUERY CODE
  // We need to queries for the user's info, and for the photos
  const { data: photos, isLoading: photoLoading, isError: isPhotoError, error: photoError } = useQuery({
    queryKey: ['photos', userId],
    queryFn: () => fetchPhotosOfUser(userId)
  });

  const { data: user, isLoading: userLoading, isError: isUserError, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  const queryClient = useQueryClient();
  const currentUser = useStore(state => state.currentUser);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('like_update', (update) => {
      queryClient.setQueryData(['photos', userId], (oldPhotos) => {
        if (!oldPhotos) return oldPhotos;
        return oldPhotos.map(p => {
          if (p._id === update.photo_id) {
            return { ...p, likes: update.likes };
          }
          return p;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, userId]);

  const handleLike = async (photo) => {
    if (!currentUser) return;
    const isLiked = photo.likes && photo.likes.includes(currentUser._id);
    try {
      if (isLiked) {
        await unlikePhoto(photo._id);
      } else {
        await likePhoto(photo._id);
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: !!currentUser
  });

  const handleFavorite = async (photoIdToFav) => {
    try {
      await addToFavorites(photoIdToFav);
      queryClient.invalidateQueries(['favorites']);
    } catch (err) {
      console.error("Error adding to favorites:", err);
    }
  };

  const handleDeletePhoto = async (photoIdToDelete) => {
    try {
      await deletePhoto(photoIdToDelete);
      queryClient.invalidateQueries(['photos', userId]);
    } catch (err) {
      console.error("Error deleting photo:", err);
    }
  };

  const handleDeleteComment = async (targetPhotoId, commentId) => {
    try {
      await deleteComment(targetPhotoId, commentId);
      queryClient.invalidateQueries(['photos', userId]);
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Sort photos: Most likes first, then most recent
  const sortedPhotos = photos ? [...photos].sort((a, b) => {
    const likesA = a.likes ? a.likes.length : 0;
    const likesB = b.likes ? b.likes.length : 0;
    if (likesA !== likesB) {
      return likesB - likesA;
    }
    return new Date(b.date_time) - new Date(a.date_time);
  }) : [];

  // IF Advanced Features is enabled, and no photo Id is passed in, then show first image.
  useEffect(() => {
    if (advViewEnabled && !photoId && sortedPhotos && sortedPhotos.length >= 1) {
      navigate(`/photos/${userId}/${sortedPhotos[0]._id}`, { replace: true });
    }
  }, [userId, advViewEnabled, photoId, sortedPhotos, navigate]);

  // Loading and error
  if (photoLoading || userLoading) return <CircularProgress />;
  if (isUserError) return <Typography>{userError.message}</Typography>;
  if (isPhotoError) return <Typography>{photoError.message}</Typography>;

  // Format dates nicely
  const formatDateTime = (isoString) => `${new Date(isoString).toLocaleDateString()} at ${new Date(isoString).toLocaleTimeString()}`;

  if (advViewEnabled) {
    // 1- Use advanced view if Advanced Features is Enabled

    // If the user has no photos, then render a placeholder.
    if (!sortedPhotos || sortedPhotos.length === 0) {
      return (
        <>
          <Typography variant="h4" gutterBottom>
            Photos by {`${user.first_name} ${user.last_name}`}
          </Typography>
          <Typography variant='subtitle1'> This user has no photos. </Typography>
        </>
      );
    }

    // 2 - Get Current Photo with index
    const curIndex = sortedPhotos.findIndex(foto => foto._id === photoId);
    if (curIndex === -1) return <Typography>Photo not found</Typography>;

    const curPhoto = sortedPhotos[curIndex];

    // 3 - Create handlers
    // When the next photo button is clicked, we get the next photo in photos array, and use its ID for the route and navigate to that route.
    const onForward = () => {
      const nextPhoto = sortedPhotos[curIndex + 1];
      if (nextPhoto) navigate(`/photos/${userId}/${nextPhoto._id}`);
    };

    // When previous button is clicked, we do the same, but with -1 decrement.
    const onPrevious = () => {
      const nextPhoto = sortedPhotos[curIndex - 1];
      if (nextPhoto) navigate(`/photos/${userId}/${nextPhoto._id}`);
    };

    // 4 - Render JSX (render previous/next buttons, current photo, and comments)
    return (
      <div>
        <Typography variant="h4" gutterBottom>
          Photos by {`${user.first_name} ${user.last_name}`}
        </Typography>
        <Box
          // Render buttons in a Box MUI element. Disable if first or last photo in photos array
          sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, marginBottom: 2 }}
        >
          <Button variant="contained" onClick={onPrevious} disabled={curIndex === 0}> ← Previous </Button>
          <Typography>Photo {curIndex + 1}/{sortedPhotos.length}</Typography>
          <Button variant="contained" onClick={onForward} disabled={curIndex === sortedPhotos.length - 1}> Next → </Button>

        </Box>
        <Card sx={{ position: 'relative' }}>
          <CardMedia
            // First show the image at the top of the card, then the date, and then list of comments
            component="img"
            // Set a max height and contain object fit to keep images an ok size
            image={`/images/${curPhoto.file_name}`}
            alt={`Photo by ${user.first_name}`}
            sx={{
              maxHeight: 600,
              objectFit: 'contain',
            }}
          />
          {curPhoto.likes && currentUser && curPhoto.likes.includes(currentUser._id) && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(25, 118, 210, 0.2)', // Primary color with 20% opacity
                padding: '8px 16px',
                borderRadius: '50px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ThumbUpIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
              <Typography variant="body1" fontWeight="bold" color="primary">Liked</Typography>
            </Box>
          )}
          {favorites && favorites.some(f => f._id === curPhoto._id) && (
            <Box
              sx={{
                position: 'absolute',
                top: curPhoto.likes && currentUser && curPhoto.likes.includes(currentUser._id) ? 70 : 10,
                left: 10,
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                padding: '8px 16px',
                borderRadius: '50px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FavoriteIcon color="error" fontSize="large" sx={{ mr: 1 }} />
              <Typography variant="body1" fontWeight="bold" color="error">Favorited</Typography>
            </Box>
          )}
          <CardContent>
            <Typography variant="caption" color="textSecondary">
              Posted on: {formatDateTime(curPhoto.date_time)}
            </Typography>
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => handleLike(curPhoto)} disabled={!currentUser}>
                {curPhoto.likes && currentUser && curPhoto.likes.includes(currentUser._id) ? <ThumbDownIcon color="secondary" /> : <ThumbUpIcon sx={{ color: 'rgba(76, 175, 80, 0.5)' }} />}
              </IconButton>
              <Typography variant="body1">{curPhoto.likes ? curPhoto.likes.length : 0}</Typography>
              <Box sx={{ flexGrow: 1 }} />
              {currentUser && String(curPhoto.user_id) === String(currentUser._id) && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={() => handleDeletePhoto(curPhoto._id)} color="error">
                    <DeleteIcon />
                    <Typography color="error" fontWeight="bold">Delete</Typography>
                  </IconButton>
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
              <IconButton
                onClick={() => handleFavorite(curPhoto._id)}
                disabled={!currentUser || (favorites && favorites.some(f => f._id === curPhoto._id))}
              >
                {favorites && favorites.some(f => f._id === curPhoto._id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon color="error" />}
              </IconButton>
              <Typography color="error" fontWeight="bold">
                {favorites && favorites.some(f => f._id === curPhoto._id) ? 'You favorited this image.' : 'Favorite'}
              </Typography>
            </Box>

            {curPhoto.comments && curPhoto.comments.length > 0 && (
              <>
                <Divider style={{ margin: '10px 0' }} />
                <Typography variant="subtitle1">Comments:</Typography>
                <List>
                  {curPhoto.comments.map((comment) => (
                    <ListItem key={comment._id} alignItems="flex-start">
                      <ListItemText
                        primary={comment.comment}
                        secondary={(
                          // Under each photo in the photo card, show the  comments
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              <Link to={`/users/${comment.user._id}`}>
                                {`${comment.user.first_name} ${comment.user.last_name}`}
                              </Link>
                            </Typography>
                            {` commented on ${formatDateTime(comment.date_time)}`}
                          </>
                        )}
                      />
                      {currentUser && String(comment.user._id) === String(currentUser._id) && (
                        <IconButton onClick={() => handleDeleteComment(curPhoto._id, comment._id)} color="error" size="small">
                          <DeleteIcon fontSize="small" />
                          <Typography color="error" fontWeight="bold">Delete</Typography>
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            <Divider style={{ margin: '10px 0' }} />
            <CommentDialog photoId={curPhoto._id} profileUserId={userId} />
          </CardContent>
        </Card>
      </div>
    );


  } else {
    // Return view for the photos panel
    // Show a list of photos in their own cards, using Card component
    // If no photos exist for an user, show a message saying no photos for the user
    return (
      <div>
        <Typography variant="h4" gutterBottom>
          Photos by {`${user.first_name} ${user.last_name}`}
        </Typography>
        <Grid container spacing={2}>
          {sortedPhotos.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant='subtitle1'>This user has no photos.</Typography>
            </Grid>
          ) : (
            sortedPhotos.map((photo) => (
              // Each photo is a grid item to fit in screen size
              <Grid item xs={12} key={photo._id}>
                <Card sx={{ position: 'relative' }}>
                  <CardMedia
                    // First show the image at the top of the card, then the date, and then list of comments
                    component="img"
                    image={`/images/${photo.file_name}`}
                    alt={`Photo by ${user.first_name}`}
                    // Set a max height and contain object fit to keep images an ok size
                    sx={{
                      maxHeight: 600,
                      objectFit: 'contain',
                    }}
                  />
                  {photo.likes && currentUser && photo.likes.includes(currentUser._id) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '50px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ThumbUpIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                      <Typography variant="body1" fontWeight="bold" color="primary">Liked</Typography>
                    </Box>
                  )}
                  {favorites && favorites.some(f => f._id === photo._id) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: photo.likes && currentUser && photo.likes.includes(currentUser._id) ? 70 : 10,
                        left: 10,
                        backgroundColor: 'rgba(211, 47, 47, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '50px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <FavoriteIcon color="error" fontSize="large" sx={{ mr: 1 }} />
                      <Typography variant="body1" fontWeight="bold" color="error">Favorited</Typography>
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="caption" color="textSecondary">
                      Posted on: {formatDateTime(photo.date_time)}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <IconButton onClick={() => handleLike(photo)} disabled={!currentUser}>
                        {photo.likes && currentUser && photo.likes.includes(currentUser._id) ? <ThumbDownIcon color="secondary" /> : <ThumbUpIcon sx={{ color: 'rgba(76, 175, 80, 0.5)' }} />}
                      </IconButton>
                      <Typography variant="body1">{photo.likes ? photo.likes.length : 0}</Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      {currentUser && String(photo.user_id) === String(currentUser._id) && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton onClick={() => handleDeletePhoto(photo._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                          <Typography color="error" fontWeight="bold">Delete</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <IconButton
                        onClick={() => handleFavorite(photo._id)}
                        disabled={!currentUser || (favorites && favorites.some(f => f._id === photo._id))}
                      >
                        {favorites && favorites.some(f => f._id === photo._id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon color="error" />}
                      </IconButton>
                      <Typography color="error" fontWeight="bold">
                        {favorites && favorites.some(f => f._id === photo._id) ? 'You favorited this image.' : 'Favorite'}
                      </Typography>
                    </Box>

                    {photo.comments && photo.comments.length > 0 && (
                      <>
                        <Divider style={{ margin: '10px 0' }} />
                        <Typography variant="subtitle1">Comments:</Typography>
                        <List>
                          {photo.comments.map((comment) => (
                            <ListItem key={comment._id} alignItems="flex-start">
                              <ListItemText
                                primary={comment.comment}
                                secondary={(
                                  // Under each photo in the photo card, show the  comments
                                  <>
                                    <Typography component="span" variant="body2" color="textPrimary">
                                      <Link to={`/users/${comment.user._id}`}>
                                        {`${comment.user.first_name} ${comment.user.last_name}`}
                                      </Link>
                                    </Typography>
                                    {` commented on ${formatDateTime(comment.date_time)}`}
                                  </>
                                )}
                              />
                              {currentUser && String(comment.user._id) === String(currentUser._id) && (
                                <IconButton onClick={() => handleDeleteComment(photo._id, comment._id)} color="error" size="small">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    <Divider style={{ margin: '10px 0' }} />
                    <CommentDialog photoId={photo._id} profileUserId={userId} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </div>
    );
  }
}

UserPhotos.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserPhotos;
