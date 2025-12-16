import React, { useState, useRef } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Alert, Typography
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadPhoto } from '../../lib/fetchData';

function UploadDialog({ open, onClose, currentUserId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: () => {
      // Clear state and close
      setSelectedFile(null);
      setError('');
      onClose();
      // Refresh the photos and user details
      queryClient.invalidateQueries(['photos', currentUserId]);
      queryClient.invalidateQueries(['user', currentUserId]);
    },
    onError: () => {
      setError('Upload failed, please try again');
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError('Please select a valid file');
      return;
    }
    mutation.mutate(selectedFile);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Photo</DialogTitle>
      <DialogContent sx={{ minWidth: '300px', pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <label htmlFor="raised-button-file">
          <Button variant="outlined" component="span" fullWidth>
            Select Photo
          </Button>
        </label>

        {selectedFile && (
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Selected file: {selectedFile.name}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || mutation.isLoading}
        >
          {mutation.isLoading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UploadDialog;