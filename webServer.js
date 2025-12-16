/**
 * Project 4 Express server connected to MongoDB 'project4'.
 * Start with: node webServer.js
 * Client uses axios to call these endpoints.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from "mongoose";
// eslint-disable-next-line import/no-extraneous-dependencies
import bluebird from "bluebird";
import express from "express";
import session from "express-session";
import multer from 'multer';
import fs from 'fs';
import { Server } from "socket.io";
import { createServer } from "http";

// eslint-disable-next-line import/no-extraneous-dependencies
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ToDO - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// import models from "./modelData/photoApp.js";

// Load the Mongoose schema for User, Photo, and SchemaInfo
// ToDO - Your submission will use code below, so make sure to uncomment this line for tests and before submission!
import User from "./schema/user.js";
import Photo from "./schema/photo.js";
import SchemaInfo from "./schema/schemaInfo.js";

const portno = 3001; // Port number to use
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(bodyParser.json());

// Session Middleware
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connects to MongoDB
mongoose.Promise = bluebird;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project4", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Path handling?
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

// Multer FILE UPLOADING
const processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');

// AUTHENTICATION
// If user is logged in, go to next in middleware, otherwise return status 401
const checkLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

// LOGIN and LOGOUT Routes

/**
 * URL /admin/login - Log in
 */
app.post('/admin/login', async (req, res) => {
  try {
    const { login_name, password } = req.body;
    const user = await User.findOne({ login_name });

    if (!user || user.password !== password) {
      console.log('Invalid login information');
      return res.status(400).send('Invalid login information');
    }

    // Store user info in the session
    req.session.user = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name
    };

    // Return user info to frontend
    return res.status(200).json(req.session.user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /admin/logout - Log out
 */
app.post('/admin/logout', (req, res) => {
  if (!req.session.user) {
    return res.status(400).send('Not logged in');
  }

  return req.session.destroy((err) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send();
    }
  });
});

/**
 * /test/info - Returns the SchemaInfo object of the database in JSON format.
 *              This is good for testing connectivity with MongoDB.
 */

app.get('/test/info', checkLoggedIn, async (request, response) => {

  try {
    // Test with schemaInfo
    const info = await SchemaInfo.findOne({});
    if (!info) {
      return response.status(404).send('SchemaInfo not found');
    }

    // Send 200 if good, Send 500 if error
    return response.status(200).json(info);
  } catch (error) {
    return response.status(500).send(error);
  }
});

/**
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get('/test/counts', checkLoggedIn, async (request, response) => {

  try {
    // Test with counts
    const info = await SchemaInfo.findOne({});
    if (!info) {
      return response.status(404).send('SchemaInfo not found');
    }
    return response.status(200).json(info);
  } catch (error) {
    return response.status(500).send(error);
  }
});


/**
 * URL /user/list - Returns all the User objects.
 */
app.get('/user/list', checkLoggedIn, async (request, response) => {

  try {
    // Select to get only the needed fields
    const users = await User.find({}).select('_id first_name last_name').lean(); // .lean makes plain object

    response.status(200).json(users);
  } catch (error) {
    response.status(500).send(error);
  }

});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get('/user/:id', checkLoggedIn, async (request, response) => {
  const id = request.params.id;

  // Make sure id is valid mongoose objectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid user ID format');
  }

  try {
    // Find user by id, if doesn't exist, send 400
    const user = await User.findById(id).select('_id first_name last_name location description occupation').lean(); // If we don't select, then it includes a __v property which fails the API Tests

    if (!user) {
      return response.status(400).send('User not found');
    }
    // Send user
    return response.status(200).json(user);
  } catch (error) {
    return response.status(400).send(error);
  }

});

/**
 * URL /user/:id/photo-highlights - Returns the most recent and most commented photo for User (id).
 */
