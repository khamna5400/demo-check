# Hiver — Social Discovery & Community Platform (Web + Mobile)

Hiver is a mobile-first platform that helps young adults (16–26) find community through local, real-world events called **Hives**.  
Think **Facebook Events + Meetup** reimagined for Gen Z: warm design, fast local discovery, and lightweight social features.

**Important architecture note:**  
- The **current web code** (built with **Lovable**) is wired to **Supabase**.  
- The **target/long-term backend** is **Firebase (Auth + Firestore + Storage)** because the **mobile app already runs on Firebase** with live users and data.  
- We will **cut over the web app to Firebase** and deprecate Supabase as quickly as possible.

---

## Mission
- Reduce loneliness by nudging people from screens into **shared experiences**.
- Help **artists** grow audiences and **venues** attract foot traffic.
- Keep the product **clean, youthful, fast**, and **trustworthy**.

---

## User types
| Type | Purpose | Key actions |
|---|---|---|
| **Fan (General User)** | Attend discoverable Hives | Discover, RSVP, connect with people, follow artists |
| **Artist / Creator** | Build audience, post updates | Create announcements, host Hives, see fan engagement |
| **Venue / Business** | Host and book live experiences | List opportunities, manage bookings, calendar view |

---

## Core features (MVP → +)
1. **Home Feed / Discovery**
   - Nearby Hives list (fast load, cached), filters: category, date, distance
   - Public discovery available **without login**
   - Remove/hide expired events automatically after `endDateTime`

2. **Hive Details**
   - Cover image (upload / 5 defaults / gradient fallback)
   - Description, host, attendees, map, RSVP button (reversible)
   - Optional link + optional file upload (same row, both optional)
   - Visibility options: **public / connections / private list**
   - Recurring options (basic rules first)

3. **Create Hive**
   - Fields: title, description, location (address + lat/lng), date & time **(12-hour AM/PM)**, category/tags, link, file upload, visibility, recurrence
   - Strong validation for images/links
   - On error: show gradient fallback (no null images)

4. **Profiles**
   - Fan: name, bio, interests, location, XP/level, connections, RSVPs
   - Artist: bio, genre, social links, followers, announcements feed
   - Venue: business info, amenities, photos, booking dashboard

5. **Social graph**
   - **Connections** = fan↔fan (friendship style)
   - **Followers** = fan→artist (announcements visibility)
   - Consolidate visibility logic around these two relationships

6. **Announcements / Feed**
   - Artist announcements visible **only to followers**
   - Optional general feed tied to Hive participation and group chats

7. **Gamification**
   - XP for joining, hosting, inviting
   - Show XP/level on profiles (simple levels for MVP)

8. **Venue Booking**
   - Venues list opportunities; artists request booking
   - Venue calendar view, approve/deny, status tracking

9. **Algorithms (first pass)**
   - **Smart Hive Recommendations** (interests, location, past RSVPs, connections)
   - **People You May Know** (mutuals, shared interests)
   - **Trending Hives** (RSVP velocity + recency)
   - **Notifications** (reminders + follow updates, consent-aware)
   - **Spam/Safety** (rules first; AI later)

---

## Branding & UI
- **Primary Yellow:** `hsl(45 100% 51%)`
- **Accent Pink:** `hsl(345 100% 70%)`
- **Gradient:** `linear-gradient(135deg, hsl(45 100% 51%), hsl(345 100% 70%))`
- **Light background:** `#ffffff` | **Dark:** `hsl(0 0% 6%)`
- **Text:** near-black `hsl(0 0% 6%)`
- **Corners:** `0.75rem` | **Glows:** `0 0 40px` yellow & pink
- **Fonts:** Headings = **Poppins 700**, Body = **Inter**
- **Motion:** smooth, subtle; keep interaction snappy
- **Rule:** show **all times** in **12-hour AM/PM**

---

## Tech stack (Web)
- **UI:** Next.js + React + TailwindCSS
- **Maps:** Mapbox or Google Maps
- **Backend:** **Firebase Auth + Firestore + Storage** (migrated from Supabase)
- **Hosting:** Vercel

---

## Critical architecture: Data Access Layer (DAL)
All UI code must call **abstracted data functions** (e.g., `data.users.getById`, `data.hives.create`) instead of direct Supabase/Firebase calls.  
This allows:
- Quick cutover from Supabase → Firebase
- Reuse of mobile app’s Firebase data and auth
- No UI rewrites during migration

**DAL Modules:**
/services/data
/adapters/firebase.ts # target
/adapters/supabase.ts # current (Lovable)
/auth/{firebase,supabase}.ts
/storage/{firebase,supabase}.ts
/types.ts
index.ts # selects adapter by env flag

