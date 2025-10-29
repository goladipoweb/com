# GoLadipo Phase 2 Features - Database Setup Guide

## Overview
This guide covers the database setup for the newly added Phase 2 features:
- Advanced Search Filters
- Seller Verification System
- In-App Messaging System

## Database Schema Updates

### 1. Update Profiles Table
Add the `is_verified` column to the existing profiles table:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
```

### 2. Create Conversations Table
```sql
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID REFERENCES profiles(id) NOT NULL,
    participant2_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

### 3. Create Messages Table
```sql
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;
```

### 4. Create Verifications Table
```sql
CREATE TABLE verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
    business_name TEXT,
    business_address TEXT,
    business_phone TEXT,
    id_document_url TEXT,
    business_document_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- Add index for quick status lookups
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_user ON verifications(user_id);
```

## Row Level Security (RLS) Policies

### Conversations Policies
```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they are part of
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Users can update conversations they are part of
CREATE POLICY "Users can update their own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
```

### Messages Policies
```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

-- Users can send messages
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages in their conversations"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );
```

### Verifications Policies
```sql
-- Enable RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification
CREATE POLICY "Users can view their own verification"
    ON verifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own verification
CREATE POLICY "Users can create verification"
    ON verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification (for resubmission)
CREATE POLICY "Users can update their own verification"
    ON verifications FOR UPDATE
    USING (auth.uid() = user_id);
```

## Storage Buckets

### 1. Product Images Bucket (Already Exists)
Ensure it's properly configured:
```javascript
// Check if bucket exists, create if not
const { data: buckets } = await supabaseClient.storage.listBuckets();
const productBucketExists = buckets.some(b => b.name === 'product-images');

if (!productBucketExists) {
    await supabaseClient.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
    });
}
```

### 2. Verification Documents Bucket (New)
Create a new private bucket for verification documents:
```javascript
await supabaseClient.storage.createBucket('verification-documents', {
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    fileSizeLimit: 10485760 // 10MB
});
```

### Storage Policies for Verification Documents
```sql
-- Users can upload their own verification documents
CREATE POLICY "Users can upload verification documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'verification-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own verification documents
CREATE POLICY "Users can view their own verification documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        -- Add your admin check here
    );
```

## Real-time Subscriptions Setup

The messaging system uses real-time subscriptions. Ensure Realtime is enabled in your Supabase project:

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for the `messages` table
3. Select the `INSERT` event

## Testing the Setup

### 1. Test Database Tables
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'products', 'conversations', 'messages', 'verifications');

-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';
```

### 2. Test RLS Policies
```sql
-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('conversations', 'messages', 'verifications');
```

### 3. Test Storage Buckets
```javascript
// In browser console
const { data: buckets, error } = await supabaseClient.storage.listBuckets();
console.log('Buckets:', buckets);

// Should show 'product-images' and 'verification-documents'
```

## Feature Usage

### Advanced Search Filters
Users can now filter products by:
- **Category**: 10 predefined categories
- **Price Range**: Min and max price
- **Location**: Search by seller location in Lagos
- **Verification Status**: Filter verified sellers only
- **Sort By**: Newest, Oldest, Price Low-High, Price High-Low

### Messaging System
- Buyers can message sellers directly from product cards
- Real-time message updates
- Unread message notifications with badge count
- Conversation history
- Message read receipts

### Verification System
Sellers can submit:
- Business/Shop name
- Business address
- Business phone
- Government ID document
- Business registration (optional)

Verification status:
- **Pending**: Under review
- **Verified**: Approved (shows verified badge)
- **Rejected**: Needs resubmission

## Admin Functions

To manually verify a seller:
```sql
-- Verify a seller
UPDATE verifications
SET status = 'verified',
    reviewed_at = NOW(),
    reviewed_by = 'ADMIN_USER_ID'
WHERE user_id = 'SELLER_USER_ID';

-- Update profile
UPDATE profiles
SET is_verified = TRUE
WHERE id = 'SELLER_USER_ID';
```

To reject a verification:
```sql
UPDATE verifications
SET status = 'rejected',
    rejection_reason = 'Invalid ID document',
    reviewed_at = NOW(),
    reviewed_by = 'ADMIN_USER_ID'
WHERE user_id = 'SELLER_USER_ID';
```

## Troubleshooting

### Messages Not Appearing
1. Check if Realtime is enabled in Supabase
2. Verify RLS policies are correctly set
3. Check browser console for errors

### Verification Upload Failing
1. Check storage bucket exists
2. Verify file size is under limit
3. Check storage policies are set correctly

### Search Filters Not Working
1. Ensure profiles table has `is_verified` column
2. Check that profile location field is populated
3. Verify products have category assigned

## Migration from Phase 1

If you have existing data:
```sql
-- Add is_verified column to existing profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Optionally, verify existing sellers who meet criteria
-- UPDATE profiles SET is_verified = TRUE WHERE ...
```

## Next Steps

After setting up the database:
1. ✅ All tables created
2. ✅ RLS policies applied
3. ✅ Storage buckets configured
4. ✅ Realtime enabled
5. 🔄 Test features in the application
6. 🔄 Set up admin panel for verification management (Phase 3)

## Support

For issues or questions:
- Check Supabase logs in the Dashboard
- Review browser console for JavaScript errors
- Verify all SQL commands executed successfully

