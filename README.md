# Team Task Manager

A complete full-stack MERN application for team collaboration and task management. Built with **Express.js**, **React 19**, **MongoDB**, and **Vite**.

## 🎯 Overview

Team Task Manager is a modern web application that enables teams to:
- Manage teams and team members with role-based access
- Create and manage projects within teams
- Track tasks with status, priority, and assignees
- Collaborate with real-time task updates
- Control user access with Admin/Member roles
- View dashboard analytics and project summaries

## 📊 Tech Stack

### Backend
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose 9.6.2
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Security**: bcryptjs 3.0.3, CORS
- **Validation**: express-validator 7.3.2
- **Development**: nodemon 3.1.14

### Frontend
- **Framework**: React 19.2.6
- **Build Tool**: Vite 8.0.13
- **Routing**: React Router DOM 7.15.1
- **HTTP Client**: Axios 1.16.1
- **Styling**: CSS3 (custom)
- **Linting**: ESLint 10.4.0

## 📁 Project Structure

```
Team Task Manager/
├── server/                           # Backend API
│   ├── src/
│   │   ├── controllers/              # Business logic
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── teamController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Team.js
│   │   │   ├── Project.js
│   │   │   └── Task.js
│   │   ├── routes/                   # API endpoints
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── teamRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── middleware/               # Auth & RBAC
│   │   │   ├── auth.js
│   │   │   └── rbac.js
│   │   ├── utils/
│   │   │   └── validators.js
│   │   └── config/
│   │       └── database.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── .env                          # (NOT in repo - in .gitignore)
│   └── .gitignore
│
├── client/                           # Frontend UI
│   ├── src/
│   │   ├── pages/                    # Full-screen views
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── TeamDetailPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── MembersPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── components/               # Reusable UI
│   │   │   ├── AppShell.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Modal components
│   │   │   └── Form components
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── format.js
│   │   │   └── validators.js
│   │   ├── styles.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── .env                          # (NOT in repo - in .gitignore)
│   └── .gitignore
│
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v24.12.0+
- npm v11.6.2+
- MongoDB (local or remote)

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/team-task-manager
   JWT_SECRET=your-secret-key-here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start backend:**
   ```bash
   npm start              # Production
   npm run dev            # Development (with auto-restart)
   ```

Backend runs at: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start frontend:**
   ```bash
   npm run dev            # Development
   npm run build          # Production build
   npm run preview        # Preview production build
   ```

Frontend runs at: `http://localhost:5173`

## 🔐 Authentication & Authorization

### User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Create/delete teams, manage all users, full access to all features |
| **Member** | Create/edit/delete tasks within visible projects, manage own profile |

### Authentication Flow

1. User signs up/logs in
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. Token automatically added to all API requests via Axios interceptor
5. Backend verifies token on protected routes

### Sample Credentials (Development)

```
Admin Account:
Email: admin@example.com
Password: AdminPassword123!

Member Account:
Email: member@example.com
Password: MemberPassword123!
```

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/signup              # Register new user
POST   /api/auth/login               # Login user
GET    /api/auth/me                  # Get current user
```

### Users (Admin Only)
```
GET    /api/users                    # List all users
POST   /api/users                    # Create new user
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user
```

### Teams
```
GET    /api/teams                    # List user's teams
POST   /api/teams                    # Create team
GET    /api/teams/:id                # Get team details
PUT    /api/teams/:id                # Update team
DELETE /api/teams/:id                # Delete team
POST   /api/teams/:id/members        # Add member
DELETE /api/teams/:id/members/:memberId  # Remove member
```

### Projects
```
GET    /api/projects                 # List user's projects
POST   /api/projects                 # Create project
GET    /api/projects/:id             # Get project details
PUT    /api/projects/:id             # Update project
DELETE /api/projects/:id             # Delete project
POST   /api/projects/:id/members     # Add member
```

### Tasks
```
GET    /api/tasks                    # List tasks (filterable)
POST   /api/tasks                    # Create task
GET    /api/tasks/:id                # Get task details
PUT    /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task
```

### Dashboard
```
GET    /api/dashboard                # Get summary metrics
```

### Profile
```
PUT    /api/profile                  # Update user profile
PUT    /api/profile/password         # Change password
```

## 🗄️ Data Models

### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String ("Admin" | "Member"),
  createdAt: Date,
  updatedAt: Date
}
```

### Team
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  members: [{ userId, role }],
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  team: ObjectId (Team),
  members: [{ userId, role }],
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Task
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  project: ObjectId (Project),
  team: ObjectId (Team),
  assignedTo: ObjectId (User),
  createdBy: ObjectId (User),
  status: String ("todo" | "in-progress" | "completed"),
  priority: String ("low" | "medium" | "high"),
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 💻 Frontend Features

### Pages

