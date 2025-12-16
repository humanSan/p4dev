# Project 4: User Stories and Real Time Updates

## User Stories Implemented
- 1, 5, 6, 7

## How to run
1) Make sure MongoDB is running locally.
2) Load demo data:
```bash
node loadDatabase.js
```

## Run client + server together
```bash
npm run dev
```

## API endpoints
- `POST /admin/login` → login user (requires login_name, password)
- `POST /admin/logout` → logout user
- `GET /user/list` → [{ _id, first_name, last_name }] (requires auth)
- `GET /user/:id` → user detail { _id, first_name, last_name, location, description, occupation } (requires auth)
- `GET /photosOfUser/:id` → user's photos with comments (requires auth)
- `POST /commentsOfPhoto/:photo_id` → add comment to photo (requires auth, body: { comment })
- `POST /photos/new` → upload photo (requires auth, multipart form data)
- `POST /user` → register new user (body: { login_name, password, first_name, last_name, location, description, occupation })
