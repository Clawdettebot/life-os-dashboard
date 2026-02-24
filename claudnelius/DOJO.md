# Claudnelius' DOJO

## Mistakes & Lessons Learned

### 1. Breaking Existing Code
**Mistake:** Modified core server.js without testing
**Lesson:** Always test changes locally before deploying. Use PM2 to see errors.

### 2. Hardcoding Secrets
**Mistake:** Put API keys directly in code
**Lesson:** Always use environment variables (.env files)

### 3. Not Using Version Control
**Mistake:** Made changes without committing
**Lesson:** Commit often. `git checkout` without stash = lost work.

### 4. Skipping Error Handling
**Mistake:** Didn't catch errors, server crashed
**Lesson:** Always wrap async code in try/catch. Log errors.

### 5. Forgetting Route Order
**Mistake:** Added new routes after catch-all
**Lesson:** Routes in Express.js are matched in order. Put specific routes BEFORE wildcards.

### 6. Not Restarting Server
**Mistake:** Changed code but didn't restart PM2
**Lesson:** Node.js requires restart after code changes. `pm2 restart all`

### 7. Frontend Cache Issues
**Mistake:** User saw old UI despite code changes
**Lesson:** Hard refresh (Ctrl+Shift+R) or clear cache. Rebuild with `npm run build`.

## Code Standards

### File Structure
```
/dashboard
  /client (React frontend)
  /server (Express backend)
  /components (Shared code)
  .env (secrets)
```

### Naming Conventions
- Files: kebab-case (my-file.js)
- Components: PascalCase (MyComponent.js)
- Variables: camelCase (myVariable)
- Constants: UPPER_SNAKE_CASE

### Git Workflow
```bash
# Before making changes
git checkout -b feature/new-feature

# Make changes, test locally

# Commit with descriptive message
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

### PM2 Commands
```bash
pm2 status          # See all processes
pm2 logs dashboard # View logs
pm2 restart all   # Restart everything
pm2 delete all    # Stop and remove
```

### Debugging Checklist
1. Check browser console (F12)
2. Check PM2 logs (`pm2 logs`)
3. Check nginx logs (`tail /var/log/nginx/error.log`)
4. Test API with curl
5. Verify environment variables are loaded
6. Check if server is running (`lsof -i :3000`)

## Common Issues & Solutions

### "Cannot find module"
- Run `npm install` in the project directory
- Check if package.json has the dependency

### "Port already in use"
- Find process: `lsof -i :3000`
- Kill it: `kill -9 <PID>`
- Or use different port

### "CORS error"
- Add CORS middleware to Express
- Or proxy through nginx

### "SyntaxError: Unexpected token"
- Usually means HTML returned instead of JSON
- Check API endpoint exists
- Check nginx proxy_pass

## Template: New Feature
```javascript
// Feature: [Name]
// Purpose: [What it does]
// Input: [What it receives]
// Output: [What it returns]

app.get('/api/feature', async (req, res) => {
  try {
    // 1. Validate input
    // 2. Process data
    // 3. Return result
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Feature error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Template: React Component
```javascript
import React, { useState, useEffect } from 'react';

export default function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data on mount
  }, []);
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```
