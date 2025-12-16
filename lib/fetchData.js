import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

axios.defaults.withCredentials = true;

export const fetchUserList = async (advanced) => {
  const endpoint = advanced ? '/user/list/counts' : '/user/list';
  const response = await axios.get(`${BASE_URL}${endpoint}`);
  return response.data;
};

export const fetchUser = async (userId) => {
  const response = await axios.get(`${BASE_URL}/user/${userId}`);
  return response.data;
};

export const fetchPhotosOfUser = async (userId) => {
  const response = await axios.get(`${BASE_URL}/photosOfUser/${userId}`);
  return response.data;
};

export const fetchCommentsOfUser = async (userId) => {
  const response = await axios.get(`${BASE_URL}/comments/${userId}`);
  return response.data;
};

export const loginUser = async (loginName, password) => {
  const response = await axios.post(`${BASE_URL}/admin/login`, {
    login_name: loginName,
    password: password
  });
  return response.data;
};

export const logoutUser = async () => {
  await axios.post(`${BASE_URL}/admin/logout`, {});
};

export const registerUser = async (userObj) => {
  // userObj is an object containing login_name, password, ... }
  const response = await axios.post(`${BASE_URL}/user`, userObj);
  return response.data;
};

export const addComment = async (photoId, commentText) => {
  await axios.post(`${BASE_URL}/commentsOfPhoto/${photoId}`, { comment: commentText });
};

export const uploadPhoto = async (file) => {
  const formData = new FormData();

  formData.append('uploadedphoto', file);

  await axios.post(`${BASE_URL}/photos/new`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const checkSession = async () => {
  const response = await axios.get(`${BASE_URL}/admin/current`);
  return response.data;
};

export const likePhoto = async (photoId) => {
  await axios.post(`${BASE_URL}/photos/like/${photoId}`);
};

export const unlikePhoto = async (photoId) => {
  await axios.post(`${BASE_URL}/photos/unlike/${photoId}`);
};

export const fetchFavorites = async () => {
  const response = await axios.get(`${BASE_URL}/favorites`);
  return response.data;
};

export const addToFavorites = async (photoId) => {
  await axios.post(`${BASE_URL}/favorites`, { photo_id: photoId });
};

export const removeFromFavorites = async (photoId) => {
  await axios.delete(`${BASE_URL}/favorites/${photoId}`);
};

export const deletePhoto = async (photoId) => {
  await axios.delete(`${BASE_URL}/photos/${photoId}`);
};

export const deleteComment = async (photoId, commentId) => {
  await axios.delete(`${BASE_URL}/comments/${photoId}/${commentId}`);
};

export const deleteUserAccount = async () => {
  await axios.delete(`${BASE_URL}/user`);
};

export const fetchUserPhotoHighlights = async (userId) => {
  const response = await axios.get(`${BASE_URL}/user/${userId}/photo-highlights`);
  return response.data;
};
