# COMP-PROMPT.md
# Karachi Club Swimming Competition Management System
## Master Build Specification for OpenCode

> IMPORTANT: This document is the single source of truth for this project.
> Read the entire file before writing or changing code.
> Do not replace requirements with assumptions.
> Do not create mock-only functionality where real functionality is requested.
> Build a production-ready, responsive web application with clean architecture,
> secure role-based access, persistent sessions, and an admin/committee CMS-style
> management experience that does NOT require coding for routine competition changes.

---

# 1. PROJECT OVERVIEW

Build a modern web-based Swimming Competition Management System for Karachi Club.

The main purpose is to eliminate repetitive paperwork and manual participant-data collection for swimming competitions.

A swimmer/participant or their parent/guardian should enter the participant's permanent information once. That information must be reusable for future competitions.

Committee members should be able to create/manage competitions, define rules, age groups, swimming events, registration limits, view registrations automatically, manage results, and manage committee-only documents — all from the website UI without needing to edit code.

The system has three main areas:

1. Public Website
2. Participant / Parent Portal
3. Committee Member Dashboard

The system must be designed so that future competitions can be managed from the dashboard rather than by changing source code.

---

# 2. CORE PRINCIPLE

The most important workflow is:

ONE-TIME PROFILE
    ->
COMPETITION REGISTRATION
    ->
AUTOMATIC COMMITTEE DATABASE
    ->
RESULTS / HISTORY
    ->
REUSABLE FOR FUTURE COMPETITIONS

A participant must NOT have to re-enter their permanent information for every competition.

---

# 3. USER TYPES / ROLES

There are three user roles:

## 3.1 Participant

A swimmer who has an account and/or is managed directly.

## 3.2 Parent / Guardian

A parent/guardian can have one account and manage one or multiple children.

The parent's email/contact/account belongs to the parent, but competition registration data belongs to the child/swimmer.

Example:

Parent Account:
- Parent Name
- Parent Email
- Parent Phone

Child Profile:
- Child Full Name
- Child DOB
- Child Gender
- Child KC Membership Number
- Child Age Group
- Child competition registrations

## 3.3 Committee Member

All committee members have equal access.

There is NO hierarchy between committee members.

Do not create:
- Super Admin
- Admin vs Normal Committee Member
- Member removal system
- Permission levels between committee members

All committee members should have the same committee dashboard capabilities.

---

# 4. AUTHENTICATION AND PERSISTENT LOGIN

## 4.1 One-time login experience

Users should not be forced to log in every time they visit the website.

After successful authentication, maintain a secure persistent session.

On future visits:

Participant/Parent -> directly to their appropriate portal/dashboard.

Committee Member -> directly toward committee access/dashboard according to the committee authentication flow.

Provide a clear Logout option.

If a user logs out, their session must actually end.

Provide account recovery / password reset functionality so users are not permanently locked out if they forget credentials.

## 4.2 Role-based routing

The interface shown must depend on the authenticated role.

Unauthenticated users:
- Public website
- Sign Up
- Login

Authenticated participant/parent:
- Participant/Parent dashboard/profile/registrations

Authenticated committee member:
- Committee access/dashboard

Do not expose committee-only UI to participants.

Do not rely only on hiding frontend buttons for security. Enforce authorization server-side.

---

# 5. COMMITTEE SECRET KEY

Committee members use an additional shared committee secret/access key.

Current example:
KCS20

This key should be easy to change through configuration later.

IMPORTANT:
- The committee key is an additional committee access layer.
- It is NOT the user's password.
- Do not expose it in participant UI.
- Do not expose committee-only pages to participants.
- Protect committee routes server-side.
- Do not hard-code the key into visible frontend code.
- Store sensitive configuration securely.

All committee members have the same committee access and same permissions.

---

# 6. PARTICIPANT PERMANENT PROFILE

The participant profile contains permanent/basic participant information.

Required fields:

- Full Name
- Date of Birth
- Gender
- KC Membership Number
- Phone Number
- Email (OPTIONAL)

Do not require online KC membership verification.

The KC Membership Number simply needs to be collected and stored.

Age should be automatically calculated/displayed from the participant's Date of Birth.

Age Group must be a simple selectable dropdown field in the participant profile/registration form. Participants will select their own Age Group from the age-group options configured by Committee Members. Committee Members do not need to assign or approve a participant's age group.

Do not make permanent profile data unnecessarily editable after account/profile creation.

The system should distinguish between:
- Permanent participant profile data
- Competition-specific registration data

---

# 7. AGE GROUP MANAGEMENT — MUST BE NO-CODE

