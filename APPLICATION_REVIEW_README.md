# Application Review System

This document describes the new application review system that allows task owners to review, accept, and decline tasker applications.

## Features

### 1. Task Application Display
- **TaskApplicationCard**: Displays individual task applications with:
  - Tasker profile information (name, username, rating, avatar)
  - Application details (proposed price, estimated time, availability date)
  - Application message/cover letter
  - Current status (pending, accepted, declined)
  - Action buttons for task owners

### 2. Tasker Profile Review
- **TaskerProfileModal**: Comprehensive view of tasker profiles including:
  - Basic information (name, username, avatar, rating)
  - Statistics (hourly rate, completed tasks, years of experience)
  - Location information
  - Bio and description
  - Skills and expertise
  - Certifications
  - Languages spoken
  - Response time

### 3. Application Management
- **Accept Application**: 
  - Updates application status to 'accepted'
  - Changes task status to 'in_progress'
  - Assigns the tasker to the task
  - Refreshes the task data
- **Decline Application**: 
  - Updates application status to 'rejected'
  - Keeps task open for other applications

## How to Use

### For Task Owners (Customers)

1. **View Applications**:
   - Go to the Jobs tab
   - Switch to "My Tasks" view
   - Click "View Applications" on any of your posted tasks

2. **Review Applications**:
   - Each application shows the tasker's basic info and proposal
   - Click "View Profile" to see the full tasker profile
   - Review the tasker's skills, experience, and reviews

3. **Make Decisions**:
   - **Accept**: Click the green "Accept" button
   - **Decline**: Click the red "Decline" button
   - **View Profile**: Click "View Profile" to see detailed information

### For Taskers

1. **Submit Applications**:
   - Browse available jobs in the Jobs tab
   - Click "Apply" on tasks you're interested in
   - Fill out the application form with your proposal

2. **Track Application Status**:
   - Your applications will show as pending, accepted, or declined
   - Accepted applications will automatically assign you to the task

## Technical Implementation

### Components

- `TaskApplicationCard.tsx`: Individual application display
- `TaskerProfileModal.tsx`: Full tasker profile view
- Updated `jobs.tsx`: Main jobs page with application review

### Database Integration

- Fetches applications with joined tasker profile data
- Updates application status in real-time
- Automatically updates task status when applications are accepted

### State Management

- Local state for modals and selected items
- Real-time updates using Supabase
- Proper error handling and loading states

## Database Schema

The system uses the existing `task_applications` table with joins to `profiles` for tasker information:

```sql
SELECT 
  *,
  tasker_profile:profiles!tasker_id (
    full_name, username, avatar_url, rating_average, rating_count, 
    hourly_rate, bio, skills, experience_years, response_time, city, state, 
    completed_tasks, certifications, languages
  )
FROM task_applications
WHERE task_id = ?
```

## Future Enhancements

1. **Notifications**: Send push notifications when applications are accepted/declined
2. **Chat Integration**: Direct messaging between task owners and taskers
3. **Application Filtering**: Sort applications by rating, price, or experience
4. **Bulk Actions**: Accept/decline multiple applications at once
5. **Application History**: Track all application decisions and outcomes

## Testing

To test the system:

1. Create a task as a customer
2. Apply to the task as a tasker (different account)
3. Switch back to customer account and view applications
4. Test accept/decline functionality
5. Verify task status updates correctly

## Troubleshooting

### Common Issues

1. **Applications not loading**: Check Supabase connection and permissions
2. **Profile data missing**: Ensure tasker profiles are properly populated
3. **Status not updating**: Verify database policies allow updates

### Debug Information

The system includes console logging for debugging:
- Application fetch operations
- Status update operations
- Error handling details

## Security Considerations

- Only task owners can accept/decline applications
- Profile data is fetched with proper RLS policies
- All operations are logged and tracked
- Input validation on all user inputs
