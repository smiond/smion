# 🚀 Smion CV Website - Deployment Instructions

## 📋 Pre-deployment Checklist

### 1. Environment Variables
Create `.env.production` file with ONE provider (Gemini recommended) and base config:
```
# Google Gemini (preferred)
GOOGLE_API_KEY=your_google_gemini_api_key_here
# or OpenAI
SMION_OPENAI_API_KEY=your_openai_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here

NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=./cv_database.db
```

### 2. Build Configuration
The `next.config.js` is already configured for static export:
```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}
```

## 🛠️ Build Process

### Option 1: Manual Build (if npm run build fails)
1. Open PowerShell as Administrator
2. Navigate to project directory
3. Run: `npm run build`
4. If it fails, try: `npx next build`

### Option 2: Alternative Build Method
If build continues to fail, we can use Vercel or Netlify for deployment instead.

## 📁 Files to Upload to FTP Server

After successful build, upload these folders/files to your web server:

### Required Files:
- `out/` folder (contains all static files)
- `public/` folder (contains locales and assets)
- `cv_database.db` (SQLite database file)

### Directory Structure on Server:
```
your-domain.com/
├── index.html
├── chess/
│   └── index.html
├── cv/
│   └── index.html
├── admin/
│   └── index.html
├── locales/
│   ├── en/
│   ├── hr/
│   └── de/
└── _next/
    └── static/
```

## 🔧 Server Configuration

### Apache (.htaccess)
Create `.htaccess` file in root directory:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        # API routes need server-side rendering
        proxy_pass http://localhost:3000;
    }
}
```

## ⚠️ Important Notes

### Database Considerations
- SQLite database (`cv_database.db`) needs write permissions
- Consider using a cloud database for production
- Backup database regularly

### API Routes Limitation
- Static export doesn't support API routes
- Chat functionality will need alternative solution:
  - Use external API service
  - Deploy API separately
  - Use serverless functions

### Alternative Solutions
1. **Vercel Deployment** (Recommended)
   - Automatic builds
   - Serverless functions support
   - Easy domain setup

2. **Netlify Deployment**
   - Static site hosting
   - Form handling
   - Easy setup

3. **Traditional Hosting**
   - Requires Node.js server
   - Full Next.js functionality
   - More complex setup

## 🎯 Recommended Next Steps

1. **Try Vercel/Netlify first** - easier setup
2. **If FTP is required** - we need to modify the app for static hosting
3. **Database solution** - consider cloud database
4. **API routes** - implement alternative chat solution

## 📞 Support
If you encounter issues, we can:
- Set up Vercel deployment (free)
- Modify app for static hosting
- Implement alternative chat solution
- Help with server configuration