This is a CRITICAL requirement.

Committee members MUST be able to create, edit, reorder, enable/disable, and remove age groups directly from the website dashboard.

NO CODING should be required.

Initial age-group examples:

- U-6
- U-8
- U-10
- U-12
- U-14
- U-16
- U-18
- U-20
- Open

Do NOT hard-code these as the only possible options.

The database must store configurable age groups.

For each age group, the committee should be able to configure relevant values/rules, such as:
- Display name
- Minimum age or eligibility rule
- Maximum age or eligibility rule
- Active/inactive status
- Display order

The UI should make this simple.

Example dashboard:

AGE GROUPS
--------------------------------
U-6       [Edit] [Disable]
U-8       [Edit] [Disable]
U-10      [Edit] [Disable]
U-12      [Edit] [Disable]
U-14      [Edit] [Disable]
U-16      [Edit] [Disable]
U-18      [Edit] [Disable]
U-20      [Edit] [Disable]
Open      [Edit] [Disable]

[ + Add Age Group ]

The committee must not need to open VS Code or edit a TypeScript/JSON file to change age groups.

---

# 8. COMPETITION MANAGEMENT — NO-CODE

Committee members must be able to create a completely new competition from the dashboard.

Example:

KC Swimming Championship 2026

Competition fields may include:
- Competition name
- Description
- Date
- Venue
- Registration opening date/time
- Registration closing date/time
- Status
- Competition image/gallery
- Rules/instructions
- Maximum events per participant
- Applicable age groups
- Available swimming events
- Other configurable information

Committee members must be able to:
- Create competition
- Edit competition
- Publish competition
- Open registration
- Close registration
- Reopen registration if needed
- Archive competition
- View registrations
- Manage rules
- Manage events
- Manage age groups
- Manage results

All of this should be possible through the website UI.

---

# 9. COMPETITION RULES

Competition rules are NOT globally fixed.

Every new competition must have its own rules/instructions.

Committee members should be able to enter and edit rules from the dashboard.

Rules can be displayed on the public registration/competition page.

Support formatted text where useful.

Do not force the same rules onto every competition.

---

# 10. SWIMMING STROKES VS EVENTS

Do not treat strokes and events as the same database concept.

A stroke can be:
- Freestyle
- Backstroke
- Breaststroke
- Butterfly
- Individual Medley

An event can be something like:
- 50m Freestyle
- 100m Freestyle
- 50m Backstroke
- 100m Breaststroke
- 50m Butterfly
- 200m Individual Medley
- etc.

Relay events are also supported.

Example relay events:
- 4x50m Freestyle Relay
- 4x50m Medley Relay

The architecture must support individual and relay events.

---

# 11. EVENT MANAGEMENT — MUST BE NO-CODE

This is another CRITICAL requirement.

Committee members MUST be able to manage swimming events directly from the website dashboard.

NO coding required.

Do NOT hard-code competition events into the application.

The committee should be able to:

- Add event
- Edit event
- Delete/deactivate event
- Reorder events
- Set event type
- Set distance
- Set stroke
- Set relay/non-relay
- Set gender eligibility if required
- Set eligible age groups
- Set active/inactive status
- Set event-specific limits/rules where needed

Example:

EVENTS
------------------------------------------
50m Freestyle       Individual   [Edit]
100m Freestyle      Individual   [Edit]
50m Backstroke      Individual   [Edit]
100m Breaststroke   Individual   [Edit]
4x50m Freestyle     Relay        [Edit]

[ + Add Event ]

The exact available events can differ by competition.

Committee members must be able to choose which events are available for each competition without changing code.

---

# 12. PARTICIPANT REGISTRATION

Registration should be simple.

Participant/parent opens an active competition.

If not registered:

-> View competition details
-> Read competition rules
-> See available age groups/events
-> Fill/select required registration information
-> Select eligible events
-> Click Register

Once the Register button is successfully submitted:

Registration is created immediately.

The committee dashboard should automatically receive the new registration.

No manual WhatsApp/paper collection is required.

---

# 13. MAXIMUM EVENTS PER PARTICIPANT

The number of events a participant may select is competition-specific.

Committee members must be able to define this while creating/editing a competition.

Example:

Maximum events: 4

The frontend should prevent selecting more than the configured maximum.

If there is no maximum, support that configuration as well.

---

# 14. ALREADY REGISTERED LOGIC

The system must prevent duplicate registrations for the same participant in the same competition.

If the participant is already registered:

Show:

"You are already registered for this competition."

Show their registration details.

