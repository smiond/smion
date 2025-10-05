# Modern CV Portfolio Website

A stunning, animated CV portfolio website with multilingual support and AI-powered chatbot functionality.

## Features

- 🎨 **Animated Cube-to-CV Transformation**: Eye-catching 3D cube animation that transforms into your CV
- 🌍 **Multilingual Support**: Available in Croatian, English, and German
- 🤖 **AI Chatbot**: OpenAI-powered assistant that answers questions about your experience
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Modern Tech Stack**: Built with Next.js, React, Tailwind CSS, and Framer Motion
- 🎭 **Glass Morphism**: Modern glass-effect design elements

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Internationalization**: react-i18next
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Database**: SQLite (for chat history and CV data)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cv-portfolio-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=./cv_database.db
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Customization

### Adding Your CV Data

1. **Update translation files**: Edit the JSON files in `public/locales/` for each language:
   - `public/locales/en/common.json` (English)
   - `public/locales/hr/common.json` (Croatian) 
   - `public/locales/de/common.json` (German)

2. **Update API context**: Modify the CV data in `app/api/chat/route.ts` to match your information

3. **Add your photo**: Replace the placeholder in `components/CVContent.tsx` with your actual photo

### Customizing Animations

The cube animation can be customized in:
- `tailwind.config.js` - Animation keyframes and timing
- `styles/globals.css` - CSS animations and effects
- `app/page.tsx` - Animation logic and triggers

### Styling

The design uses Tailwind CSS with custom glass morphism effects. Key styling files:
- `tailwind.config.js` - Theme configuration
- `styles/globals.css` - Global styles and component classes

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Features Explained

### Cube Animation
The opening animation features 64 rotating cubes that gradually disappear to reveal your CV content. This creates a memorable first impression.

### Multilingual Support
- Automatic language detection
- Manual language switching
- Persistent language preference
- Complete CV translation

### AI Chatbot
- Powered by OpenAI GPT-3.5-turbo
- Context-aware responses about your CV
- Multilingual support
- Real-time conversation

### Responsive Design
- Mobile-first approach
- Glass morphism effects
- Smooth animations
- Modern gradient backgrounds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you have any questions or need help customizing the website, please open an issue on GitHub.

---

**Note**: Remember to replace the placeholder CV data with your actual information before deploying!

