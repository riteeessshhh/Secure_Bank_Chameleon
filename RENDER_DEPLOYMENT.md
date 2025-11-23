# 🚀 Render.com Deployment Guide

This guide will help you deploy the Chameleon Deception System to Render.com.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub (already done ✅)
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **GitHub Repository URL** - `https://github.com/riteeessshhh/Secure_Bank_Chameleon`

## 🎯 Deployment Steps

### Option 1: Using render.yaml (Recommended - Automated)

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"

2. **Connect Repository**
   - Connect your GitHub account if not already connected
   - Select repository: `riteeessshhh/Secure_Bank_Chameleon`
   - Render will automatically detect `render.yaml`

3. **Review Configuration**
   - Render will show 2 services:
     - `chameleon-backend` (Python Web Service)
     - `chameleon-frontend` (Static Site)
   - Click "Apply" to deploy

4. **Wait for Deployment**
   - Backend will build first (~2-3 minutes)
   - Frontend will build after (~1-2 minutes)
   - Both services will be live!

### Option 2: Manual Setup (Step-by-Step)

#### Step 1: Deploy Backend

1. **Create Web Service**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `riteeessshhh/Secure_Bank_Chameleon`

2. **Configure Backend Service**
   - **Name**: `chameleon-backend`
   - **Environment**: `Python 3`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

3. **Environment Variables** (Optional)
   - `PYTHON_VERSION`: `3.11.0`
   - `DATABASE_PATH`: `logs.db` (default, can leave empty)

4. **Click "Create Web Service"**
   - Wait for build to complete (~2-3 minutes)
   - Note the service URL (e.g., `https://chameleon-backend.onrender.com`)

#### Step 2: Deploy Frontend

1. **Create Static Site**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository: `riteeessshhh/Secure_Bank_Chameleon`

2. **Configure Frontend Service**
   - **Name**: `chameleon-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: `Free`

3. **Environment Variables** (IMPORTANT!)
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL from Step 1 (e.g., `https://chameleon-backend.onrender.com`)
   - ⚠️ **Do NOT include trailing slash**

4. **Click "Create Static Site"**
   - Wait for build to complete (~1-2 minutes)
   - Your frontend will be live!

## 🔧 Post-Deployment Configuration

### Update Frontend API URL (If Manual Setup)

If you used manual setup and need to update the API URL:

1. Go to your frontend service in Render dashboard
2. Navigate to "Environment" tab
3. Update `VITE_API_URL` with your backend URL
4. Click "Save Changes"
5. Render will automatically rebuild

### Verify Deployment

1. **Backend Health Check**
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"status": "ok"}`

2. **Frontend**
   - Visit your frontend URL
   - Should load the landing page
   - Try logging in at `/login`

## 📝 Important Notes

### Free Tier Limitations

- **Spinning Down**: Free services spin down after 15 minutes of inactivity
- **First Request**: May take 30-60 seconds to wake up
- **Build Time**: Free tier has longer build times
- **Database**: SQLite database is ephemeral (resets on redeploy)

### Database Persistence

⚠️ **SQLite on Render is NOT persistent** - data resets on redeploy.

For production, consider:
- PostgreSQL (Render offers free PostgreSQL)
- External database service
- File-based storage with persistent volumes (paid plans)

### CORS Configuration

The backend is configured to allow all origins (`*`). For production:
- Update `backend/main.py` to restrict CORS to your frontend domain
- Change `allow_origins=["*"]` to `allow_origins=["https://your-frontend-url.onrender.com"]`

## 🐛 Troubleshooting

### Backend Issues

1. **Build Fails**
   - Check build logs in Render dashboard
   - Verify `requirements.txt` is correct
   - Ensure Python version is compatible

2. **Service Won't Start**
   - Check start command is correct
   - Verify `$PORT` environment variable is used
   - Check logs for error messages

3. **Database Errors**
   - SQLite file permissions on Render
   - Database path is correct
   - Check `DATABASE_PATH` environment variable

### Frontend Issues

1. **API Calls Fail**
   - Verify `VITE_API_URL` is set correctly
   - Check browser console for CORS errors
   - Ensure backend URL has no trailing slash

2. **Build Fails**
   - Check Node.js version compatibility
   - Verify all dependencies in `package.json`
   - Check build logs for specific errors

3. **404 Errors**
   - Configure redirects for React Router
   - Add `_redirects` file in `client/public/`:
     ```
     /*    /index.html   200
     ```

## 🔐 Security Recommendations

1. **Change Admin Credentials**
   - Update hardcoded credentials in `backend/main.py`
   - Use environment variables for sensitive data

2. **Enable HTTPS**
   - Render provides HTTPS by default ✅

3. **Restrict CORS**
   - Update CORS settings to your frontend domain only

4. **Environment Variables**
   - Never commit API keys or secrets
   - Use Render's environment variable feature

## 📊 Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and request metrics
- **Alerts**: Set up email alerts for service failures

## 🎉 Success!

Once deployed, your application will be available at:
- **Frontend**: `https://chameleon-frontend.onrender.com`
- **Backend**: `https://chameleon-backend.onrender.com`

Share your deployed URL and start testing! 🚀


