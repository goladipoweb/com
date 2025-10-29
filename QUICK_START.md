# Quick Start Guide - GoLadipo Phase 2 Features

## 🚀 5-Minute Setup

Follow these steps to get the new features running:

---

## Step 1: Database Setup (2 minutes)

### Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Run These SQL Commands

Copy and paste these commands one by one:

```sql
-- 1. Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant1_id UUID REFERENCES profiles(id) NOT NULL,
    participant2_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
    business_name TEXT,
    business_address TEXT,
    business_phone TEXT,
    id_document_url TEXT,
    business_document_url TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user ON verifications(user_id);
```

Click "Run" for each command.

---

## Step 2: Enable Row Level Security (1 minute)

```sql
-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

-- Verifications policies
CREATE POLICY "Users can view their verification" ON verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification" ON verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their verification" ON verifications
    FOR UPDATE USING (auth.uid() = user_id);
```

---

## Step 3: Create Storage Bucket (1 minute)

1. In Supabase Dashboard, go to **Storage**
2. Click **"New Bucket"**
3. Name: `verification-documents`
4. Check **"Private bucket"**
5. Click **"Create bucket"**

### Set Storage Policies

Go to Storage → verification-documents → Policies:

```sql
-- Allow users to upload their documents
CREATE POLICY "Users upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their documents
CREATE POLICY "Users view own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'verification-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Step 4: Enable Realtime (30 seconds)

1. Go to **Database** → **Replication**
2. Find the `messages` table
3. Toggle **ON** the switch next to it
4. Select event: **INSERT**
5. Click **Save**

---

## Step 5: Test Everything (1 minute)

### Test 1: Search Filters
1. Open your website
2. Go to **Search Parts**
3. Click **"Filters"** button
4. You should see filter options
5. ✅ Filters working!

### Test 2: Verification
1. Sign in to an account
2. Go to **Dashboard** → **Verification**
3. You should see the verification form
4. ✅ Verification working!

### Test 3: Messages
1. Go to **Dashboard** → **Messages**
2. You should see "No conversations yet"
3. ✅ Messaging working!

---

## 🎉 You're Done!

All Phase 2 features are now live!

---

## Common Issues & Fixes

### Issue: "Permission denied for table conversations"
**Fix**: Make sure you ran the RLS policies in Step 2

### Issue: "relation conversations does not exist"
**Fix**: Make sure you ran the CREATE TABLE commands in Step 1

### Issue: Storage upload failing
**Fix**: Check that verification-documents bucket was created in Step 3

### Issue: Messages not updating in real-time
**Fix**: Enable Realtime for messages table in Step 4

---

## Testing the Features

### Test Advanced Search
1. Go to Search page
2. Click "Filters"
3. Select a category
4. Set price range
5. Click "Apply Filters"
6. Results should filter correctly

### Test Messaging (needs 2 users)
1. User A: Create a product
2. User B: Search for that product
3. User B: Click the message icon (💬)
4. Should open Messages tab with new conversation
5. Send a message
6. User A should see unread badge
7. Open conversation, message appears
8. Try sending reply

### Test Verification
1. Go to Dashboard → Verification
2. Fill in business information
3. Upload an ID document (any image)
4. Click "Submit for Verification"
5. Status should change to "Pending"

To manually approve (run in SQL Editor):
```sql
UPDATE verifications 
SET status = 'verified', 
    reviewed_at = NOW() 
WHERE user_id = 'YOUR_USER_ID';

UPDATE profiles 
SET is_verified = TRUE 
WHERE id = 'YOUR_USER_ID';
```

Then refresh and you should see verified badge!

---

## What's Next?

### For Users
- ✅ Start using advanced filters to find products
- ✅ Get verified to build trust
- ✅ Message sellers directly

### For Admins
Create an admin panel to:
- Review verification requests
- Approve/reject verifications
- Moderate messages if needed

### Future Enhancements (Phase 3)
- Email notifications for messages
- Mobile app version
- Payment integration
- Seller ratings and reviews
- Advanced analytics

---

## Need Help?

### Documentation
- 📖 **DATABASE_SETUP.md** - Full database setup guide
- 📋 **PHASE2_FEATURES.md** - Complete feature documentation
- 📝 **Requirements.md** - Original requirements

### Debugging
1. Check browser console (F12) for errors
2. Check Supabase logs in Dashboard
3. Verify all SQL commands ran successfully
4. Make sure Realtime is enabled

### Support
- Review error messages carefully
- Check Supabase Dashboard → Logs
- Verify user authentication is working
- Test with multiple user accounts

---

## 🎊 Congratulations!

Your GoLadipo marketplace now has:
- ✅ Advanced search filters
- ✅ Seller verification system
- ✅ In-app messaging
- ✅ Real-time updates
- ✅ Professional UI/UX

**Total setup time**: ~5 minutes  
**New capabilities**: 3 major features  
**Ready for**: Production use!

Happy selling! 🚗💨

