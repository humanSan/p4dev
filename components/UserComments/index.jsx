import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  CircularProgress,
} from '@mui/material';
// import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { fetchCommentsOfUser, fetchUser } from '../../lib/fetchData';

function UserComments() {
  // Do same as other components
  const { userId } = useParams();

  // NEW QUERY CODE, copy from UserPhotos

  const {data: comments, isLoading: commentLoading, isError: isCommentError, error: commentError} = useQuery({
    queryKey: ['comments', userId],
    queryFn: () => fetchCommentsOfUser(userId)
  });

  const {data: user, isLoading: userLoading, isError: isUserError, error: userError} = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  // Loading and error
  if (commentLoading || userLoading) return <CircularProgress/>;
  if (isUserError) return <Typography>{userError.message}</Typography>;
  if (isCommentError) return <Typography>{commentError.message}</Typography>;
  

  // Return JSX for comments list. Show list of comments by user and a thumbnail of the image that the comment was posted on.
  return (
    <Paper>
      <Typography variant="h4" sx={{ p: 2 }}>
        Comments by {user.first_name} {user.last_name}
      </Typography>
      <List>
        {comments.map((comment) => (
          <ListItemButton
            key={comment._id}
            component={Link}
            to={`/photos/${comment.photo.user_id}/${comment.photo._id}`}
            divider
          >
            <ListItemAvatar>
              <Avatar
                sx={{width: "100px", height: "100px", mr: "24px"}}
                variant="square"
                src={`/images/${comment.photo.file_name}`}
                alt="thumbnail"
              />
            </ListItemAvatar>
            <ListItemText
              primary={comment.comment}
              secondary={`Commented on ${new Date(comment.date_time).toLocaleDateString()} at ${new Date(comment.date_time).toLocaleTimeString()}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}

export default UserComments;