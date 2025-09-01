# Tasker Application System

## Overview

The Tasker Application System replaces the previous simple role update mechanism with a comprehensive, multi-step application process similar to a Google Form. This ensures that users who want to become taskers go through proper verification and review before being granted tasker privileges.

## Key Features

### 1. **Multi-Step Application Form**
- **Step 1: Personal Information** - Basic details, contact info, ID verification
- **Step 2: Professional Information** - Skills, experience, rates, availability
- **Step 3: Verification & Requirements** - ID verification, background check agreement
- **Step 4: Additional Information** - Bio, motivation, terms agreement

### 2. **Comprehensive Data Collection**
- Personal identification details
- Professional skills and experience
- Verification requirements
- Background information
- Legal agreements

### 3. **Admin Review System**
- Admin dashboard to review applications
- Approve/reject with notes
- Automatic role updates upon approval
- Application status tracking

### 4. **User Experience Improvements**
- Clear application status updates
- Progress indicators
- Form validation
- Helpful error messages

## Database Schema

### `tasker_applications` Table

```sql
CREATE TABLE tasker_applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  
  -- Personal Information (JSONB)
  personal_info JSONB NOT NULL,
  
  -- Professional Information (JSONB)
  professional_info JSONB NOT NULL,
  
  -- Verification & Requirements (JSONB)
  verification JSONB NOT NULL,
  
  -- Additional Information (JSONB)
  additional_info JSONB NOT NULL,
  
  -- Admin Review Fields
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Components

### 1. **TaskerApplicationModal**
- Multi-step form interface
- Form validation
- Progress indicators
- Data submission to database

### 2. **TaskerApplicationReview** (Admin)
- Application listing and filtering
- Detailed application review
- Approve/reject functionality
- Automatic role updates

### 3. **Updated TaskApplicationModal**
- Integration with new application system
- Application status display
- Conditional content based on status

## User Flow

### For Users Wanting to Become Taskers:

1. **Browse Tasks** - User sees tasks but cannot apply
2. **Click Apply** - System shows "Become a Tasker" section
3. **Submit Application** - User fills out multi-step form
4. **Wait for Review** - Application status shows "Pending Review"
5. **Get Approved** - Admin reviews and approves application
6. **Role Updated** - User automatically gets 'both' role
7. **Apply for Tasks** - User can now submit task applications

### For Admins:

1. **Access Review Panel** - Admin-only component
2. **View Applications** - List of all pending applications
3. **Review Details** - Click to see full application
4. **Make Decision** - Approve or reject with notes
5. **Automatic Updates** - System updates user roles and statuses

## Implementation Details

### Form Validation
- Required field validation at each step
- Data format validation
- Business logic validation (e.g., minimum age requirements)

### Security Features
- Row Level Security (RLS) policies
- User can only see their own applications
- Admins can see all applications
- Secure data transmission

### Error Handling
- Clear error messages
- Form validation feedback
- Database error handling
- User-friendly notifications

## Benefits

### 1. **Quality Control**
- Proper verification of tasker credentials
- Background check agreements
- Skill and experience validation

### 2. **User Trust**
- Verified taskers increase customer confidence
- Professional application process
- Clear status updates

### 3. **Admin Control**
- Centralized application management
- Consistent review process
- Audit trail for decisions

### 4. **Scalability**
- Structured data collection
- Easy to extend with additional fields
- Automated role management

## Setup Instructions

### 1. **Database Setup**
```bash
# Run the SQL file to create the table
psql -d your_database -f tasker_applications_table.sql
```

### 2. **Component Integration**
- Import `TaskerApplicationModal` where needed
- Update existing task application flows
- Add admin review component to admin dashboard

### 3. **Role Configuration**
- Ensure admin users have 'admin' role in profiles table
- Update existing role update functions
- Test role assignment flow

## Usage Examples

### Opening Tasker Application Modal
```tsx
import TaskerApplicationModal from '../components/TaskerApplicationModal'

const [showTaskerApplication, setShowTaskerApplication] = useState(false)

<TaskerApplicationModal
  visible={showTaskerApplication}
  onClose={() => setShowTaskerApplication(false)}
  onApplicationSubmitted={() => {
    // Handle successful submission
    setShowTaskerApplication(false)
  }}
/>
```

### Checking Application Status
```tsx
const { checkTaskerApplicationStatus } = useTaskApplications()

const checkStatus = async () => {
  const status = await checkTaskerApplicationStatus()
  if (status?.status === 'approved') {
    // User can apply for tasks
  }
}
```

## Future Enhancements

### 1. **Document Upload**
- ID verification documents
- Certificates and qualifications
- Reference letters

### 2. **Automated Verification**
- ID verification APIs
- Background check integration
- Reference checking system

### 3. **Advanced Filtering**
- Application search and filtering
- Status-based sorting
- Date range filtering

### 4. **Notification System**
- Email notifications for status changes
- SMS notifications for urgent updates
- In-app notification center

## Troubleshooting

### Common Issues

1. **Application Not Saving**
   - Check database permissions
   - Verify RLS policies
   - Check form validation

2. **Role Not Updating After Approval**
   - Verify admin permissions
   - Check database triggers
   - Review error logs

3. **Form Validation Errors**
   - Check required field logic
   - Verify data format requirements
   - Review validation functions

### Debug Mode
Enable console logging in development:
```tsx
console.log('Application data:', applicationData)
console.log('Database response:', response)
```

## Support

For technical support or questions about the tasker application system:
- Check the database logs for errors
- Verify user permissions and roles
- Review the application status flow
- Test with different user scenarios
