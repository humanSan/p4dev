import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Paper } from '@mui/material';
import {
  BrowserRouter, Route, Routes, useParams, useMatch
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './styles/main.css';
import useStore from './lib/store';

// Import mock setup - Remove this once you have implemented the actual API calls
// import './lib/mockSetup.js';
import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';
import UserComments from './components/UserComments';
import Favorites from './components/Favorites';
import LoginRegister from './components/LoginRegister';
import { checkSession } from './lib/fetchData';

const queryClient = new QueryClient();

function UserDetailRoute() {
  const { userId } = useParams();
  return <UserDetail userId={userId} />;
}

// Advanced Features
// 1 - For Advanced Features (Stepper Photos): we need to use a boolean state indicating whether to use the original photo viewer or the new one
function UserPhotosRoute({ advViewEnabled }) {
  const { userId, photoId } = useParams(); //photoId will need to be passed to Route as well
  return <UserPhotos userId={userId} photoId={photoId} advViewEnabled={advViewEnabled} />;
}

// This is the main photoshare App view for the frontend.
// Defines Routes to user list, user details, and user photos
// This DynamicLayout component allows for advanced features to be loaded if the URL is a bookmarked image without needing to toggle it manually. If a normal URL is used, then advanced features depends on the user's choice.
function DynamicLayout() {

  // If we are visiting a bookmarked image link, then we should use advanced view.
  const setAdvView = useStore((state) => state.setAdvView);
  const isSinglePhotoLink = !!useMatch('/photos/:userId/:photoId');
  if (isSinglePhotoLink) setAdvView(true);

  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const [checkingSession, setCheckingSession] = React.useState(true);

  // Check if user is already logged in, in which case we don't want to redirect to login page
  React.useEffect(() => {
    checkSession()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingSession(false));
  }, [setCurrentUser]);

  if (checkingSession) return <div />;

  // 3 - Update Routes to implement advanced features.
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TopBar />
        </Grid>
        <div className="main-topbar-buffer" />

        {currentUser ? (
          <>
            <Grid item sm={3}>

              <Paper className="main-grid-item">
                <UserList />
              </Paper>

            </Grid>
            <Grid item sm={9}>
              <Routes>
                <Route path="/users/:userId" element={<UserDetailRoute />} />
                <Route path="/photos/:userId/:photoId" element={
                  <UserPhotosRoute />
                } />
                <Route path="/photos/:userId" element={
                  <UserPhotosRoute />
                } />
                <Route path="/users" element={<UserList />} />
                <Route path="/comments/:userId" element={<UserComments />} />
                <Route path="/favorites" element={<Favorites />} />
              </Routes>
            </Grid>
          </>
        ) : (
          <Grid item sm={12}>
            <Routes>
              <Route path="*" element={<LoginRegister />} />
            </Routes>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

// Exported PhotoShare component with dynamic layout
function PhotoShare() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DynamicLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(<PhotoShare />);