Do not create a second duplicate competition registration.

Allow committee-defined editing rules if event changes are permitted.

---

# 15. REGISTRATION DATA

A registration should contain competition-specific information such as:

- Participant
- Competition
- Registration date/time
- Selected events
- Registration status
- Relevant competition-specific information
- Result/status when applicable

Permanent participant information should not be duplicated unnecessarily in every registration record.

Use relational database design.

---

# 16. REGISTRATION FEES

Do NOT build an online payment gateway unless explicitly requested later.

Registration fees are handled through the existing Karachi Club membership/fee records.

The website's main responsibility is competition registration and management.

---

# 17. AUTOMATIC COMMITTEE REGISTRATION LIST

Every new successful registration must automatically appear in the committee dashboard.

Committee members should be able to view:
- New registrations
- Total registrations
- Registration date
- Participant information
- Selected events
- Competition
- Age group
- KC Membership Number
- Contact information as permitted

The purpose is to eliminate manual data collection.

---

# 18. COMMITTEE PARTICIPANT DATABASE

Committee dashboard must have a complete participant database.

Include useful table columns such as:

- Full Name
- DOB
- Age
- Age Group
- Gender
- KC Membership Number
- Phone
- Email if provided
- Competition
- Selected events
- Registration status

Provide:
- Search
- Sorting
- Filters
- Pagination where necessary
- Participant detail view

---

# 19. SEARCH AND FILTERS

Committee members should be able to filter participants/registrations by:

- Name
- KC Membership Number
- Gender
- Age
- Age Group
- Competition
- Event
- Stroke
- Registration status

Example:

U-14 + Girls + 50m Freestyle

should return only matching registrations.

---

# 20. EXPORT

Committee members should be able to export useful registration data.

Support:
- CSV
- Excel/XLSX if practical

Examples:
- All participants
- Competition participants
- Event-wise lists
- Age-group lists
- Gender-wise lists

Exports should contain clean structured data suitable for printing/official paperwork.

---

# 21. PARENT / GUARDIAN MULTI-CHILD SUPPORT

A parent/guardian can have one account associated with multiple children.

Example:

Parent Account
    -> Child A n"whatever the name is"
    -> Child B  "whatever the name is"
    -> Child C  "whatever the name is"

The parent should be able to select a child and register that child for a competition.

The registration must belong to the selected child, not the parent.

Do not confuse parent contact details with swimmer participant details.

---

# 22. PARTICIPANT / PARENT DASHBOARD

After authentication, the participant/parent should see their own portal.

Possible sections:

- Profile
- Children (for parent account)
- Upcoming competitions
- Available registrations
- Current registrations
- Registration status
- Competition history
- Results

A participant should never see the committee's full participant database.

---

# 23. COMPETITION HISTORY

Registration history must remain saved permanently unless a future authorized data-retention policy is explicitly introduced.

A participant's history can show:

- Competition name
- Date
- Events entered
- Registration details
- Results when available

Committee members should have access to historical registration data.

Do not delete old competition records merely because a competition has ended.

---

# 24. RESULTS MANAGEMENT

The website should support maintaining competition results.

Committee members can manage results after the competition.

Results may include:
- Competition
- Event
- Age group
- Participant/team
- Time/score
- Position
- Medal/result
- Other relevant result information

Example:

50m Freestyle — U-14 Girls

1. Participant A — 00:32.41 — Gold
2. Participant B — 00:33.10 — Silver
3. Participant C — 00:34.22 — Bronze

Results should be visible according to the intended public/private rules.

Participant history should retain results.

Architecture should allow personal-best tracking in the future.

---

# 25. RELAY SUPPORT

The database and UI must support relay events.

Relay registrations may involve multiple swimmers forming a team.

Do not design the database in a way that makes relay events impossible to add later.

Committee members should be able to configure an event as:
- Individual
- Relay

Detailed relay workflow should be implemented according to the final competition requirements, but the architecture must support it.

---

# 26. COMMITTEE DOCUMENT CENTER

Create a committee-only document section.

Committee members can manage competition-related confidential documents.

Supported content can include:
- PDF
- DOC/DOCX
- Text-based documents
- Other practical document types

Committee members have equal access.

They can:
- View
- Upload
- Edit where technically supported
- Replace/update
- Organize
- Delete where required

Do not expose committee documents to normal participants.

If a binary document cannot be edited directly in-browser, provide a safe download/replace workflow rather than pretending it is editable.

---

# 27. COMMITTEE DOCUMENT SECURITY

Committee documents are private.

A participant must not be able to access a document simply by guessing a URL.

