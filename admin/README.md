# Muyacon Admin Panel

A modern, responsive admin panel for managing the Muyacon platform. This admin website connects to the same Supabase database as your mobile app, providing comprehensive management capabilities without any conflicts.

## Features

### 🎯 **Dashboard Overview**
- Real-time statistics and metrics
- Task completion trends
- User growth analytics
- Revenue tracking
- Interactive charts and graphs

### 📋 **Tasks Management**
- View all platform tasks
- Filter by status, location, and search terms
- Update task statuses
- Delete tasks when necessary
- Detailed task information modal

### 👥 **Users Management**
- Complete user profile management
- User type assignment (Customer, Tasker, Admin)
- Verification status management
- Search and filter capabilities
- Bulk user operations

### 🛠️ **Taskers Management**
- Review tasker applications
- Approve/reject applications
- View skills, experience, and rates
- Application status tracking
- Detailed applicant profiles

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to your Supabase project

### Installation

1. **Navigate to the admin directory:**
   ```bash
   cd admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3001`

## 🔧 Configuration

### Supabase Setup

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the Project URL and anon/public key

2. **Update environment variables:**
   - Copy the values to your `.env.local` file

3. **Database Permissions:**
   - Ensure your Supabase RLS policies allow admin access
   - The admin panel uses the same database as your mobile app

### Port Configuration

The admin panel runs on port **3001** by default to avoid conflicts with your mobile app. You can change this in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change this if needed
  host: true
}
```

## 📱 Mobile App Compatibility

✅ **No Conflicts**: The admin panel connects to the same Supabase database  
✅ **Shared Data**: View and manage the same tasks, users, and data  
✅ **Real-time Updates**: Changes made in admin reflect immediately in mobile app  
✅ **Separate Ports**: Admin runs on port 3001, mobile app on different port  

## 🎨 Customization

### Styling
- Built with Tailwind CSS for easy customization
- Custom color scheme in `tailwind.config.js`
- Responsive design for all screen sizes

### Components
- Modular React components
- Reusable UI components
- Easy to extend and modify

### Data Models
- TypeScript interfaces for type safety
- Supabase integration patterns
- Extensible data structures

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Deploy Options
- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag and drop the `dist` folder
- **AWS S3**: Upload the built files to S3
- **Custom Server**: Serve the static files from any web server

### Environment Variables for Production
Make sure to set the same environment variables in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔒 Security

### Authentication
- Supabase authentication integration
- Admin-only access control
- Secure session management

### Data Access
- Row Level Security (RLS) compliance
- Admin role verification
- Secure API endpoints

## 📊 Admin Features

### Dashboard Analytics
- **User Metrics**: Total users, new registrations, user types
- **Task Analytics**: Task creation, completion rates, status distribution
- **Revenue Tracking**: Platform earnings, task pricing trends
- **Performance Charts**: Weekly/monthly trends, real-time data

### Management Tools
- **Bulk Operations**: Update multiple items at once
- **Advanced Filtering**: Search by multiple criteria
- **Export Capabilities**: Download data for analysis
- **Audit Logs**: Track all admin actions

## 🛠️ Development

### Project Structure
```
admin/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Supabase, Auth)
│   ├── pages/          # Main page components
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── vite.config.ts      # Vite build configuration
└── tsconfig.json       # TypeScript configuration
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routing in `App.tsx`
4. Add new data models and interfaces
5. Implement Supabase queries

## 🔍 Troubleshooting

### Common Issues

**"Supabase connection failed"**
- Check your environment variables
- Verify Supabase project is active
- Check network connectivity

**"Permission denied"**
- Verify admin user role in Supabase
- Check RLS policies
- Ensure proper authentication

**"Port already in use"**
- Change port in `vite.config.ts`
- Kill processes using port 3001
- Use different port number

### Getting Help
- Check Supabase documentation
- Review React and Vite docs
- Check browser console for errors
- Verify database schema matches

## 📈 Future Enhancements

- **Real-time Notifications**: WebSocket integration for live updates
- **Advanced Analytics**: More detailed reporting and insights
- **User Management**: Bulk operations and advanced filtering
- **API Integration**: Connect with external services
- **Mobile Admin App**: Native mobile admin interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Muyacon platform. All rights reserved.

---

**Need help?** Check the troubleshooting section or contact the development team.
