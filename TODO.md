# Task: Add Email to Registration & Login with Username/Email

## Steps

### Step 1: `src/html_files/register.html` ✅
- [x] Add email input field between username and password

### Step 2: `src/modules/register.js` ✅
- [x] Add email input reference in DOMContentLoaded
- [x] Update `validateRegistration()` to validate email (required, format, duplicate)
- [x] Update `createUserModel()` to include email field
- [x] Update JWT creation to use actual email
- [x] Update members sync to use actual email
- [x] Update success feedback message

### Step 3: `src/html_files/login.html` ✅
- [x] Change label from "Email" to "Username or Email"
- [x] Change input type from "email" to "text"
- [x] Update placeholder and autocomplete attributes

### Step 4: `src/modules/login.js` ✅
- [x] Update validation to accept both username/email formats
- [x] Update registered users lookup to check both `u.username` and `u.email`
- [x] Update demo account check to also work with username `jordan avery`
- [x] Update error/hint messages

## Done

