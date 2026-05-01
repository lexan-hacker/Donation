# HelpHub - Crowdsourced Donation Platform

HelpHub is a complete donation-based crowdfunding platform that allows people to create fundraising campaigns for personal, medical, educational, or community needs, and allows others to donate safely and transparently.

## Features

- **User Authentication**: Sign up, login, profile management with JWT
- **Campaign Management**: Create, edit, and manage fundraising campaigns
- **Admin Approval**: All campaigns require admin approval before going live
- **Stripe Integration**: Secure payment processing with Stripe Checkout
- **Donation Tracking**: Real-time progress bars and donor lists
- **Withdrawal System**: Campaign creators can request withdrawals after campaigns close
- **Email Notifications**: Automated emails for donations, approvals, and withdrawals
- **Admin Dashboard**: Manage campaigns, users, withdrawals, and view all donations
- **Scheduled Jobs**: Automatic campaign closure and weekly progress reports

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Stripe (Payments)
- Nodemailer (Email)
- Cloudinary (Image uploads)
- node-cron (Scheduled tasks)

### Frontend
- React 18
- React Router
- Axios
- Stripe.js

## Local Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Stripe account (test mode)
- Email SMTP credentials (or SendGrid)

### 1. Clone and Install Dependencies

```bash
cd helphub

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Random secret for JWT tokens
- `STRIPE_SECRET_KEY`: Stripe test secret key (sk_test_...)
- `STRIPE_PUBLISHABLE_KEY`: Stripe test publishable key (pk_test_...)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP credentials
- `FRONTEND_URL`: Usually http://localhost:3000

### 3. Get Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your test API keys to `.env`
3. For webhooks, install Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas cloud database.

### 5. Run the Application

Terminal 1 (Backend):
```bash
npm run dev
# Server runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 6. Create Admin User

Use this script to promote a user to admin:

```javascript
// scripts/createAdmin.js
const mongoose = require('mongoose');
const User = require('../backend/models/User');
require('dotenv').config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const admin = await User.findOneAndUpdate(
    { email: 'admin@helphub.com' },
    { 
      name: 'Admin',
      email: 'admin@helphub.com',
      role: 'admin',
      password: await require('bcryptjs').hash('admin123', 10)
    },
    { upsert: true, new: true }
  );
  
  console.log('Admin created:', admin.email);
  process.exit();
}

createAdmin();
```

Run with:
```bash
node scripts/createAdmin.js
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Campaigns
- `GET /api/campaigns` - List campaigns (public)
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign (authenticated)
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/my-campaigns` - Get user's campaigns
- `POST /api/campaigns/:id/submit` - Submit for approval

### Donations
- `POST /api/donations/create-checkout` - Create Stripe checkout session
- `GET /api/donations/my-donations` - Get donation history
- `GET /api/donations/campaign/:campaignId` - Get campaign donations

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals/my-withdrawals` - Get user's withdrawals
- `GET /api/withdrawals/:id` - Get withdrawal details

### Admin (requires admin role)
- `GET /api/admin/campaigns` - List all campaigns
- `PUT /api/admin/campaigns/:id/status` - Approve/reject campaign
- `PUT /api/admin/campaigns/:id/feature` - Feature/unfeature campaign
- `GET /api/admin/withdrawals` - List withdrawal requests
- `PUT /api/admin/withdrawals/:id` - Process withdrawal
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user (promote/suspend)
- `GET /api/admin/donations` - List all donations

## Testing Payments

Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date, any CVC

## Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push frontend to GitHub
2. Import to Vercel
3. Set `REACT_APP_API_URL` environment variable
4. Deploy

### Docker (Alternative)
```bash
docker-compose up --build
```

## Project Structure

```
helphub/
├── backend/
│   ├── config/         # Database config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, error handling, rate limiting
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # Stripe, email, cloudinary
│   ├── utils/          # Cron jobs, helpers
│   └── server.js       # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/ # React components
│       ├── context/    # Auth context
│       ├── pages/      # Page components
│       ├── utils/      # API helpers
│       └── App.js      # Main app
├── .env.example
├── package.json
└── README.md
```

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.
