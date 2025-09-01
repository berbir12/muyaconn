# Notification System

This document describes the comprehensive notification system implemented for the Muyacon task marketplace app, covering application reviews, direct bookings, and user preferences.

## 🎯 **Overview**

The notification system provides real-time updates to users about important events in their task marketplace experience, including:
- Application acceptances and declines
- Direct booking requests and status changes
- Task updates and assignments
- Messages and reviews
- System announcements

## 🔔 **Notification Types**

### 1. **Application Notifications**
- **`application_accepted`**: Sent to taskers when their application is accepted
- **`application_declined`**: Sent to taskers when their application is declined

### 2. **Direct Booking Notifications**
- **`direct_booking`**: Sent to technicians for new booking requests
- **`direct_booking_accepted`**: Sent to customers when technicians confirm bookings
- **`direct_booking_declined`**: Sent to customers when technicians decline bookings

### 3. **Existing Notification Types**
- **`task`**: General task-related notifications
- **`application`**: New application submissions
- **`message`**: New messages from other users
- **`review`**: New reviews received
- **`system`**: System-wide announcements

## 🏗️ **Architecture**

### **Frontend Components**
- `NotificationBanner.tsx`: In-app notification display
- `NotificationSettings.tsx`: User preference management
- `NotificationContext.tsx`: Global notification state management
- `NotificationButton.tsx`: Notification access point

### **Backend Integration**
- `useNotifications.ts`: Hook for notification operations
- `useBookings.ts`: Enhanced with notification triggers
- Supabase real-time subscriptions for instant updates

### **Database Schema**
```sql
-- Notifications table structure
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system',
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  data jsonb, -- Additional context data
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

## 🚀 **Key Features**

### **Real-time Notifications**
- Instant delivery using Supabase real-time subscriptions
- Automatic unread count tracking
- Persistent storage for offline access

### **Smart Notification Content**
- Personalized messages with user names and task details
- Actionable content with relevant context
- Emoji and visual indicators for different types

### **User Preference Management**
- Granular control over notification types
- Delivery method preferences (push, email)
- Bulk actions (mark all as read)

## 📱 **Implementation Details**

### **Application Review Notifications**

#### **Accept Application**
```typescript
// When a customer accepts a tasker's application
await notifyApplicationAccepted(
  taskerId,
  taskId,
  taskTitle
)

// Creates notification:
// Title: "Application Accepted! 🎉"
// Message: "Congratulations! Your application for 'Task Title' has been accepted. The task is now assigned to you."
```

#### **Decline Application**
```typescript
// When a customer declines a tasker's application
await notifyApplicationDeclined(
  taskerId,
  taskId,
  taskTitle
)

// Creates notification:
// Title: "Application Update"
// Message: "Your application for 'Task Title' was not selected this time. Don't worry, there are plenty of other opportunities!"
```

### **Direct Booking Notifications**

#### **New Booking Request**
```typescript
// When a customer books a technician directly
await notifyDirectBooking(
  technicianId,
  customerId,
  serviceName,
  agreedPrice,
  bookingDate
)

// Creates notification:
// Title: "New Direct Booking! 📅"
// Message: "Customer Name has booked you for 'Service Name' on Date for $Price."
```

#### **Booking Confirmation**
```typescript
// When a technician confirms a booking
await notifyDirectBookingAccepted(
  customerId,
  technicianId,
  serviceName,
  bookingDate
)

// Creates notification:
// Title: "Booking Confirmed! ✅"
// Message: "Technician Name has confirmed your booking for 'Service Name' on Date."
```

## 🎨 **UI/UX Features**

### **Notification Banner**
- **Position**: Top of screen with proper safe area handling
- **Animation**: Smooth slide-in/out with spring physics
- **Progress Bar**: Visual countdown for auto-hide
- **Interactive**: Tap to perform actions or view details

### **Visual Design**
- **Color Coding**: Different colors for different notification types
- **Icons**: Contextual icons for quick recognition
- **Typography**: Clear hierarchy with readable text
- **Shadows**: Subtle depth for modern appearance

### **Notification Types Styling**
- **Success**: Green gradient with checkmark icon
- **Error**: Red gradient with close icon
- **Warning**: Yellow gradient with warning icon
- **Info**: Blue gradient with information icon
- **Application**: Custom styling for application events
- **Direct Booking**: Calendar-themed styling

## 🔧 **Technical Implementation**

### **State Management**
```typescript
// Notification context provides:
interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  showSuccess: (title: string, message: string, onPress?: () => void) => void
  showError: (title: string, message: string, onPress?: () => void) => void
  showWarning: (title: string, message: string, onPress?: () => void) => void
  showInfo: (title: string, message: string, onPress?: () => void) => void
  showChat: (title: string, message: string, onPress?: () => void) => void
  hideNotification: (id: string) => void
}
```

### **Real-time Updates**
```typescript
// Supabase subscription for instant notifications
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      },
      (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [profile])
