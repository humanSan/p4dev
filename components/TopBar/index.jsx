import React from 'react';
import { useMatch, useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box } from '@mui/material';
// import axios from 'axios';


import './styles.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUser, logoutUser, deleteUserAccount } from '../../lib/fetchData';
import useStore from '../../lib/store';
import UploadDialog from './UploadDialog';


// We take in the advanced viewer switch state
function TopBar() {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // AUTHENTICATION
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);

  const matchUserDetail = useMatch('/users/:userId');
  const matchUserPhotos = useMatch('/photos/:userId');
  const userId = (matchUserDetail || matchUserPhotos)?.params?.userId;


  // GLOBAL STATE
  const advViewEnabled = useStore((state) => state.advViewEnabled);
  const switchAdvView = useStore((state) => state.switchAdvView);

  // NEW QUERY CODE
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId && !!currentUser, // only get data if user is logged in
  });

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography>{error.message}</Typography>;

  const handleLogout = async () => {
    try {
      await logoutUser(); // Call logout API
      logout(); // Clear logged in user from global state
      queryClient.clear(); // Clear React Query cache
      navigate('/'); // Go home
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserAccount();
      logout();
      queryClient.clear();
      navigate('/');
    } catch (err) {
      console.error("Delete account failed", err);
    }
    setDeleteDialogOpen(false);
  };

  // Determine the context message to display.
  let contextMessage = '';
  if (user) {
    if (matchUserDetail) {
      contextMessage = `${user.first_name} ${user.last_name}`;
    } else if (matchUserPhotos) {
      contextMessage = `Photos of ${user.first_name} ${user.last_name}`;
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        {currentUser ? (
          <>
            <Typography variant="h6" component="div" sx={{ paddingInlineEnd: "24px" }}>
              Hi {currentUser.first_name}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              sx={{ mr: 2 }}
              onClick={() => setUploadOpen(true)}
            >
              ⛶ Upload Photo
            </Button>
            <Button color="inherit" component={Link} to="/favorites" variant="outlined" size="small" sx={{ mr: 2 }}>
              Favorites
            </Button>
            <FormControlLabel
              control={(
                <Switch
                  checked={advViewEnabled}
                  onChange={switchAdvView}
                  color="secondary"
                />
              )}
              label="Enable Advanced Features"
            />
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="h6" component="div">
              {contextMessage}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button color="inherit" onClick={handleLogout} variant="outlined" size="small" sx={{ mr: 2 }}>
              ➜] Logout
            </Button>
            <Button color="error" onClick={() => setDeleteDialogOpen(true)} variant="contained" size="small">
              Delete Account
            </Button>
          </>
        ) : (
          <Typography variant="h6">Please Login</Typography>
        )}

        {currentUser && (
          <UploadDialog
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            currentUserId={currentUser._id}
          />
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Account?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action is irreversible. All your photos, comments, and data will be permanently deleted.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAccount} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;