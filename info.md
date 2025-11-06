Build a mobile-first web app called Hiver — a social discovery platform that helps people ages 16–26 connect through local events called "Hives." The goal is to bring back genuine human connection and help solve loneliness through real-world experiences. Think Facebook Events meets Meetup, designed for Gen Z.

Core features:
1. Home feed showing nearby Hives. Each Hive includes image, title, date/time, category tags, short description, and distance from user. Clicking a Hive opens details with full info, map location, RSVP button, and host info. Include category and distance filters.
2. User profiles with name, photo, short bio, interests, badges or lifestyle stats, friend connections, and list of joined or upcoming Hives. Editable profile.
3. Business profiles for event hosts. Businesses can create and manage Hives, see RSVP counts and engagement.
4. Gamification system: users earn XP for joining, hosting, or inviting friends. Display XP or level on profiles.
5. Search and filter for Hives, users, or businesses.
6. Authentication with email or Google. Simple onboarding asks for interests and location to personalize feed.
7. Localization so users see Hives near them based on city or ZIP radius.
8. Clean responsive design using Next.js, React, TailwindCSS. Modern UI with rounded cards, soft shadows, minimal typography similar to BeReal and Lemon8.
9. Supabase as backend for auth, data, and storage. Use tables: Users (id, name, email, bio, location, interests, XP, level, isBusiness), Hives (id, title, description, category, date, time, location, hostId, attendees, coverImage), and Connections (userId, friendId, status).
10. Map integration using Mapbox or Google Maps API placeholder.

Implementation order:
1. Initialize project with Next.js + Supabase + TailwindCSS.
2. Build Home page with Hive feed and filters.
3. Create Hive details page with RSVP button linked to Supabase attendees.
4. Create Profile page with editable info and XP display.
5. Add onboarding and authentication flow.
6. Add localization filter for events by location.
7. Add basic gamification logic and XP updates.
8. Deploy to Vercel and ensure mobile responsiveness.

when creating a hive, I want to have an option to add a file and a link, it should exist on the same row and be optional. Could we give them 5 options for a default picture? Or could we figure out a way to render on the home page with no picture at all if it is not selected?

The final app should be clean, youthful, and easy to use — a tool that helps young adults find what’s happening nearby, meet others, and feel more connected to their community. Focus on function and interactivity over polish for the MVP. Output fully deployable code connected to Supabase with working Hive creation, RSVP, profiles, and XP system.

Additionally, add in a "Create Hive" page that includes, name of hive, location, description, date and time, ability to add link, a hive category text box, and a "who are you telling?" for public, private, and just my connections. Taking the information from the create a hive, build a modern simple layout for the hive details page that I can look at.

There should be backend functionality to all buttons, including login, sign up, etc. Ensure that when a user creates an account, they logs in automatically. It shouldn't ask them to Join Hiver or Sign in again. Also, it should never kick the user out of their account mid way scrolling or anything like that. In other words, improve the session handling to prevent random logouts. Also, add a session recovery mechanism that restores login if it gets interrupted.

Ensure the hives are always visible upon reload (faster than what they currently do). And implement a feature to remove the event from the page once the date and time have passed. It'd also be good to add the recurring hive options to the create a hive experience.

I also want event discovery available without log in. No event should show up with a null image so there should be better validation (when creating/editing events to ensure only valid image URLs or files are accepted, could use file upload to Cloud storage instead of external URLs, prevents bad data from entering the system), smarter fallback (update the HiveCard component to detect when an image fails to load, Use the onError event handler to switch to the gradient fallback, This handles existing bad data gracefully), and data cleanup + prevention (Clean up existing invalid URLs in the database (set them to null), Add both validation AND smart fallback, Most robust solution)

Also, build the option to look at other users (from anywhere on the app) and connect with them.

Additionally, implement backend algorithm like the following:
1. Smart Hive Recommendations - Suggest events based on user interests, connections, location, past RSVPs
2. Connection Matching - Find users with similar interests or mutual connections
3. Trending Hives Algorithm - Rank events by popularity, recency, and engagement
4. Notification System - Smart timing for reminders based on user behavior
5. Spam/Safety Detection - Auto-moderate content using AI

Throughout the app, display all time to 12-hour format with AM/PM. 

