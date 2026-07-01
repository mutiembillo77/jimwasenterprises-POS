# M-Pesa Settings Management Guide

## Overview

This guide explains how to manage M-Pesa settings in the POS system, including editing capabilities, save functionality, and visual feedback.

## Accessing M-Pesa Settings

1. Click **Settings** in the main menu
2. Click the **Payments** tab
3. Scroll to the **M-Pesa STK Push Settings** section

## Editing M-Pesa Settings

All M-Pesa settings fields are fully editable. You can modify settings at any time:

### General Settings (Always Editable)
- **Enable/Disable M-Pesa**: Use the toggle button to enable or disable M-Pesa payments
- **Environment**: Choose between Sandbox (for testing) or Production (live payments)
- **Short Code / Paybill**: Your M-Pesa business paybill/merchant code
- **Till Number**: Optional till number for specific store location
- **Country Code**: Phone country code (typically 254 for Kenya)

### API Credentials (Editable)
These fields are required when M-Pesa is enabled:
- **Consumer Key**: OAuth consumer key from M-Pesa portal
- **Consumer Secret**: OAuth consumer secret (password field - click eye icon to show/hide)
- **Passkey**: M-Pesa passkey for STK Push requests

### Webhook URLs (Editable)
Both URLs are required for payment processing:
- **Callback URL**: Receives payment success notifications (see MPESA_URLS_SPECIFICATION.md for exact URL)
- **Timeout URL**: Receives payment failure/timeout notifications

## Save Functionality

### How to Save Changes

1. Make your edits in the M-Pesa Settings form
2. Scroll to the bottom of the form
3. Click the **Save M-Pesa Settings** button

### Save Feedback

The system provides three types of feedback:

#### ✅ Success Message (Green)
```
✓ M-Pesa settings saved successfully
```
- Appears at the top of the form after successful save
- Auto-dismisses after 3 seconds
- Indicates all settings have been saved

#### ❌ Error Message (Red)
```
✗ Failed to save M-Pesa settings
```
- Appears if there's a network or database error
- Check your connection and try again
- Review the browser console for detailed error information

#### ⚠️ Validation Warnings (Yellow)
When M-Pesa is enabled, these warnings appear if required fields are missing:
- Consumer Key is required
- Consumer Secret is required
- Callback URL is required
- Timeout URL is required

**Note**: The Save button is disabled until all required fields are filled when M-Pesa is enabled.

### Last Updated Information

Below the M-Pesa STK Push Settings title, you'll see:
```
Last updated: [Date/Time] by user
```

This shows when settings were last saved and which user made the changes. This helps track configuration changes for audit purposes.

## Step-by-Step: Configuring M-Pesa

### Step 1: Enable M-Pesa
1. Toggle the "Enabled" button to ON (emerald color)
2. The M-Pesa configuration form will appear

### Step 2: Select Environment
1. Choose "Sandbox (Testing)" for development and testing
2. Switch to "Production (Live)" only when ready for live payments

### Step 3: Enter Basic Information
1. Enter your M-Pesa Short Code / Paybill (e.g., 174379)
2. Enter Till Number if you have multiple locations (optional)
3. Confirm Country Code is set to 254 for Kenya

### Step 4: Add API Credentials
1. Log in to your M-Pesa developer portal
2. Copy your Consumer Key and paste it in the Consumer Key field
3. Copy your Consumer Secret and paste it in the Consumer Secret field
4. Copy your Passkey and paste it in the Passkey field

**Security Tip**: Never share your Consumer Secret or Passkey. The Consumer Secret field is masked by default - click the eye icon to reveal it temporarily.

### Step 5: Configure Callback URLs
1. Go to MPESA_URLS_SPECIFICATION.md to find your exact callback URL
2. Copy the Callback URL for your deployment type
3. Paste it in the Callback URL field (e.g., https://your-domain.com/api/mpesa/callback)
4. Do the same for the Timeout URL (e.g., https://your-domain.com/api/mpesa/timeout)

### Step 6: Save Settings
1. Review all settings to ensure they're correct
2. Click "Save M-Pesa Settings"
3. Wait for the success message (green banner)
4. Verify the "Last updated" timestamp

## Validation & Error Handling

### Missing Required Fields

If you try to save with M-Pesa enabled but missing required fields, you'll see:
- Yellow warning boxes listing what's missing
- The Save button will be disabled (grayed out)

**Fix**: Fill in all required fields before saving.

### Network Errors

If saving fails due to network issues:
1. Check your internet connection
2. Click "Save M-Pesa Settings" again to retry
3. If the problem persists, check browser console (F12) for details

### Sync Status

After saving successfully, your settings are marked with sync status "pending" and will automatically sync to the cloud when network is available.

## Best Practices

1. **Backup Credentials**: Keep your Consumer Key, Consumer Secret, and Passkey in a secure location (password manager)

2. **Test in Sandbox First**: Always test payment flows in Sandbox environment before switching to Production

3. **Webhook URLs**: Ensure both Callback URL and Timeout URL are:
   - Using HTTPS (not HTTP)
   - Publicly accessible
   - Deployed and tested with /api/mpesa/callback and /api/mpesa/timeout endpoints

4. **Update Tracking**: The system tracks who updates settings and when. Use this for audit purposes.

5. **Environment Separation**: Use different Consumer Keys for Sandbox vs Production environments

## Troubleshooting

### Save Button is Disabled
- Ensure M-Pesa is enabled (toggle is on)
- Check that all required fields have values
- Look for yellow warning messages

### Settings Not Saving
1. Check internet connection
2. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. Try saving again
4. Check browser console for error messages

### Payments Not Processing
1. Verify Consumer Key and Secret are correct (copy from M-Pesa portal again)
2. Check you're using the correct environment (Sandbox vs Production)
3. Ensure Callback URL and Timeout URL are properly configured
4. Verify webhooks are being received (check server logs)

## Related Documentation

- **MPESA_URLS_SPECIFICATION.md** - Exact URLs to paste for your deployment
- **MPESA_IMPLEMENTATION_COMPLETE.md** - Complete M-Pesa implementation overview
- **WEBHOOK_ENDPOINT_IMPLEMENTATIONS.md** - Backend webhook setup guides

## Support

For detailed setup instructions, refer to:
- MPESA_QUICK_REFERENCE.md - One-page cheat sheet
- MPESA_FORM_LAYOUT.md - Visual guide with form layout
- WEBHOOK_ENDPOINT_IMPLEMENTATIONS.md - Setting up webhook endpoints
