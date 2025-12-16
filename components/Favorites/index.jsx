import React, { useState, useEffect } from 'react';
import {
    Typography,
    Grid,
    Card,
    CardMedia,
    IconButton,
    Modal,
    Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchFavorites as fetchFavoritesAPI, removeFromFavorites } from '../../lib/fetchData';

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // loadFavorites fetches favorite photos of the user
    const loadFavorites = async () => {
        try {
            const data = await fetchFavoritesAPI();
            setFavorites(data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
        }
    };

    useEffect(() => {
        loadFavorites();
    }, []);

    // Removes favorite when user clicks trash button
    const handleRemoveFavorite = async (e, photoId) => {
        e.stopPropagation(); // Prevent opening modal
        try {
            await removeFromFavorites(photoId);
            setFavorites(favorites.filter((photo) => photo._id !== photoId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    // Modal for photo on favorites page
    const handleOpenModal = (photo) => {
        setSelectedPhoto(photo);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPhoto(null);
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: 800,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                My Favorites
            </Typography>
            {favorites.length === 0 ? (
                <Typography variant="body1">No favorites yet.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {favorites.map((photo) => (
                        <Grid item xs={6} sm={4} md={3} key={photo._id}>
                            <Card
                                sx={{ position: 'relative', cursor: 'pointer' }}
                                onClick={() => handleOpenModal(photo)}
                            >
                                <CardMedia
                                    component="img"
                                    image={`/images/${photo.file_name}`}
                                    alt={photo.file_name}
                                    sx={{
                                        aspectRatio: '1.4',
                                        objectFit: 'cover',
                                        width: '100%'
                                    }}
                                />
                                <IconButton
                                    aria-label="remove from favorites"
                                    onClick={(e) => handleRemoveFavorite(e, photo._id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 5,
                                        right: 5,
                                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                        },
                                    }}
                                >
                                    <DeleteIcon color="error" />
                                </IconButton>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    {selectedPhoto && (
                        <>
                            <img
                                src={`/images/${selectedPhoto.file_name}`}
                                alt={selectedPhoto.file_name}
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                            />
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                Date: {new Date(selectedPhoto.date_time).toLocaleString()}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
}

export default Favorites;