```

### **Error Handling**
- Graceful fallbacks if notifications fail
- Non-blocking notification creation
- Comprehensive error logging
- User-friendly error messages

## 📊 **Performance Considerations**

### **Optimization Strategies**
- **Lazy Loading**: Notifications loaded on demand
- **Pagination**: Limited to 20 most recent notifications
- **Efficient Updates**: Minimal re-renders with proper state management
- **Memory Management**: Automatic cleanup of old notifications

### **Database Performance**
- **Indexed Queries**: Fast notification retrieval
- **Efficient Joins**: Minimal data transfer
- **Real-time Optimization**: WebSocket-based updates

## 🔒 **Security & Privacy**

### **Access Control**
- Users can only view their own notifications
- Row-level security (RLS) policies enforced
- Proper authentication required for all operations

### **Data Protection**
- Sensitive information not exposed in notifications
- User consent for notification types
- GDPR-compliant data handling

## 🧪 **Testing & Debugging**

### **Testing Scenarios**
1. **Application Flow**: Submit → Accept → Decline → Notify
2. **Direct Booking Flow**: Book → Confirm → Cancel → Notify
3. **Real-time Updates**: Verify instant notification delivery
4. **Error Handling**: Test notification failures gracefully

### **Debug Information**
- Console logging for all notification operations
- Error tracking with detailed context
- Performance monitoring for notification delivery

## 🚀 **Future Enhancements**

### **Planned Features**
1. **Push Notifications**: Native device notifications
2. **Email Integration**: SMTP-based email delivery
3. **SMS Notifications**: Text message delivery
4. **Notification Templates**: Customizable message formats
5. **Advanced Filtering**: Smart notification categorization
6. **Bulk Operations**: Mass notification management

### **Integration Opportunities**
1. **Chat System**: In-app messaging notifications
2. **Payment System**: Payment confirmation notifications
3. **Review System**: Review and rating notifications
4. **Analytics**: Notification engagement tracking

## 📚 **Usage Examples**

### **For Developers**

#### **Adding New Notification Types**
```typescript
// 1. Add to NotificationType union
export type NotificationType = 'existing' | 'new_type'

// 2. Add to getNotificationConfig function
case 'new_type':
  return {
    icon: 'new-icon' as const,
    colors: Colors.gradients.newGradient,
    iconColor: Colors.new[600],
    borderColor: Colors.new[500],
  }

// 3. Create notification function
const notifyNewType = async (userId: string, data: any) => {
  await createNotification({
    user_id: userId,
    title: 'New Type Title',
    message: 'New type message',
    type: 'new_type',
    data: data
  })
}
```

#### **Integrating with Components**
```typescript
// In your component
const { showSuccess, showError } = useNotifications()

// Show success notification
showSuccess('Task Completed', 'Great job! Your task has been completed successfully.')

// Show error notification
showError('Booking Failed', 'Unable to create booking. Please try again.')
```

### **For Users**

#### **Managing Notifications**
1. **Access Settings**: Tap notification bell → Settings
2. **Toggle Types**: Enable/disable specific notification categories
3. **Quick Actions**: Mark all notifications as read
4. **Save Preferences**: Changes persist across sessions

#### **Understanding Notifications**
- **Green**: Success/positive events
- **Red**: Errors/negative events  
- **Yellow**: Warnings/attention needed
- **Blue**: Information/updates
- **Custom**: Application and booking specific

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Notifications Not Appearing**
- Check Supabase connection
- Verify user authentication
- Check notification permissions
- Review console for errors

#### **Real-time Updates Not Working**
- Verify Supabase subscription
- Check network connectivity
- Review channel configuration
- Restart app if needed

#### **Performance Issues**
- Limit notification history
- Implement pagination
- Optimize database queries
- Monitor memory usage

### **Debug Commands**
```typescript
// Check notification state
console.log('Notifications:', notifications)
console.log('Unread count:', unreadCount)

// Test notification creation
await createNotification({
  user_id: profile.id,
  title: 'Test',
  message: 'Test notification',
  type: 'system'
})

// Verify real-time subscription
console.log('Supabase channel status:', channel.subscribe())
```

## 📈 **Analytics & Monitoring**

### **Key Metrics**
- Notification delivery success rate
- User engagement with notifications
- Notification type preferences
- Real-time update performance

### **Monitoring Tools**
- Console logging for development
- Error tracking for production
- Performance monitoring
- User feedback collection

## 🔄 **Maintenance & Updates**

### **Regular Tasks**
- Monitor notification delivery rates
- Update notification content
- Optimize performance
- Review user feedback

### **Version Updates**
- Add new notification types
- Enhance notification content
- Improve delivery mechanisms
- Update user preferences

---

This notification system provides a robust foundation for user engagement and real-time updates in the Muyacon task marketplace. It's designed to be scalable, maintainable, and user-friendly while providing comprehensive coverage of all important application events.