Enforce authorization server-side.

Use secure storage/access patterns.

---

# 28. PUBLIC WEBSITE

The public-facing website must feel like a professional swimming competition website, not a generic admin dashboard.

Theme:
- Swimming-focused
- Sporty
- Premium
- Clean
- Modern
- Energetic
- Professional

Primary brand colors:
- Blue
- White
- Golden
- Green

Use the colors tastefully and consistently.

Avoid making the UI look childish or overly cartoonish.

---

# 29. EXISTING LOGO

The official logo file will exist at:

public/images/logo.png

Use this exact image as the site's logo.

Do NOT recreate or replace the logo.

Use it in:
- Header
- Preloader
- Relevant branding areas
- Footer where appropriate

---

# 30. LOGO PRELOADER

Create a stylish website preloader using:

public/images/logo.png

The logo should animate in a way inspired by:
- Water
- Swimming
- Flowing motion
- Ripples/waves

The animation should feel smooth, premium and modern.

It should not block the site unnecessarily.

It should disappear gracefully once the application is ready.

Respect accessibility/performance and provide a reduced-motion-friendly behavior where appropriate.

---

# 31. HOME PAGE HERO VIDEO

The home page hero must use:

public/video/hero.mp4

This is the swimming-pool hero video supplied by the project owner.

Requirements:
- Responsive
- Full-width hero treatment
- Swimming atmosphere
- Appropriate overlay for text readability
- Autoplay/muted/loop behavior as appropriate for browser policies
- Poster/fallback behavior if needed
- Do not break the site if the asset is temporarily missing

Do not replace this video with a stock video.

---

# 32. PUBLIC NAVIGATION

Main header navigation:

- Home
- Registrations
- Events
- Contact

Authentication state:

If NOT logged in:
- Sign Up
- Login

If logged in:
- Profile / Dashboard
- Logout

The exact label can be polished for UX, but the functionality must remain.

Role-aware navigation must be implemented.

---

# 33. REGISTRATIONS PUBLIC PAGE

The Registrations page should show active/upcoming competition registration opportunities.

Each competition should show useful information such as:
- Competition name
- Date
- Registration status
- Deadline
- Short description
- Register/View button

If the visitor is not authenticated, guide them to sign up/login appropriately.

If authenticated:
- Eligible/available registration should open
- Already registered competitions should clearly show existing registration status

---

# 34. EVENTS PAGE

The Events page must showcase past/current swimming competitions.

Example:

## Swimming Competition Ladies 2026

Display the competition's images/gallery.

Then other competitions can have their own:
- Heading
- Description
- Date
- Gallery

The page should support multiple competitions and galleries.

Do not hard-code the page so that only one event can exist.

Where practical, make competition/event gallery content manageable from the committee dashboard or structured so adding future public event content does not require rewriting components.

---

# 35. PUBLIC EVENT PHOTOS / FUTURE ASSETS

The project owner will continue adding images to the public folder over time.

Design the asset structure to support future additions.

Suggested structure:

public/
  images/
    logo.png
    events/
      ladies-2026/
      championship-2026/
      other-competitions/

Do not assume only the currently existing folders will remain.

Make image rendering robust.

Use optimized image handling where possible.

---

# 36. CONTACT PAGE

Contact page should contain Karachi Club / swimming committee contact information.

Include a clear WhatsApp CTA.

Clicking the WhatsApp contact should redirect/open WhatsApp chat for the configured phone number.

The phone number must be easy to change through configuration/environment/settings.

Do not scatter the phone number throughout the codebase.

---

# 37. FOOTER

Keep the footer small and clean.

Include:
- KC / swimming branding
- Admin contact
- Phone number
- WhatsApp/contact option
- Basic copyright information

Do NOT create a huge multi-column footer.

---

# 38. COMMITTEE DASHBOARD

The committee dashboard should include, at minimum:

Dashboard / Overview
Participants
Registrations
Competitions
Events
Age Groups
Results
Documents
Settings / relevant configuration

Possible overview cards:
- Total participants
- Active competitions
- Total registrations
- Recent registrations
- Upcoming competitions

The dashboard should be practical for committee members, not unnecessarily complicated.

---

# 39. NO-CODE MANAGEMENT IS ESSENTIAL

The following MUST be manageable from the website UI:

1. Competitions
2. Competition rules
3. Competition registration dates
4. Age groups
5. Swimming events
6. Event eligibility
7. Event ordering
8. Event active/inactive state
9. Maximum events per participant
10. Competition images/gallery where supported
11. Results
12. Committee documents