Prompt Title: “Hiver Music & Venue Expansion”
Prompt:
Build on Hiver’s existing community platform to create a music and venue marketplace connecting artists, venues, and fans.
Add Artist Dashboards with fan analytics, announcement posts, and email/notification management.
Add a Venue Portal for restaurants/bars to list open entertainment opportunities, view artist profiles, and book performers.
Enable Fans to follow artists, set notification preferences, RSVP to events, and receive tailored recommendations.
Include Event Creation and Local Discovery (map view, what’s happening nearby).
Integrate a data insights layer to give artists leverage (fan demographics, engagement metrics) and venues visibility into audience trends.
Ensure notification and data collection tools respect user consent and privacy.
Goal: Empower musicians to manage their audiences and leverage fan data to negotiate with venues, while helping local businesses attract traffic through live experiences — ultimately building stronger community connections through music.

I want Hiver to have all the following Phases implemented in the app/web:
Phase 1: User Type System & Extended Profiles
1. Add user types (Artist, Venue, Fan)
2. Artist profiles with bio, genres, social links
3. Venue profiles with capacity, amenities, location details
Phase 2: Artist Dashboard & Fan Engagement
Artist followers system
1. Announcement/post feed
2. Basic fan analytics (follower count, engagement)
3. Fan notification preferences
Phase 3: Venue Portal & Booking
1. Venue opportunities listing
2. Artist discovery for venues
3. Booking request system
Phase 4: Enhanced Discovery
1. Map view of events
2. Nearby events filtering
3. Location-based recommendations
Phase 5: Advanced Analytics & Insights
1. Detailed fan demographics
2. Engagement metrics dashboard
3. Venue audience trends
4. Privacy consent management

Look at the posts database and see who actually has visibility access to those posts. I created test accounts, and I created an artist account and posted an announcement when I had no connections, nothing shown to other accounts. I added a connection to the artists page, and then posted again, The fan account, I was unable to see any announcements, so implement the following:
Consolidate into One System:
1. Use only the followers table for artist-fan relationships
2. Keep connections only for fan-to-fan relationships
3. Update the UI to clearly distinguish between the two actions

There should be an ability to add a profile picture and update it too. If a user doesn't have any profile picture, then it should be set to the default picture (our logo).

Add a venue owner/restaurant owner dashboard to manage bookings and organize calendars for entertainers.

Please adjust this site to reflect the following branding and color scheme:
Primary Color Palette
- Main Brand Colors:
Primary Yellow: hsl(45 100% 51%) - A vibrant, energetic golden yellow
Accent Pink: hsl(345 100% 70%) - A warm, friendly pink/coral color
Gradient: These two colors blend together in a signature gradient (yellow → pink at 135°)
- Supporting Colors:
Background: Pure white hsl(0 0% 100%) in light mode, very dark hsl(0 0% 6%) in dark mode
Foreground/Text: Near-black hsl(0 0% 6%) for text
Secondary: Soft gray hsl(0 0% 96%) for subtle backgrounds
Muted: Mid-gray tones for secondary text
Visual Effects
- The brand uses several distinctive visual treatments:
Glowing Effects: Yellow and pink glows that create warmth and energy
Yellow glow: 0 0 40px hsl(45 100% 51% / 0.3)
Pink glow: 0 0 40px hsl(345 100% 70% / 0.3)
- Gradient Combinations:
Primary gradient: Yellow → Pink (used on buttons and text)
Subtle backgrounds: White → Very light gray
Hero backgrounds: Light yellow/pink washes
- Typography
Headings: Poppins (bold, weight 700) - Modern, friendly, geometric
Body: Inter - Clean, highly readable sans-serif
All fonts have smooth, professional fallbacks
Design Philosophy
- The branding conveys:
✨ Energy & Warmth: The yellow-pink gradient feels optimistic and inviting
🤝 Approachability: Rounded corners (0.75rem radius), soft shadows
💫 Modern & Fresh: Clean typography, ample white space, smooth animations
🎯 Focus on Connection: Warm colors that evoke feelings of community and togetherness
The color scheme strikes a balance between being bold enough to stand out (that vibrant yellow) while remaining friendly and welcoming (the coral-pink accent). It's youthful without being childish, energetic without being overwhelming. 

