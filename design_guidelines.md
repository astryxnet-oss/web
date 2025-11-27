# Design Guidelines: Free Codes Platform

## Design Approach
**System**: Material Design principles with inspiration from GitHub, Linear, and Discord's clean interfaces. Focus on clarity, organization, and functionality over visual effects. No glowing effects or heavy animations as specified.

## Core Design Elements

### Typography
- **Primary Font**: Inter via Google Fonts
- **Headings**: Font weight 700, sizes: h1 (text-4xl), h2 (text-3xl), h3 (text-xl)
- **Body**: Font weight 400, size text-base
- **Code/Monospace**: JetBrains Mono for displaying codes
- **Labels/Meta**: Font weight 500, size text-sm

### Layout System
**Spacing**: Use Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Sections: py-12 to py-20
- Cards: p-4 to p-6
- Component gaps: gap-4 or gap-6
- Container: max-w-7xl with px-4

### Component Library

**Navigation Bar**
- Fixed top navigation with logo, category links, search bar, and "Submit Code" CTA button
- Include admin login link (top right)
- Mobile: Hamburger menu

**Hero Section**
- Simple, clean introduction banner (h-64 to h-80, not full viewport)
- Headline: "Find & Share Free Codes"
- Subheadline: Code count stats and category overview
- Primary CTA: "Browse Codes" and "Submit Code" buttons
- No background image - use clean gradient or solid background

**Category Grid**
- 3-4 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Category cards with icon, title, code count
- Clickable cards leading to filtered views
- Categories: Discord, Minecraft, Websites, Gaming, Software, Shopping, Education, Tools

**Code Display Cards**
- Compact card layout with border
- Card elements: Category badge, code title, actual code (monospace), description, copy button, status indicator (Verified/New/Popular badge), submission date, upvote count
- Copy button with icon and "Copy Code" text
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-4

**Search & Filter Bar**
- Search input with icon
- Category dropdown filter
- Status filter (All, Verified, New, Popular)
- Sort options (Recent, Popular, Alphabetical)
- Horizontal layout with gap-4

**User Submission Form**
- Modal or dedicated page
- Fields: Code category (dropdown), Code title, Actual code (textarea), Description (textarea), Your name (optional), Email for updates (optional)
- Submit button: "Submit for Review"
- Success message after submission

**Admin Review Dashboard** (Separate admin page)
- Table layout showing pending submissions
- Columns: Submission date, Category, Title, Code preview, Submitter, Actions (Approve/Reject buttons)
- Filter: Pending/Approved/Rejected tabs
- Batch actions available

**Footer**
- 3-column layout: About section, Quick links (Categories, Submit, Admin), Contact/Social
- Newsletter signup optional
- Copyright and terms links

### Code Status Indicators
- **Verified**: Badge with checkmark icon
- **New**: Badge (codes less than 7 days old)
- **Popular**: Badge with fire icon (high copy count)
- Use distinct badge colors for each status

### Icons
Use Heroicons via CDN for all interface icons (search, copy, checkmark, category icons, etc.)

### Interactions
- Copy button: Click to copy, show "Copied!" tooltip for 2 seconds
- Code cards: Subtle hover elevation (shadow-md to shadow-lg transition)
- Buttons: Standard hover state with slight opacity change
- NO glowing effects, NO complex animations
- Simple fade-in on page load

### Responsive Behavior
- Mobile: Single column layout, stacked navigation menu
- Tablet: 2-column code grid
- Desktop: 3-4 column layouts as specified
- Touch-friendly tap targets (min-h-12 for buttons)

## Images
No hero image required. Use clean, minimal design with geometric shapes or subtle gradients if needed. Category cards may include simple vector icons representing each category (Discord logo, Minecraft creeper, globe icon, etc.) via Heroicons or similar icon set.