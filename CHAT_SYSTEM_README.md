# Chat System Implementation

## Overview
The chat system has been implemented with a simplified approach that avoids complex foreign key relationships in Supabase. Instead of relying on PostgREST's automatic joins, the system fetches basic chat data first and then retrieves related profile and task information separately.

## Database Schema
The chat system uses three main tables:

### 1. `public.chats`
- Stores chat conversations between customers and taskers
- References `auth.users` for user IDs
- Includes task association and timestamps

### 2. `public.chat_messages`
- Stores individual messages within chats
- Includes sender information and read status
- Automatically updates chat's `last_message_at` via triggers

### 3. `public.chat_participants`
- Manages chat membership and permissions
- Automatically populated via triggers

## Implementation Details

### Frontend Components

#### `useChat` Hook (`frontend/hooks/useChat.ts`)
- **Simplified Approach**: Fetches basic chat data without complex joins
- **Separate Profile Fetching**: Retrieves user profiles and task information separately
- **Real-time Updates**: Uses Supabase Realtime for live message updates
- **Error Handling**: Graceful fallbacks for missing data

#### `ChatList` Component (`frontend/components/ChatList.tsx`)
- **Dynamic Profile Loading**: Fetches profile data for each chat as needed
- **Search and Filtering**: Supports conversation search and unread-only filtering
- **Loading States**: Shows loading indicators while fetching data
- **Error Resilience**: Handles missing profile data gracefully

#### `ChatInterface` Component (`frontend/components/ChatInterface.tsx`)
- **Real-time Messaging**: Live message updates and typing indicators
- **Profile Integration**: Displays user names and task information
- **Message History**: Scrollable message list with timestamps
- **Input Validation**: Prevents empty messages and handles errors

### Key Features

1. **Chat Creation**: Users can start conversations from task cards
2. **Real-time Messaging**: Instant message delivery via Supabase Realtime
3. **Profile Display**: Shows user names and task context
4. **Unread Counts**: Tracks unread messages per conversation
5. **Search & Filter**: Find conversations by user or task
6. **Responsive Design**: Works on both mobile and desktop

### Technical Approach

#### Why Simplified Joins?
The original implementation attempted to use Supabase's automatic foreign key inference with syntax like:
```sql
customer_profile:profiles!customer_id(id, full_name, username, avatar_url)
```

However, this failed with `PGRST200` errors because:
- `chats` table references `auth.users(id)`, not `public.profiles(id)`
- PostgREST couldn't infer the relationship between `chats` and `profiles`
- Complex nested joins caused performance issues

#### Current Solution
1. **Basic Data First**: Fetch chat/message data with simple queries
2. **Separate Profile Fetching**: Retrieve user profiles and task info separately
3. **Client-side Assembly**: Combine data in React components
4. **Caching**: Store fetched profiles to avoid repeated API calls

### Database Setup

Run the SQL schema in your Supabase SQL Editor:

```sql
-- Run the contents of chat_system_schema.sql
-- This creates the necessary tables, policies, and triggers
```

### Usage

1. **Start a Chat**: Click the "Chat" button on any task card
2. **View Conversations**: Navigate to the Chats tab
3. **Send Messages**: Type and send messages in any conversation
4. **Search**: Use the search bar to find specific conversations
5. **Filter**: Toggle "Unread" to see only unread conversations

### Performance Considerations

- **Lazy Loading**: Profile data is fetched only when needed
- **Caching**: Profile information is stored locally to reduce API calls
- **Batch Operations**: Multiple profile fetches are batched where possible
- **Error Handling**: Graceful degradation when data is unavailable

### Future Enhancements

1. **Push Notifications**: Real-time alerts for new messages
2. **File Attachments**: Support for images and documents
3. **Message Reactions**: Emoji reactions to messages
4. **Typing Indicators**: Show when users are typing
5. **Message Search**: Search within conversation history
6. **Voice Messages**: Audio message support

### Troubleshooting

#### Common Issues

1. **Profile Data Missing**: Check if user profiles exist in the `profiles` table
2. **Chat Not Loading**: Verify RLS policies are correctly configured
3. **Messages Not Sending**: Check if the user has permission to insert messages
4. **Real-time Not Working**: Ensure Supabase Realtime is enabled

#### Debug Steps

1. Check browser console for error messages
2. Verify database tables exist and have correct structure
3. Test RLS policies with direct database queries
4. Check Supabase logs for backend errors

## Testing

To test the chat system:

1. **Create Test Users**: Ensure you have both customer and tasker accounts
2. **Post a Task**: Create a task as a customer
3. **Apply to Task**: Apply to the task as a tasker
4. **Start Chat**: Use the chat button to begin conversation
5. **Send Messages**: Test message sending and receiving
6. **Verify Real-time**: Open multiple browser tabs to test live updates

The system should now work without the `PGRST200` foreign key relationship errors.