| Page | Features |
|------|----------|
| **Login/Signup** | User authentication, form validation |
| **Dashboard** | Summary metrics, team/project/task overview |
| **Teams** | Create team, view members, manage roles |
| **Projects** | Create project, manage members, view tasks |
| **Tasks** | Full CRUD, assign users, filter by status/priority |
| **Members** | Admin-only, manage all users, CRUD operations |
| **Profile** | Update profile, change password |

### UI Features

- ✅ **Responsive Design**: Desktop, tablet, and mobile views
- ✅ **Collapsible Sidebar**: Toggle between 290px (expanded) and 96px (compact)
- ✅ **Modal Dialogs**: All CRUD operations use modal windows
- ✅ **Task Metadata**: Display creator name and creation timestamp
- ✅ **Form Validation**: Client-side validation with error messages
- ✅ **Loading States**: Visual feedback during async operations
- ✅ **Tables**: Filterable member and task lists
- ✅ **Status Badges**: Visual indicators for task status/priority

### Styling

- **Color Scheme**: Blue (primary), green (success), red (danger), orange (warning)
- **Typography**: Clear hierarchy with multiple font sizes
- **Spacing**: Consistent padding/margins using CSS variables
- **Cards**: Elevated design with borders and shadows
- **Responsive**: Mobile-first approach with CSS media queries

## 🔄 Workflow Examples

### Create a Team
1. Click "Create Team" button
2. Fill in team name and description
3. Select members to add
4. Click "Create"
5. Team appears in Teams list

### Create a Task
1. Navigate to Tasks
2. Click "Create Task" button
3. Select project and team
4. Set title, description, priority, due date
5. Assign to a team member
6. Click "Create"
7. Task appears in list with creator metadata

### Update User Role
1. Navigate to Members page (Admin only)
2. Find user in table
3. Click "Edit" button
4. Change role from dropdown
5. Click "Save"
6. User's role updated

## 📊 Database Seeding

The project includes realistic test data:
- **2 Admin users**
- **18 Member users**
- **10 SDE-themed teams**
- **5 projects**
- **100 tasks** with varied statuses and priorities

*Note: Seed data is for development only. Use production data for live deployment.*

## 🛠️ Development

### Backend Scripts
```bash
npm start              # Run production server
npm run dev            # Run with nodemon (auto-restart)
```

### Frontend Scripts
```bash
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 🔒 Security

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens for stateless authentication
- ✅ CORS enabled for frontend communication
- ✅ Role-based access control enforced
- ✅ Input validation on all endpoints
- ✅ Environment variables for sensitive data
- ✅ Secure token transmission via Bearer scheme

## 📝 Environment Variables

### Backend (server/.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection | `mongodb://localhost:27017/team-task-manager` |
| `JWT_SECRET` | JWT signing key | `your-secret-key` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend (client/.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## 🐛 Troubleshooting

### Backend Connection Error
- **Problem**: Cannot connect to MongoDB
- **Solution**: Ensure MongoDB is running or update `MONGO_URI` in `.env`

### API 404 Errors
- **Problem**: Frontend cannot reach backend
- **Solution**: Check `VITE_API_URL` in client `.env` matches backend URL

### JWT Authentication Error (401)
- **Problem**: Token is invalid or expired
- **Solution**: 
  - Check `JWT_SECRET` is same on backend
  - Clear localStorage and login again
  - Verify `Authorization` header format: `Authorization: Bearer <token>`

### CORS Error in Browser
- **Problem**: Frontend receives CORS error from backend
- **Solution**: Update `CLIENT_URL` in server `.env` to match frontend URL

### Build Fails
- **Problem**: npm run build fails
- **Solution**: 
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install` again
  - Check for TypeScript/ESLint errors: `npm run lint`

## 🧪 Testing

### Manual Testing with Postman

**Login:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

**Get Teams (with token):**
```bash
GET http://localhost:5000/api/teams
Authorization: Bearer <token_from_login>
```

**Create Task:**
```bash
POST http://localhost:5000/api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement API endpoint",
  "project": "project_id",
  "team": "team_id",
  "priority": "high",
  "status": "in-progress"
}
```

## 🌐 Deployment

### Backend Deployment Options
- **Heroku**: `git push heroku main`
- **AWS**: Deploy to EC2 or Elastic Beanstalk
- **DigitalOcean**: Use App Platform
- **Railway**: Connect GitHub repo

### Frontend Deployment Options
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Configure base path in vite.config.js
- **AWS S3 + CloudFront**: Upload `dist/` to S3

### Production Environment Variables
```bash
# Backend
NODE_ENV=production
MONGO_URI=<production_mongodb_uri>
JWT_SECRET=<strong_random_secret>
CLIENT_URL=<production_frontend_url>

# Frontend
VITE_API_URL=<production_api_url>
```

## 📞 Support & Contributing

For issues, questions, or contributions:
1. Check existing documentation
2. Review error messages and logs
3. Contact the development team
4. Submit issues/PRs to the repository

## 📄 License

MIT

---

**Built with ❤️ for modern team collaboration**