A committee member must NOT need:
- VS Code
- terminal
- source-code editing
- JSON editing
- TypeScript editing
- database manual editing

for normal competition management.

---

# 40. DATABASE DESIGN

Use a proper relational database.

At minimum, model concepts similar to:

User
Participant
Parent/Guardian
ParentChild relationship
CommitteeMember
Competition
CompetitionRule
AgeGroup
Stroke
Event
CompetitionEvent
Registration
RegistrationEvent
RelayTeam
RelayTeamMember
Result
Document
Gallery / CompetitionImage
Session / Authentication-related entities

Do not duplicate permanent participant information unnecessarily.

Use foreign keys and proper relationships.

Prevent duplicate competition registrations at database level where appropriate.

---

# 41. RECOMMENDED TECHNOLOGY

Use modern, maintainable production technologies.

Preferred stack:

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Secure authentication/session solution appropriate for Next.js
- Server-side authorization
- Form validation
- Secure file handling/storage
- CSV/XLSX export support

Use additional libraries only when they solve a real requirement.

Do not add unnecessary technologies just to make the stack look impressive.

The codebase must remain understandable and maintainable.

---

# 42. RESPONSIVENESS

The website must be responsive on:

- Desktop
- Laptop
- Tablet
- Mobile

Committee dashboard must also work on smaller screens, while remaining comfortable for desktop data management.

Do not design desktop-only tables without mobile handling.

---

# 43. UI / UX QUALITY

Prioritize:
- Clean spacing
- Strong typography hierarchy
- Accessible contrast
- Smooth transitions
- Professional cards/tables
- Clear buttons
- Useful empty states
- Loading states
- Error states
- Success confirmations
- Form validation
- Responsive layouts

Use subtle swimming/water visual language:
- Wave/ripple motifs
- Water-like transitions
- Fluid shapes where appropriate
- Subtle gradients
- Sport/competition visual hierarchy

Do not overuse animations.

---

# 44. ACCESSIBILITY

Include:
- Keyboard-friendly interactions
- Proper form labels
- Accessible buttons
- Good contrast
- Alt text for meaningful images
- Reduced motion consideration
- Clear error messages

---

# 45. SECURITY REQUIREMENTS

Security is a core requirement.

Implement:
- Server-side authorization
- Role-based access control
- Secure authentication
- Secure persistent sessions
- Protected committee routes
- Protected documents
- Input validation
- Server-side validation
- Database constraints
- Secure file upload validation
- Safe handling of environment secrets
- Protection against unauthorized direct URL access

Never put passwords or secret committee keys in client-side source code.

Never rely only on frontend route hiding for authorization.

---

# 46. DATA VISIBILITY RULES

## Public
Can see:
- Public website
- Public competition information
- Public event galleries
- Publicly intended results/content

## Participant
Can see:
- Own profile
- Own registrations
- Own competition history
- Own results
- Parent-managed children's data where applicable

## Parent/Guardian
Can see/manage:
- Their own account
- Their linked children
- Their children's registrations/history/results

## Committee
Can see/manage:
- Complete participant database
- Registrations
- Competitions
- Events
- Age groups
- Results
- Committee documents
- Other committee-only data

Do not leak participant personal information through public pages.

---

# 47. ERROR HANDLING

The application must handle:
- Failed login
- Expired session
- Invalid registration
- Duplicate registration
- Invalid event selection
- Exceeded event limit
- Invalid file upload
- Unauthorized access
- Missing assets
- Server/database errors

Show friendly user-facing messages while keeping technical details out of the UI.

---

# 48. FORMS

All forms must have:
- Clear labels
- Required/optional indication
- Validation
- Helpful error messages
- Loading state
- Success state
- Disabled submit state while submitting

Do not allow accidental double submissions.

---

# 49. PERFORMANCE

Optimize:
- Images
- Hero video loading
- Database queries
- Dashboard tables
- Public pages

Use pagination/server-side querying for large participant lists.

Do not load the entire participant database into the browser unnecessarily.

---

# 50. SEO / PUBLIC WEBSITE

Implement reasonable SEO for public pages:
- Metadata
- Page titles
- Descriptions
- Open Graph metadata where appropriate
- Semantic HTML

Committee/private pages should not be publicly indexed.

---

# 51. CONFIGURATION

Keep easy-to-change project settings centralized.

Examples:
- Committee secret key
- KC/admin phone number
- WhatsApp number
- Site name
- Basic branding/configuration

Sensitive secrets must use environment variables or secure server-side configuration.

Do not duplicate configuration values throughout components.

---

