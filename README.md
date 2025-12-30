# Take Nick's Stuff 🎁

A high-end, human-centered digital catalog for personal moving sales and giveaways. Built with React, TypeScript, and Vite, powered by Baserow for cloud storage.

## Features

- 🖼️ **Media-first listings** with multiple images per item
- 📸 **Live camera integration** for quick item capture
- 💬 **Instant reservation system** - items are auto-reserved when friends express interest
- 👥 **Waitlist management** for tracking interested parties
- ✏️ **Rich text descriptions** with formatting support
- 🔐 **Admin authentication** for secure item management
- ☁️ **Cloud storage** via Baserow for persistent data

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Baserow** - Cloud database
- **Tailwind CSS** - Styling

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Baserow:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Baserow token and table ID:
     ```env
     VITE_BASEROW_TOKEN=your_token_here
     VITE_BASEROW_TABLE_ID=your_table_id
     ```
   - Update `config/baserow-mapping.ts` with your actual column names

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard:
   - `VITE_BASEROW_TOKEN` - Your Baserow API token
   - `VITE_BASEROW_TABLE_ID` - Your Baserow table ID
3. Deploy! Netlify will automatically build and deploy on every push to main.

The `netlify.toml` file is already configured for optimal deployment.

## Project Structure

```
├── components/          # React components
│   ├── AdminAuth.tsx   # Admin login
│   ├── ItemCard.tsx    # Item display card
│   ├── ItemForm.tsx    # Add/edit item form
│   └── ...
├── config/              # Configuration files
│   └── baserow-mapping.ts  # Baserow column mappings
├── services/            # API services
│   └── baserow.ts      # Baserow integration
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## Baserow Setup

This app requires a Baserow table with the following fields:
- `Name` (text) - Item title
- `description` (long_text) - Item description
- `price` (number) - Item price
- `condition` (single_select) - Item condition
- `status` (single_select) - Item status (Available/Reserved/Taken)
- `image_1` through `image_4` (file) - Image fields
- `taker_name` (text) - Primary interested party
- `taker_time` (date) - Primary interested party timestamp
- `taker_1_name` through `taker_4_name` (text) - Additional takers
- `taker_1_time` through `taker_4_time` (date) - Additional taker timestamps

See `BASEROW_SETUP.md` for detailed setup instructions.

## License

Private project - All rights reserved
