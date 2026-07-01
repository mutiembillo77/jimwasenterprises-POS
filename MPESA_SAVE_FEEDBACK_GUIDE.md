# M-Pesa Settings Save Feedback Guide

## Visual Feedback System

The M-Pesa settings save system provides clear, real-time feedback to help you understand what's happening.

## Message Types

### 1. Success Message (Green)

**When you see it:** After clicking "Save M-Pesa Settings" and all settings are saved

```
┌─────────────────────────────────────────┐
│ ✓ M-Pesa settings saved successfully    │
└─────────────────────────────────────────┘
```

**What it means:**
- Settings have been saved to the local database
- Auto-syncs to cloud when network is available
- All validation passed

**Auto-dismisses:** After 3 seconds

### 2. Error Message (Red)

**When you see it:** If there's a network or database error during save

```
┌─────────────────────────────────────────┐
│ ✗ Failed to save M-Pesa settings        │
└─────────────────────────────────────────┘
```

**What to do:**
1. Check your internet connection
2. Click "Save M-Pesa Settings" again to retry
3. Check browser console (F12) for detailed error

**What might cause it:**
- Network disconnection
- Database error
- Browser storage issues

### 3. Validation Warnings (Yellow)

**When you see them:** When M-Pesa is enabled but required fields are empty

```
┌─────────────────────────────────────────┐
│ ⚠ Consumer Key is required              │
├─────────────────────────────────────────┤
│ ⚠ Consumer Secret is required           │
├─────────────────────────────────────────┤
│ ⚠ Callback URL is required              │
├─────────────────────────────────────────┤
│ ⚠ Timeout URL is required               │
└─────────────────────────────────────────┘
```

**What it means:**
- These fields must be filled before saving
- Save button is automatically disabled (grayed out)

**What to do:**
- Fill in the missing fields
- Save button will become enabled automatically

## Button States

### 1. Ready to Save (Normal)
```
┌────────────────────────────────┐
│ 💾 Save M-Pesa Settings        │
└────────────────────────────────┘
```
- Button is bright emerald/green
- Clickable and ready to use

### 2. Saving in Progress
```
┌────────────────────────────────┐
│ ⟳ Saving...                    │
└────────────────────────────────┘
```
- Button shows loading spinner
- Slightly grayed out
- Cannot click while saving

### 3. Disabled (Missing Required Fields)
```
┌────────────────────────────────┐
│ 💾 Save M-Pesa Settings        │
└────────────────────────────────┘
(faded/grayed out)
```
- Cannot click
- Yellow warning boxes above show what's missing
- Fill the required fields to enable

## Last Updated Information

Below the section title, you see:
```
M-Pesa STK Push Settings
Last updated: January 15, 2025, 2:30 PM by user
```

This shows:
- When settings were last saved
- Who saved them (user reference)
- Helps track configuration changes

## Complete User Flow

### Flow 1: Successful Save

```
1. User clicks "Save M-Pesa Settings"
         ↓
2. Button shows loading spinner and says "Saving..."
         ↓
3. Settings are validated and saved to database
         ↓
4. Green success message appears at top
         ↓
5. Button returns to normal state
         ↓
6. Last updated timestamp updates
         ↓
7. Success message auto-dismisses after 3 seconds
```

### Flow 2: Validation Error

```
1. User tries to save with M-Pesa enabled but missing fields
         ↓
2. Yellow warning boxes appear showing what's missing
         ↓
3. Save button remains disabled
         ↓
4. User fills in missing fields
         ↓
5. Save button becomes enabled
         ↓
6. User clicks Save
         ↓
(Success flow continues from step 2 of Flow 1)
```

### Flow 3: Network Error

```
1. User clicks "Save M-Pesa Settings"
         ↓
2. Button shows loading spinner
         ↓
3. Network error occurs
         ↓
4. Red error message appears
         ↓
5. Button returns to normal state
         ↓
6. User can retry by clicking Save again
```

## Common Scenarios

### Scenario: Adding Callback URL

1. Scroll to "Callback URL" field
2. Paste your callback URL (from MPESA_URLS_SPECIFICATION.md)
3. Scroll to bottom
4. If all required fields filled, Save button is enabled
5. Click "Save M-Pesa Settings"
6. Green success message appears
7. "Last updated" timestamp refreshes

### Scenario: Switching from Sandbox to Production

1. Edit Environment field from "Sandbox" to "Production"
2. Verify all credentials are for Production environment
3. Double-check Callback and Timeout URLs are production URLs
4. Click "Save M-Pesa Settings"
5. Green success message confirms save
6. System now uses production credentials

### Scenario: Updating Secret (Sensitive Field)

1. Find the Consumer Secret field
2. Click the eye icon to reveal the masked password
3. Clear the field and paste the new secret
4. Click the eye icon to hide it again
5. Click "Save M-Pesa Settings"
6. Green success message confirms save

## Accessibility Features

- Color-blind friendly: Uses shapes and text (✓, ✗, ⚠) not just color
- Messages use clear language, not technical jargon
- Validation warnings list each issue clearly
- Auto-dismiss gives time to read but doesn't force you to click

## Tips for Smooth Saving

1. **Fill fields in order**: Environment → Credentials → URLs → Save
2. **Use copy/paste**: Reduces typos in long credentials
3. **Check URLs carefully**: Callback and Timeout URLs must be exact
4. **After first save**: Watch for "Last updated" timestamp change
5. **On error**: Try refresh and save again before investigating further

## What Gets Saved

When you click "Save M-Pesa Settings", the system saves:

✓ Environment (Sandbox/Production)
✓ Short Code
✓ Till Number
✓ Country Code
✓ Consumer Key
✓ Consumer Secret
✓ Passkey
✓ Callback URL
✓ Timeout URL
✓ M-Pesa enabled status
✓ Last updated timestamp
✓ User ID who made changes

## What Doesn't Get Saved Automatically

These require manual save action:
- Payment method toggles (saved individually when clicked)
- Settings from other tabs (Receipt, Loyalty, etc.)
- User changes (need separate save in Users tab)

Each section saves independently - you must click its Save button.