# 52. ASSET STRUCTURE

Start with:

public/
  images/
    logo.png
    events/
  video/
    hero.mp4

The owner may add more images/videos later.

Do not break the application when additional assets are added.

Use clean naming conventions.

---

# 53. IMPORTANT UX FLOW

## Public visitor

Home
 -> Explore Events / Registrations
 -> Sign Up or Login
 -> Appropriate portal

## Participant

Sign Up
 -> Complete profile
 -> Login
 -> Persistent session
 -> Participant dashboard
 -> Choose competition
 -> Read rules
 -> Select events
 -> Register
 -> Confirmation
 -> Registration appears in committee dashboard

## Returning participant

Open website
 -> Existing persistent session
 -> Dashboard
 -> New competition
 -> Register
 -> No need to re-enter permanent information

## Parent

Create parent account
 -> Add/link child profile
 -> Select child
 -> Select competition
 -> Register child
 -> Registration stored under child

## Committee

Login as Committee Member
 -> Committee authentication
 -> Committee secret key
 -> Committee dashboard
 -> Manage competitions/events/age groups
 -> View registrations
 -> Export lists
 -> Manage results
 -> Manage documents

On future visits, preserve secure authentication/session so repeated login is minimized.

---

# 54. DO NOT DO THESE THINGS

Do NOT:
- Build only a static frontend
- Build only a registration form
- Hard-code competitions
- Hard-code age groups
- Hard-code events
- Require developers to edit code for routine event changes
- Require developers to edit code for routine age-group changes
- Store committee documents publicly
- Expose participant database publicly
- Give participants committee access
- Make users repeatedly log in unnecessarily
- Create unnecessary payment gateway functionality
- Create fake/mock registration behavior when real persistence is required
- Create fake/mock dashboards disconnected from the database
- Add unnecessary admin hierarchy
- Replace the supplied logo
- Replace the supplied hero video with stock media
- Overuse animations
- Overengineer the project without reason

---

# 55. DEVELOPMENT APPROACH

Before implementing major features:

1. Inspect the repository.
2. Understand the existing setup.
3. Do not destroy existing working functionality without reason.
4. Establish the architecture.
5. Set up database schema and migrations.
6. Set up authentication and roles.
7. Build public website.
8. Build participant/parent portal.
9. Build committee dashboard.
10. Implement no-code competition/event/age-group management.
11. Implement registrations.
12. Implement exports.
13. Implement results.
14. Implement documents.
15. Implement galleries.
16. Add security/authorization checks.
17. Test all major flows.
18. Fix errors.
19. Verify responsive behavior.
20. Verify production build.

---

# 56. ADMIN/CMS EXPERIENCE

The committee dashboard should feel like a simple CMS.

For example:

Competitions
  -> Add Competition
  -> Edit
  -> Publish
  -> Registration settings
  -> Rules
  -> Events
  -> Gallery
  -> Registrations
  -> Results

Age Groups
  -> Add
  -> Edit
  -> Disable
  -> Reorder

Events
  -> Add
  -> Edit
  -> Disable
  -> Configure eligibility

The goal is that a non-developer committee member can manage a completely different swimming competition next month without asking a developer to modify code.

---

# 57. DATA INTEGRITY

Examples:

- A participant cannot have duplicate KC membership/profile records unnecessarily.
- A participant cannot register twice for the same competition.
- A participant cannot select more events than the competition allows.
- An inactive event cannot be newly registered for.
- An inactive age group should not be selectable where it is no longer valid.
- A competition past its registration deadline should not accept normal public registrations unless reopened by committee.
- Deleted/deactivated configuration should not destroy historical registration/results data.

Prefer soft-disable/archive behavior for important historical data.

---

# 58. HISTORICAL DATA

Past competitions must remain useful.

Do not destroy:
- Past registrations
- Past results
- Past competition information
- Historical event associations

If an event or age group is later renamed/disabled, historical records must still remain understandable.

---

# 59. FUTURE SCALABILITY

Design the system so it can later support:
- More competitions
- More participants
- More committee members
- More events
- More age groups
- More galleries
- Personal bests
- Advanced result statistics
- Notifications
- Additional public content

Do not build a one-competition-only architecture.

---

# 60. DEFINITION OF DONE

The project is NOT complete if it only looks good.

A feature is complete when:
- UI exists
- Database persistence exists where required
- Server-side logic exists
- Validation exists
- Authorization exists
- Error/loading/success states exist
- It works after page refresh
- It works with persistent sessions
- It works with realistic data
- It works on mobile and desktop
- Production build succeeds

