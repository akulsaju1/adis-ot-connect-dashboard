# Parent Simple NFC Workflow

## Overview
Parents have ONE NFC card with just their unique ID written on it. The system knows which children belong to each parent via the database (managed in the admin panel). Simple and clean.

## Workflow

### Setup (Admin - One Time)
1. Go to **Parent Management** page (`/parent-management`)
2. Register parent: Enter NFC code, name, phone
3. Link children: Select parent → Add children from dropdown
4. Done! No more setup needed

### At Gate (Daily Operation)
```
Parent scans NFC card
    ↓
System recognizes NFC code as parent
    ↓
Parent record added to dismissal queue with "Parent Pickup" badge
    ↓
Staff sees parent in Ground Operations queue
    ↓
Staff clicks "Show Children" button
    ↓
Modal pops up with all children linked to that parent
    ↓
Staff selects which children parent is picking up
    ↓
Staff clicks "Dismiss (N)" button
    ↓
All selected children marked as picked up ✓
```

## Data Structure

**What's on the NFC Card:**
- Just the parent ID (e.g., "PARENT123")
- Nothing else needed
- Same card works forever

**What's in the Database:**
```
Parent: {
  id: 123,
  nfcCode: "PARENT123",
  parentName: "Fatima Al-Mansouri",
  phone: "+971-50-123-4567",
  ...
}

Children: [
  { parentId: 123, studentId: "S001", name: "Zainab", class: "Grade 3" },
  { parentId: 123, studentId: "S002", name: "Hassan", class: "Grade 1" },
  ...
]
```

## Admin Operations

### Register Parent
- Navigate to Parent Management
- Click "Register Parent"
- Enter: NFC code, name, phone (optional)
- Parent now exists in system

### Link Children
- Go to Parent Management
- Select parent from sidebar
- Click "Link Child"
- Select student from dropdown
- Click "Link"
- Done! Child now shows under parent

### Edit Parent or Children
- Click on parent in sidebar
- Edit name, phone, or remove children
- Changes saved immediately

### Upload Photos (Optional)
- In parent management, upload student photos
- Photos display in ground-ops modal for visual identification

## System Design

**Why This Works:**
- One NFC card per parent (always works)
- All relationships in database (easy to manage)
- No embedding data in NFC (no corruption issues)
- Flexible - add/remove children anytime
- Simple for staff (just scan and select)

**Database Updates:**
- Parent record created in database (not on card)
- Child relationships stored in database (not on card)
- Photos stored as base64 in database (local storage)
- Everything on Raspberry Pi (no cloud)

## Technical Details

### Dismissal Status
- When parent NFC scanned: Creates `pickupMethod: 'parent'` record
- Appears in queue as "Parent Pickup" (blue badge)
- Click "Show Children" → Shows modal with children
- Select children and dismiss

### Multi-Child Dismissal
- Select 1 or more children from modal
- Click "Dismiss (N)" where N = number selected
- All selected children marked as `status: 'completed'`
- Parent record cleaned up
- Back to empty queue or next item

### Parent Data in Queue
```typescript
{
  studentId: "parent_123",  // Special ID for parent records
  studentName: "Fatima Al-Mansouri",
  class: "Parent",
  block: "Multi-Child",
  pickupMethod: "parent",  // ← This identifies it as parent
  nfcCode: "PARENT123",
  status: "at_gate",
  ...
}
```

## Usage Tips

1. **One Card Per Parent** - Don't share cards between parents
2. **Manage in Admin Panel** - Add/remove children anytime (don't modify NFC)
3. **Easy Updates** - Change parent name or phone instantly
4. **Photos Optional** - Photos help staff identify children
5. **No Rework** - Once children are linked, just scan and select

## Troubleshooting

**Parent doesn't appear in queue?**
- Check parent is registered in system
- Check NFC code is correct
- Verify parent is in database

**Can't find child to link?**
- Check child is in Student Registry first
- Then link to parent in Parent Management
- Refresh page if needed

**Modal not showing children?**
- Check children are linked to this parent
- Verify "Link Child" step was completed
- Refresh Ground Operations page

## Files Modified

- `app/actions/dismissal.ts` - Detects parent NFC, creates parent record
- `components/ground-ops-queue.tsx` - Shows parent record with modal
- `lib/local-db.ts` - Added nfcCode field for tracking
- `app/parent-management/page.tsx` - Admin interface (already exists)
- `components/parent-management.tsx` - Management UI (already exists)