app.get('/user/:id/photo-highlights', checkLoggedIn, async (request, response) => {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid user ID format');
  }

  try {
    // Get all photos for the user
    const photos = await Photo.find({ user_id: id }).lean();

    if (!photos || photos.length === 0) {
      return response.status(200).json({ mostRecent: null, mostComments: null });
    }

    // Find most recent photo (by date_time)
    const mostRecent = photos.reduce((latest, photo) => {
      return new Date(photo.date_time) > new Date(latest.date_time) ? photo : latest;
    });

    // Find photo with most comments
    const mostComments = photos.reduce((maxComments, photo) => {
      const currentCount = photo.comments ? photo.comments.length : 0;
      const maxCount = maxComments.comments ? maxComments.comments.length : 0;
      return currentCount > maxCount ? photo : maxComments;
    });

    return response.status(200).json({
      mostRecent: {
        _id: mostRecent._id,
        file_name: mostRecent.file_name,
        date_time: mostRecent.date_time
      },
      mostComments: {
        _id: mostComments._id,
        file_name: mostComments.file_name,
        commentCount: mostComments.comments ? mostComments.comments.length : 0
      }
    });
  } catch (error) {
    return response.status(500).send(error);
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get('/photosOfUser/:id', checkLoggedIn, async (request, response) => {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid user ID format');
  }

  try {
    const user_check = await User.findById(id);

    if (!user_check) {
      return response.status(400).send('User not found');
    }

    // Find all photos by the user
    const photos = await Photo.find({ user_id: id }).lean();

    // Go trhough all photos and populate comment user data with .map
    const photosComments = await Promise.all(photos.map(async (photo) => {
      const commentArray = await Promise.all(photo.comments.map(async (comment) => {
        const user = await User.findById(comment.user_id).select('_id first_name last_name').lean();
        // Create new comment object including user info
        return {
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: user,
        };
      }));
      // Return a new photo object with comments array
      return {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: commentArray,
        likes: photo.likes || [],
      };
    }));

    return response.status(200).json(photosComments);
  } catch (error) {
    return response.status(400).send(error);
  }


});

/**
* URL /user/list/counts - Endpoint returns counts of comments and photos posted by an user. Used for Count Bubbles Advanced Feature
*/
app.get('/user/list/counts', checkLoggedIn, async (request, response) => {
  try {
    const users = await User.find({}).select('_id first_name last_name').lean();

    const userCounts = await Promise.all(users.map(async (user) => {
      // Count photos and comments for each user
      // .countDocuments method useful here
      const [photoCount, commentCount] = await Promise.all([
        Photo.countDocuments({ user_id: user._id }),
        Photo.countDocuments({ "comments.user_id": user._id })
      ]);

      return {
        ...user,
        photo_count: photoCount,
        comment_count: commentCount,
      };
    }));

    return response.status(200).json(userCounts);
  } catch (error) {
    return response.status(500).send(error);
  }
});

/**
* URL comments/:id - gets all comments a user has posted. Used by UserComments page
*/
app.get('/comments/:id', checkLoggedIn, async (request, response) => {
  const { id } = request.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).send('Invalid user ID format');
  }

  try {
    // Get photos that contain any comment by the user
    const photos = await Photo.find({ "comments.user_id": id }).select('_id file_name user_id comments').lean();

    // Create list of comments
    const userComments = photos.flatMap(photo => {
      return photo.comments
        .filter(comment => String(comment.user_id) === id) // Filter to get only current user's comments
        .map(comment => ({
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          photo: { // Include photo info so it can be used to link from UserComments page
            _id: photo._id,
            file_name: photo.file_name,
            user_id: photo.user_id,
          }
        }));
    });

    return response.status(200).json(userComments);
  } catch (error) {
    return response.status(500).send(error);
  }
});

/**
* URL /commentsOfPhoto/:photo_id - Gets comments for a photo
*/
app.post('/commentsOfPhoto/:photo_id', checkLoggedIn, async (req, res) => {
  const { comment } = req.body;
  const { photo_id } = req.params;

  // Check if comment is empty
  if (!comment || comment.trim().length === 0) {
    return res.status(400).send('Comment cannot be empty');
  }

  // Make sure photo exists
  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return res.status(404).send('No Photos Found');
    }

    // We get the current user
    photo.comments.push({
      comment: comment,
      date_time: new Date(),
      user_id: req.session.user._id
    });
    await photo.save();

    return res.status(200).send('Comment added');
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).send(error);
  }
});

/**
* URL /photos/new - Upload a new photo
*/
app.post('/photos/new', checkLoggedIn, (req, res) => {
  processFormBody(req, res, async function (err) {
    // Errors
    if (err || !req.file || req.file.size === 0) {
      return res.status(400).send('No file uploaded or upload error. File may be empty.');
    }

    // generate file name
    const timestamp = new Date().valueOf();
    const filename = 'U' + String(timestamp) + req.file.originalname;

    // write the file to /images
    fs.writeFile(`./images/${filename}`, req.file.buffer, async function (fsError) {
      if (fsError) {
        console.error("Error writing file:", fsError);
        return res.status(500).send('Error writing file');
      }

      // After writing file, save to database
      try {
        await Photo.create({
          file_name: filename, // The name of the file on disk
          date_time: new Date(),
          user_id: req.session.user._id,
          comments: []
        });

        return res.status(200).send('Photo uploaded successfully');
      } catch (dbError) {
        console.error('Error creating photo in DB:', dbError);
        return res.status(500).send(dbError);
      }
    });
    return 0;
  });
});

/**
 * URL /user - New user registration
 */