Especially verify:

1. Participant registration
2. Parent with multiple children
3. Persistent login
4. Committee login/access
5. Committee secret-key protection
6. Competition creation
7. Competition rules editing
8. No-code age-group editing
9. No-code event editing
10. Competition-specific event selection
11. Maximum event limit
12. Automatic registration appearance in committee dashboard
13. Duplicate registration prevention
14. Participant search/filtering
15. CSV/XLSX export
16. Results management
17. Registration history
18. Committee document privacy
19. Public event galleries
20. Hero video
21. Logo preloader
22. Responsive UI
23. Server-side security

---

# 61. FINAL IMPLEMENTATION PRINCIPLE

Build this as a real, usable Karachi Club Swimming Competition Management System.

The most important success metric is:

A committee member should be able to create the next swimming competition, change its rules, choose/add/edit age groups, configure events, open registration, receive registrations automatically, export participant lists, manage results, and manage competition documents — WITHOUT OPENING VS CODE AND WITHOUT ASKING A DEVELOPER TO CHANGE CODE.

The public website should look premium, swimming-focused, responsive, and visually connected to Karachi Club swimming.

The participant/parent experience should be simple enough that a non-technical parent can register a child without confusion.

The committee experience should eliminate repetitive paperwork as much as realistically possible.

When requirements conflict, prioritize:
1. Data security
2. Correct role-based access
3. No-code committee management
4. Data integrity
5. Simple participant experience
6. Maintainable architecture
7. Visual polish

Do not invent major features that are not required. If a technical decision is necessary, choose the simplest production-appropriate solution and document it clearly.

END OF COMP-PROMPT.md


# 62. GOOGLE AUTHENTICATION ADD-ON

Add Google OAuth / Google Sign-In authentication to the existing Karachi Club Swimming Competition Management System.

## Goal

Users should be able to create an account and log in using their Google account instead of having to remember a separate website password.

The authentication must be production-ready and securely integrated with the existing application, database, roles, and persistent sessions.

---

## 1. Google Sign-In

Add a prominent:

**Continue with Google**

button on the authentication pages.

Users should be able to:

* Sign up using Google
* Log in using Google
* Return to the website without repeatedly logging in
* Log out normally
* Recover/re-authenticate through Google when necessary

Do NOT create a fake/demo Google login button.

Use a proper OAuth 2.0 / OpenID Connect Google authentication flow through the chosen authentication library.

---

## 2. Account Creation

When a user signs in with Google for the first time:

1. Authenticate the user through Google.
2. Retrieve the verified Google identity information needed by the application.
3. Create the corresponding user account in PostgreSQL if it does not already exist.
4. Store the Google provider/account relationship securely.
5. Create the application's authenticated session.
6. Continue to the appropriate onboarding/dashboard flow.

Do not store the user's Google password.

The application must never ask users for their Google password.

---

## 3. Existing User Handling

If the Google email already belongs to an existing application account:

* Do not create a duplicate account.
* Link/sign in to the existing account safely where appropriate.
* Preserve all existing participant profiles, registrations, competition history, results, and other data.
* Do not lose or overwrite existing user information.

Use the email/provider identity carefully to prevent accidental account duplication.

---

## 4. Roles

The application has two main user flows:

### Participant / Parent

Google login should allow the user to access the Participant/Parent portal.

After first Google authentication, if the account has not completed its required profile setup:

→ Show the participant/parent onboarding/profile setup.

After setup:

→ Open the Participant/Parent Dashboard.

### Committee Member

Google authentication should also be available for committee members.

Committee access must still require the existing additional Committee Key security layer.

Flow:

**Continue with Google → Google authentication → Committee Key → Committee Dashboard**

The Committee Key must:

* Be validated server-side.
* Never be exposed in frontend/client-side code.
* Never be hard-coded into publicly accessible source code.
* Be stored securely as an environment variable/secret.
* Act as an additional committee-access layer.

All committee members have equal permissions. Do not create admin/super-admin hierarchy.

---

## 5. Persistent Login

The application must use secure persistent sessions.

The user should NOT have to log in every time they visit the website.

Expected behavior:

First visit:

**Continue with Google → authenticated → dashboard**

Later visits:

**Open website → existing valid session → dashboard**

Provide a normal:

**Logout**

option.

When the user logs out, the application session should be invalidated securely.

Do not implement insecure permanent client-side authentication using only localStorage.

Use secure server-managed/session-based authentication appropriate for Next.js.

---

## 6. Security Requirements

Google authentication must be implemented securely.

Requirements:

