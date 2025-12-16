import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, TextField, Button, Paper, Alert, Grid } from '@mui/material';
import { loginUser, registerUser } from '../../lib/fetchData';
import useStore from '../../lib/store';

function LoginRegister() {
  // States for logging in
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State for registering
  const [registrationInfo, setRegistrationInfo] = useState({
    login_name: '',
    password: '',
    passwordVerify: '',
    first_name: '',
    last_name: '',
    location: '',
    description: '',
    occupation: ''
  });
  // Success and Error of registering
  const [registrationSuccess, setRegSuc] = useState('');
  const [registrationError, setRegErr] = useState('');

  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const navigate = useNavigate(); // After logging in, it should navigate to user's details page

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      // Call loginUser from fetchData
      const user = await loginUser(loginName, loginPassword);
      setCurrentUser(user); // Update global store, which triggers the main app to render
      navigate(`users/${user._id}`); // Go to details page of logged in user
    } catch (err) {
      setLoginError('Login failed. Please check your name and password.');
    }
  };

  // To handle Registration input, use target-name-value pattern
  const handleRegistrationInput = (e) => {
    const { name, value } = e.target;
    setRegistrationInfo(prev => ({ ...prev, [name]: value }));
  };

  // Registration handler
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegErr('');
    setRegSuc('');

    // Passwords must match, and can't be empty
    if (registrationInfo.password !== registrationInfo.passwordVerify) {
      setRegErr("Passwords do not match!");
      return;
    }
    if (!registrationInfo.password) {
      setRegErr("Password cannot be empty");
      return;
    }

    try {
      // Call registerUser
      await registerUser({
        login_name: registrationInfo.login_name,
        password: registrationInfo.password,
        first_name: registrationInfo.first_name,
        last_name: registrationInfo.last_name,
        location: registrationInfo.location,
        description: registrationInfo.description,
        occupation: registrationInfo.occupation
      });

      setRegSuc("Registration successful! You can now log in.");

      // Clear form
      setRegistrationInfo({
        login_name: '', 
        password: '', 
        passwordVerify: '',
        first_name: '', 
        last_name: '', 
        location: '', 
        description: '', 
        occupation: ''
      });
    } catch (err) {
      setRegErr(err.response?.data || "Registration failed");
    }
  };

  // Note: xs is for small width screens, md is for wider screens
  return (
    <Grid container spacing={4} justifyContent="center" sx={{ mt: 4, px: 4 }}>

      {/*  LOGIN SECTION  */}
      <Grid item xs={12} md={5}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', justifySelf: 'end' }}>
          <Typography variant="h5" gutterBottom>Login</Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth margin="normal" label="Login Name" variant="outlined"
              value={loginName} onChange={(e) => setLoginName(e.target.value)}
            />
            <TextField
              fullWidth margin="normal" label="Password" type="password" variant="outlined"
              value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
            />
            {loginError && <Alert severity="error" sx={{ mt: 2 }}>{loginError}</Alert>}
            <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }}>Login</Button>
          </form>
        </Paper>
      </Grid>

      {/*  REGISTRATION SECTION  */}
      <Grid item xs={12} md={5}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', justifySelf: 'start' }}>
          <Typography variant="h5" gutterBottom>Create New Account</Typography>

          <form onSubmit={handleRegistrationSubmit}>
            <TextField
              fullWidth margin="dense" label="Login Name *" name="login_name"
              value={registrationInfo.login_name} onChange={handleRegistrationInput}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth margin="dense" label="First Name *" name="first_name"
                  value={registrationInfo.first_name} onChange={handleRegistrationInput}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth margin="dense" label="Last Name *" name="last_name"
                  value={registrationInfo.last_name} onChange={handleRegistrationInput}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth margin="dense" label="Password *" type="password" name="password"
              value={registrationInfo.password} onChange={handleRegistrationInput}
            />
            <TextField
              fullWidth margin="dense" label="Verify Password *" type="password" name="passwordVerify"
              value={registrationInfo.passwordVerify} onChange={handleRegistrationInput}
            />

            <TextField
              fullWidth margin="dense" label="Location" name="location"
              value={registrationInfo.location} onChange={handleRegistrationInput}
            />
            <TextField
              fullWidth margin="dense" label="Occupation" name="occupation"
              value={registrationInfo.occupation} onChange={handleRegistrationInput}
            />
            <TextField
              fullWidth margin="dense" label="Description" name="description" multiline rows={2}
              value={registrationInfo.description} onChange={handleRegistrationInput}
            />

            {registrationError && <Alert severity="error" sx={{ mt: 2 }}>{registrationError}</Alert>}
            {registrationSuccess && <Alert severity="success" sx={{ mt: 2 }}>{registrationSuccess}</Alert>}

            <Button fullWidth type="submit" variant="contained" color="secondary" sx={{ mt: 3 }}>
              Register Me
            </Button>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default LoginRegister;