app.post('/user', async (request, response) => {
  const {
    login_name, password, first_name, last_name,
    location, description, occupation
  } = request.body;

  // If anything is missing, fail
  if (!login_name || !password || !first_name || !last_name) {
    return response.status(400).send('login_name, password, first_name, last_name are required');
  }

  try {
    // login_name must be unique
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return response.status(400).send('Login name already exists. Please choose another.');
    }

    // create user
    const newUser = await User.create({
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation
    });

    return response.status(200).json({
      _id: newUser._id,
      login_name: newUser.login_name
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return response.status(500).send(error);
  }
});

// Returns the currently logged in user if a user is logged in
app.get('/admin/current', (request, response) => {
  if (request.session.user) {
    response.status(200).json(request.session.user);
  } else {
    response.status(401).send('Not logged in');
  }
});

/**
 * URL /photos/like/:id - Like a photo
 */
app.post('/photos/like/:id', checkLoggedIn, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid photo ID');
  }

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    // Add user to likes if not already present
    if (!photo.likes.includes(userId)) {
      photo.likes.push(userId);
      await photo.save();

      // Broadcast update
      io.emit('like_update', {
        photo_id: photo._id,
        likes: photo.likes
      });
    }

    return res.status(200).send('Photo liked');
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /photos/unlike/:id - Unlike a photo
 */
app.post('/photos/unlike/:id', checkLoggedIn, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid photo ID');
  }

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    // Remove user from likes
    if (photo.likes.includes(userId)) {
      photo.likes = photo.likes.filter(uid => String(uid) !== String(userId));
      await photo.save();

      // Broadcast update
      io.emit('like_update', {
        photo_id: photo._id,
        likes: photo.likes
      });
    }

    return res.status(200).send('Photo unliked');
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /favorites - Add a photo to favorites
 */
app.post('/favorites', checkLoggedIn, async (req, res) => {
  const { photo_id } = req.body;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(photo_id)) {
    return res.status(400).send('Invalid photo ID');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    if (!user.favorites.includes(photo_id)) {
      user.favorites.push(photo_id);
      await user.save();
    }

    return res.status(200).send('Photo added to favorites');
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /favorites - Get favorite photos
 */
app.get('/favorites', checkLoggedIn, async (req, res) => {
  const userId = req.session.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const favorites = user.favorites || [];

    // Find all photos in the favorites list
    const photos = await Photo.find({ _id: { $in: favorites } }).lean();

    return res.status(200).json(photos);
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /favorites/:photo_id - Remove photo from favorites
 */
app.delete('/favorites/:photo_id', checkLoggedIn, async (req, res) => {
  const { photo_id } = req.params;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(photo_id)) {
    return res.status(400).send('Invalid photo ID');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.favorites) {
      user.favorites = user.favorites.filter(fid => String(fid) !== String(photo_id));
      await user.save();
    }

    return res.status(200).send('Photo removed from favorites');
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * URL /photos/:id - Delete photo (must be owned by user that uploaded it)
 */
app.delete('/photos/:id', checkLoggedIn, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid photo ID');
  }

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    // Check ownership
    if (String(photo.user_id) !== String(userId)) {
      return res.status(403).send('You can only delete your own photos');
    }

    // Delete file
    const filePath = `./images/${photo.file_name}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove photo from all users' favorites
    await User.updateMany(
      { favorites: id },
      { $pull: { favorites: id } }
    );

    // Delete photo document
    await Photo.findByIdAndDelete(id);

    return res.status(200).send('Photo deleted');
  } catch (error) {
    console.error('Error deleting photo:', error);
    return res.status(500).send(error);
  }
});

/**
 * URL /comments/:photo_id/:comment_id - Delete a comment
 */
app.delete('/comments/:photo_id/:comment_id', checkLoggedIn, async (req, res) => {
  const { photo_id, comment_id } = req.params;
  const userId = req.session.user._id;

  if (!mongoose.Types.ObjectId.isValid(photo_id) || !mongoose.Types.ObjectId.isValid(comment_id)) {
    return res.status(400).send('Invalid ID format');
  }

  try {
    const photo = await Photo.findById(photo_id);
    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    const comment = photo.comments.id(comment_id);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    // Check ownership
    if (String(comment.user_id) !== String(userId)) {
      return res.status(403).send('You can only delete your own comments');
    }

    // Remove the comment
    photo.comments.pull(comment_id);
    await photo.save();

    return res.status(200).send('Comment deleted');
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).send(error);
  }
});

/**
 * URL /user - Delete current user account (cascade delete all data)
 */
app.delete('/user', checkLoggedIn, async (req, res) => {
  const userId = req.session.user._id;

  try {
    // 1. Get all photos owned by user to delete files
    const userPhotos = await Photo.find({ user_id: userId });
    for (const photo of userPhotos) {
      const filePath = `./images/${photo.file_name}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 2. Delete all photos owned by user
    await Photo.deleteMany({ user_id: userId });

    // 3. Delete all comments made by user from all photos
    await Photo.updateMany(
      { 'comments.user_id': userId },
      { $pull: { comments: { user_id: userId } } }
    );

    // 4. Remove user from all favorites
    await User.updateMany(
      {},
      { $pull: { favorites: { $in: userPhotos.map(p => p._id) } } }
    );

    // 5. Delete the user document
    await User.findByIdAndDelete(userId);

    // 6. Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });

    return res.status(200).send('User account deleted');
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).send(error);
  }
});

const server = httpServer.listen(portno, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
    port +
    " exporting the directory " +
    __dirname
  );
});