* OAuth state protection.
* Proper callback validation.
* Secure session handling.
* Secure cookies.
* HTTP-only cookies where appropriate.
* Secure cookies in production.
* SameSite protection.
* CSRF protection where applicable.
* Server-side authorization.
* Never trust role information supplied by the client.
* Never expose OAuth client secrets to the browser.
* Store secrets only in environment variables.
* Never commit secrets to Git.
* Add required secrets to `.env.example` as placeholders only.

Example environment variables may include:

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

AUTH_SECRET / equivalent secure session secret

Use the exact variable names required by the selected authentication library.

---

## 7. Authorization

Google authentication only proves the user's identity.

It must NOT automatically grant committee access.

Committee authorization must still be enforced server-side.

A normal Google-authenticated participant/parent must never be able to access:

* Committee Dashboard
* Committee participant database
* Private registrations database
* Committee documents
* Committee settings
* Committee-only management APIs

Even if someone manually enters a private route URL, server-side authorization must block unauthorized access.

---

## 8. Database Integration

Integrate Google authentication with the existing Prisma/PostgreSQL database.

The database design should support:

* User
* Authentication account/provider
* Session
* Participant/Parent profile
* Committee member role/access

Use proper relations and unique constraints.

A Google account should not accidentally create multiple application users.

Do not duplicate permanent participant data unnecessarily.

---

## 9. UI/UX

Authentication pages should match the existing swimming website design.

Use the existing:

* Blue
* White
* Golden
* Green

visual theme.

The Google button should look professional and clean.

Example:

**[ G Continue with Google ]**

Do not use a childish or overly flashy design.

Show appropriate:

* Loading state
* Authentication error
* Cancelled login state
* Network/authentication failure
* Successful login transition

Do not expose technical OAuth errors directly to users.

Use friendly messages.

---

## 10. Mobile Responsiveness

Google authentication must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

The authentication interface must remain usable on small screens.

---

## 11. Existing Authentication

Before changing authentication:

1. Inspect the existing authentication implementation.
2. Understand the current database schema.
3. Preserve existing working functionality.
4. Do not unnecessarily replace the entire authentication architecture.
5. Integrate Google authentication into the existing system if the current architecture supports it.

If the current authentication implementation is incomplete or unsuitable, refactor it carefully into a secure production-ready solution.

Do not break:

* Participant accounts
* Parent-child relationships
* Committee accounts
* Registrations
* Competition history
* Results
* Documents
* Sessions
* Existing database data

---

## 12. Google OAuth Configuration

Document exactly what configuration is required for production.

The implementation should clearly identify:

* Google OAuth Client ID
* Google OAuth Client Secret
* Authorized JavaScript origins if required
* Authorized redirect/callback URI
* Production domain configuration
* Local development configuration

Do not hard-code domain-specific values.

Use environment variables/configuration.

---

## 13. Development Requirements

After implementing Google authentication:

1. Run type checking.
2. Run linting.
3. Run database validation/migrations if required.
4. Test Google sign-up.
5. Test Google login.
6. Test returning-user persistent session.
7. Test logout.
8. Test participant access.
9. Test committee access.
10. Test invalid committee-key access.
11. Test unauthorized participant access to committee routes.
12. Test mobile authentication UI.
13. Test production build.

Fix all errors found during testing.

---

## 14. Important Restrictions

DO NOT:

* Store Google passwords.
* Put Google Client Secret in frontend code.
* Put Committee Key in frontend code.
* Hard-code OAuth secrets.
* Create fake Google authentication.
* Give every Google user committee access.
* Create duplicate users for the same Google account.
* Use localStorage alone as the authentication mechanism.
* Remove existing user/registration data.
* Break existing participant or committee workflows.
* Require users to log in repeatedly when a valid session exists.

---

## Final Expected Flow

### Participant / Parent

Landing Page

↓

Register/Login as Participant

↓

**Continue with Google**

↓

Google Authentication

↓

First-time user → Complete Parent/Participant/Swimmer profile

↓

Participant Dashboard

↓

Future visits → Automatically remain logged in while the session is valid

### Committee Member

Landing Page

↓

Register/Login as Committee Member

↓

**Continue with Google**

↓

Google Authentication

↓

Enter Committee Key

↓

Committee Dashboard

↓

Future visits → Remain logged in while the session is valid

---

## Final Requirement

Implement this as a real production authentication system, not a UI-only mock.

Google authentication must be fully connected to the existing PostgreSQL/Prisma database, user roles, secure sessions, participant/parent portal, and committee portal.

After implementation, verify that the entire existing application still works correctly.
