import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';


// import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { fetchUserList } from '../../lib/fetchData';
import useStore from '../../lib/store';

import './styles.css';

//Define UserList, a React component that shows list of users
function UserList() {

  // GET ADVANCED VIEW STATE FROM ZUSTAND
  const currentUser = useStore((state) => state.currentUser);
  const advViewEnabled = useStore((state) => state.advViewEnabled);
  // const advViewFromLink = !!useMatch('photos/:userId/:photoId');
  // const advViewEnabled = advOptionOn || advViewFromLink;

  // use useQuery for user data retrieval
  const {data: users, isLoading, isError, error} = useQuery({
    queryKey: ['userList', advViewEnabled],
    queryFn: () => fetchUserList(advViewEnabled)
  });

  // use isLoading and isError
  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography>{error.message}</Typography>;
  if (!currentUser || !users) return null;

  // return the JSX view for the list of uers, it's just a List component with ListItems for each user, linking to that user id. 
  // Can use map with jsx to create a dynamic list of components for users
  return (
    <div>
      <Typography variant="h6">
        Users
      </Typography>
      <List component="nav">
        {users.map((user) => (
          <>
            <ListItem key={user._id}>
              <ListItemText
                primary={(
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between"}}>

                    <Link to={`/users/${user._id}`}>
                      {`${user.first_name} ${user.last_name}`}
                    </Link>

                    {advViewEnabled && (
                      <Box>
                        <Chip label={user.photo_count} color="success" sx={{ mr: "4px" }}></Chip>
                        <Chip 
                          component={Link}
                          to={`/comments/${user._id}`}
                          label={user.comment_count}
                          color="error"
                          clickable
                        >
                        </Chip>
                      </Box>
                    )}
                  </Box>
                )}
              />
            </ListItem>
            <Divider />
          </>
        ))}
      </List>
    </div>
  );
}

export default UserList;