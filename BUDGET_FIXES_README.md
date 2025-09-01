# Budget Range to Single Budget Migration

## Overview
This document outlines the changes made to convert the job posting system from using a budget range (budget_min and budget_max) to a single fixed budget amount.

## Changes Made

### 1. Database Schema Updates
- **File**: `supabase_schema.sql`
- **Change**: Replaced `budget_min numeric` and `budget_max numeric` with `budget numeric NOT NULL`
- **Migration Script**: Added to `database_fixes.sql` to handle existing data

### 2. Frontend Interface Updates

#### Task Interface (`frontend/hooks/useTasks.ts`)
- Updated `Task` interface to use single `budget: number` instead of `budget_min?` and `budget_max?`
- Updated mock data to use single budget values
- Updated `createTask` function to handle single budget

#### Post Task Component (`frontend/app/post-task.tsx`)
- Replaced budget range inputs with single budget input
- Updated `TASK_SIZES` array to use single budget values:
  - Small: $50 (was $25-$75)
  - Medium: $125 (was $50-$200) 
  - Large: $325 (was $150-$500)
- Updated form validation and submission logic
- Updated form reset functionality

#### Task Application Modal (`frontend/components/TaskApplicationModal.tsx`)
- Updated interface to accept single `budget` instead of `budgetRange`
- Updated budget display to show single amount
- Updated placeholder text to show suggested budget
- Removed budget range validation (now only checks if price > 0)

#### Task Card Component (`frontend/components/TaskCard.tsx`)
- Updated budget display to show single amount instead of range

#### Jobs Page (`frontend/app/jobs.tsx`)
- Updated TaskApplicationModal usage to pass single budget

#### Chat System (`frontend/hooks/useChat.ts`)
- Updated `TaskInfo` interface to use single budget
- Updated chat queries and data processing

#### Bookings System (`frontend/hooks/useBookings.ts`)
- Updated `TaskBooking` interface to use single budget

#### Profile Page (`frontend/app/profile.tsx`)
- Updated booking price display to show single budget

#### Task Detail Page (`frontend/app/task/[id].tsx`)
- Updated budget display to show single amount

### 3. Database Migration
The migration script in `database_fixes.sql` handles:
- Adding new `budget` column
- Converting existing budget ranges to single values (using average)
- Dropping old budget columns
- Adding constraints for positive budget values

## Benefits of Single Budget

1. **Simplified Pricing**: Customers set one clear price instead of a range
2. **Better Tasker Experience**: Clear expectations on compensation
3. **Reduced Negotiation**: Less back-and-forth on pricing
4. **Cleaner UI**: Simpler form with one input field
5. **Better Data Consistency**: Single value instead of potential mismatched ranges

## Migration Steps

1. **Run Database Migration**: Execute the SQL commands in `database_fixes.sql`
2. **Deploy Frontend Changes**: All components have been updated
3. **Test Functionality**: Verify job posting, viewing, and applications work correctly

## Backward Compatibility
- Existing tasks with budget ranges will be converted to single budgets
- The migration preserves data by averaging min/max values
- All frontend components now expect single budget values

## Testing Checklist

- [ ] Post new task with single budget
- [ ] View task details showing single budget
- [ ] Apply to task with proposed price
- [ ] View task applications
- [ ] Chat system displays correct budget
- [ ] Bookings show correct budget
- [ ] Profile page displays correct budget information

## Notes
- Default budget values for task sizes have been adjusted to reasonable single amounts
- Validation now ensures budget is positive instead of checking range validity
- Tasker applications can propose any price above 0 (no longer constrained to budget range)
