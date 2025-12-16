import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment } from '../../lib/fetchData';

function CommentDialog({ photoId, profileUserId }) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  // Use mutation here
  const mutation = useMutation({
    // On mutation call addComment
    mutationFn: (newComment) => addComment(photoId, newComment),
    onSuccess: () => {
      setComment(''); // Clear input
      queryClient.invalidateQueries(['photos', profileUserId]); //Causes refresh
    },
  });

  // On submit call mutate
  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      mutation.mutate(comment);
    }
  };

  // Handle error/loading with mutation.isError and mutation.isLoading
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <Box sx={{ flexGrow: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="Add a comment..."
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          error={mutation.isError}
          helperText={mutation.isError ? "Failed to add comment" : ""}
        />
      </Box>
      <Button
        type="submit"
        variant="contained"
        disabled={!comment.trim() || mutation.isLoading}
      >
        Post
      </Button>
    </Box>
  );
}

export default CommentDialog;