**Firebase Vite env vars (required)**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`


---

## Target data model (Firebase — existing mobile app)
We will use these **exact** collections/fields to interoperate with mobile:

### `users`
- email (String), uid (String), created_time (DateTime), phone_number (String), name (String), location (String), numHives (Integer), bio (String), display_name (String), connections (List<Ref users>), interests (List<String>), birthday (DateTime), gender (String), requestsReferences (List<Ref users>), status (String), savedHivesReferences (List<Ref hives>), reportedHivesReferences (List<Ref hives>), photo_url (Image Path), hivesGoingTo (List<Ref hives>), passionsRef (List<Ref passions>), blockedUsers (List<Ref users>), previous_username (String), numberUnseenNotifications (Integer), numberUnseenMessages (Integer), isAdmin (Boolean), friendship_styles (List<Image Path>), business_name (String), business_coordinates (Lat Lng), business_address (String), business_description (String), business_hours (List<Data(businessHours)>), business_atomosphere_types (List<String>), business_audience_types (List<String>), business_experience_types (List<String>), business_type (String), isBusinessAccount (Boolean), business_photos (List<Image Path>), business_link (String), business_followers (List<Ref users>), business_upcoming_hives (List<Ref hives>), business_ammenities (List<String>), business_header_photo (Image Path), displayBusinessContactInfo (Boolean), isOnboardingComplete (Boolean), reportedBuzzReferences (List<Ref feed>)

### `notifications` (sub-collection of users)
- userRef (Ref users), timestamp (DateTime), notification_type (String), hiveRef (Ref hives), acceptanceStatus (String)

### `contacts` (sub-collection of users)
- name (String), phone (String)

### `reportedUsers`
- userRef (Ref users), reason (String), message (String), userWhoReported (Ref users)

### `usernames`
- usernames_taken (List<String>)

### `chat`
- userAuth (Ref users), userOth (Ref users), lastMessage (String), messageTime (DateTime), user (Ref users), seenAuth (Ref users), seenBol (Boolean), authUserName (String), otherUserName (String), otherUnseenMessages (Integer), authUnseenMessages (Integer)

### `message`
- msgOwner (Ref users), chatRef (Ref chat), message (String), image (Image Path), msgTime (DateTime), hiveRef (Ref hiveChat), isPinned (Boolean), isPost (Boolean), hiveReferenceShared (Ref hives)

### `passions`
- userRef (Ref users), passionImage (Image Path), passionName (String)

### `survey_data`
- Rating (String), WhatWouldYouAdd (String), Feedback (String), UID (String), Email (String), Location (Lat Lng), isAndroid (Boolean), isIOS (Boolean), Date (DateTime), BusinessContact (List<String>), EventInfo (String)

### `comments`
- commenterRef (Ref users), commentTxt (String), createdAt (DateTime), buzzRef (Ref feed), isHive (Boolean), hiveRef (Ref hives)

### `reportedHivesAndPosts`
- hiveReference (Ref hives), isHive (Boolean), reason (String), message (String), usersWhoReported (Ref users), userWhoPosted (Ref users), buzzReference (Ref feed), isBuzz (Boolean)

### `hiveChat`
- userAuth (Ref users), userOther (List<Ref users>), lastMessage (String), messageTime (DateTime), user (Ref users), seenAuth (Ref users), seenBol (Boolean), chatName (String), chatImage (Image Path), associatedHive (Ref hives), isAssociatedToHive (Boolean), hiveCount (Integer), buzzCount (Integer)

### `hives`
- post_title (String), post_description (String), post_user (Ref users), time_posted (DateTime), likes (List<Ref users>), post_photos (List<Image Path>), usersThatRSVP (List<Ref users>), visibility (String), location (Lat Lng), private (Boolean), formattedAddress (String), customLocation (String), isProtected (Boolean), state (String), city (String), isCustomName (Boolean), privateList (List<Ref users>), durationHour (String), durationMinute (String), hiveType (String), isMultiDay (Boolean), hostName (String), numberAttendees (Integer), hiveSize (String), geohash (String), point (Data(locationData)), linkInfo (List<String>), isRecurring (Boolean), recurrenceInfo (Data(recurrenceInfo)), createdFrom (String), startDateTime (DateTime), endDateTime (DateTime), createdInGroupChat (Boolean), groupRef (Ref hiveChat), numComments (Integer)

### `feed`
- creatorRef (Ref users), creatorName (String), buzzDesc (String), photos (List<Image Path>), location (Lat Lng), customLocation (String), dateTime (DateTime), createdAt (DateTime), visibility (String), invitedUsers (List<Ref users>), hiveRef (Ref hives), expiresAt (DateTime), isRepost (Boolean), isPrivate (Boolean), isPublic (Boolean), hivePostTitle (String), mapLocationName (String), numComments (Integer), createdInGroupChat (Boolean), groupRef (Ref hiveChat)

**Visibility rules fix:**  
- Use **followers** only for Artist→Fan delivery of announcements.  
- Keep **connections** strictly fan↔fan.  
- Update UI verbs so users clearly choose **Follow Artist** vs **Connect**.

---

## Migration: Supabase (current) → Firebase (target)

**Goal:** Make the web app **use the same Firebase project** as mobile, so users log in to both with the same account and see the same data.

### Approach
1. **Introduce DAL** if not present (see above). UI calls only `data.*` functions.
2. **Implement Firebase adapter** (Auth + Firestore + Storage) using the exact collections above.
3. **Switch env flag** to `NEXT_PUBLIC_DATA_BACKEND=firebase` and verify web reads/writes against live mobile data.
4. **Decommission Supabase** (or keep temporarily for archiving).

### Cutover options
- **Big bang:** switch DAL to Firebase in one commit, verify, remove Supabase.
- **Dual-write (optional):** during a brief transition, write to both (Firebase authoritative). This is only needed if coordinating a phased release.

### One-time data backfill (if needed)
- If any important Hives/Users exist **only** in Supabase: export them, transform to Firestore shape (DocRefs, arrays), and import once. Otherwise, skip.

### Auth
- Web must use **Firebase Auth** so sessions are shared with mobile.  
- After sign-up → **auto-login**, no extra “Join Hiver” steps.  
- Listen to `onAuthStateChanged` to keep sessions fresh and prevent random logouts.  
- Add session recovery on refresh (Firebase handles this).

---

## Non-functional requirements
- **Performance:** Feed and Hive lists must render quickly (SWR cache, optimistic updates).
- **No bad images:** Validate on create/edit; use onError fallback; clean existing invalid URLs by setting to null.
- **Resilience:** Strong input validation; safe guards for null fields; strict schema on web.
- **Privacy/Consent:** Notifications and email preferences must be explicit and changeable.
- **Accessibility:** Color contrast, focus states, keyboard nav.

---

## Acceptance criteria (MVP)
- Public Hives discoverable without login.
- Create Hive form supports **link + file** (same row; both optional).
- Five default images available; fallback gradient if image fails.
- Events vanish from feed at/after `endDateTime`.
- Time displays everywhere in **12-hour AM/PM**.
- Announcements only visible to **followers** (not connections).
- Auth: sign-up → auto-login; stable sessions; refresh doesn’t kick users out.
- Switching `NEXT_PUBLIC_DATA_BACKEND=firebase` makes the web app work against the **existing mobile Firebase data** with no UI changes.

---

## Task plan for Cursor

### Phase 0 — Prep
- [ ] Add `/services/data` with `types.ts`, `index.ts`, `adapters/{supabase,firebase}.ts`, `auth/*`, `storage/*`
- [ ] Add a single env switch: `NEXT_PUBLIC_DATA_BACKEND`
- [ ] Replace direct Supabase calls in UI with `data.*` calls

### Phase 1 — Firebase Adapter (Target)
- [ ] Implement Firebase Auth (email/password + Google)
- [ ] Users adapter (read/upsert, followArtist, connectUsers, search)
- [ ] Hives adapter (create/getById/getUpcomingNear, rsvp/cancel)
- [ ] Feed adapter (create/getVisibleForUser)
- [ ] Storage adapter (uploadPublic → download URL)
- [ ] Session handling in app root (`onAuthStateChanged`)

### Phase 2 — Feature Parity
- [ ] Public discovery without login
- [ ] Image validation + onError fallback
- [ ] Recurring Hives model (basic RRULE or stored object)
- [ ] Remove expired Hives on read (query endDateTime >= now)

### Phase 3 — Social Graph & Announcements
- [ ] Consolidate visibility logic: followers (artist) vs connections (fan)
- [ ] Fix announcements feed so followers can see artist posts
- [ ] Notifications via user sub-collection

### Phase 4 — Venue Booking (Skeleton)
- [ ] Venue opportunities (list/create)
- [ ] Booking requests (create/approve/deny)
- [ ] Calendar view binding

### Phase 5 — Cleanup & Cutover
- [ ] Switch to `NEXT_PUBLIC_DATA_BACKEND=firebase` on staging
- [ ] Verify cross-platform login (mobile ↔ web)
- [ ] If needed, one-time backfill select Supabase rows into Firestore
- [ ] Remove Supabase code paths (or keep as fallback behind env)

---

## Notes to Implementers
- Use **DocRef fields** (e.g., `usersThatRSVP: [Ref users]`) as in mobile.
- Keep **image paths** interoperable (prefer Firebase Storage public URLs).
- Use **geohash/point** only if needed for geospatial queries; otherwise start with `endDateTime` sort + city/state filter.
- Ensure **followers** vs **connections** visibility is correct; don’t mix them.

---

## “Cursor: what to do now”
1) **Create the DAL** and make UI call `data.*` only.  
2) **Implement the Firebase adapter** using the schemas above.  
3) Flip `NEXT_PUBLIC_DATA_BACKEND=firebase` and test against the live mobile project.  
4) Remove direct Supabase usage from UI.  
5) (Optional) Export/import select Supabase rows if they matter; otherwise, deprecate.

---
