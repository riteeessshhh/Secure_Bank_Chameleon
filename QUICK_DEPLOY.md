# 🚀 Quick Deploy to Render.com

## Prerequisites
- ✅ GitHub repository: `https://github.com/riteeessshhh/Secure_Bank_Chameleon`
- ⏳ Render.com account (sign up at [render.com](https://render.com))

## Step-by-Step Deployment

### Method 1: Using Blueprint (Easiest - Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in or create account

2. **Create Blueprint**
   - Click "New +" button (top right)
   - Select "Blueprint"
   - Connect GitHub if not already connected
   - Select repository: `riteeessshhh/Secure_Bank_Chameleon`

3. **Review Services**
   - Render will detect `render.yaml` and show 2 services:
     - `chameleon-backend` (Python Web Service)
     - `chameleon-frontend` (Static Site)

4. **⚠️ IMPORTANT: Update Frontend Environment Variable**
   - Before clicking "Apply", click on `chameleon-frontend` service
   - Go to "Environment" section
   - Find `VITE_API_URL` variable
   - **Wait for backend to deploy first**, then update this value
   - Or update it after both services are deployed (see below)

5. **Deploy**
   - Click "Apply" button
   - Wait for builds to complete (~3-5 minutes)

6. **Update Frontend API URL (After Backend is Live)**
   - Once backend is deployed, note its URL (e.g., `https://chameleon-backend.onrender.com`)
   - Go to frontend service → Environment tab
   - Update `VITE_API_URL` to your backend URL (no trailing slash!)
   - Click "Save Changes"
   - Frontend will automatically rebuild

### Method 2: Manual Setup

#### Deploy Backend First

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect repository: `riteeessshhh/Secure_Bank_Chameleon`

2. **Configure**
   - **Name**: `chameleon-backend`
   - **Environment**: `Python 3`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

3. **Create Service**
   - Click "Create Web Service"
   - Wait for deployment (~2-3 minutes)
   - **Copy the service URL** (e.g., `https://chameleon-backend.onrender.com`)

#### Deploy Frontend

1. **Create Static Site**
   - Click "New +" → "Static Site"
   - Connect repository: `riteeessshhh/Secure_Bank_Chameleon`

2. **Configure**
   - **Name**: `chameleon-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: `Free`

3. **Environment Variables** ⚠️ CRITICAL
   - Click "Advanced" → "Add Environment Variable"
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL from above (e.g., `https://chameleon-backend.onrender.com`)
   - ⚠️ **NO trailing slash!**

4. **Create Service**
   - Click "Create Static Site"
   - Wait for deployment (~1-2 minutes)

## ✅ Verify Deployment

1. **Backend Health Check**
   ```
   https://your-backend-url.onrender.com/api/health
   ```
   Should return: `{"status": "ok"}`

2. **Frontend**
   - Visit your frontend URL
   - Should see the landing page
   - Try `/login` route

3. **Test Login**
   - Go to `/login`
   - Try SQL injection: `admin' OR 1=1--`
   - Should trigger deception system

4. **Test Dashboard**
   - Login with: `tanay@chameleon.com` / `admin`
   - Should see analyst dashboard

## 🔧 Troubleshooting

### Frontend can't connect to backend
- ✅ Check `VITE_API_URL` is set correctly (no trailing slash)
- ✅ Verify backend URL is accessible
- ✅ Check browser console for CORS errors
- ✅ Rebuild frontend after updating environment variable

### Backend won't start
- ✅ Check build logs for errors
- ✅ Verify Python version (3.11.0)
- ✅ Check start command is correct

### 404 errors on frontend routes
- ✅ Verify `_redirects` file exists in `client/public/`
- ✅ Check static site configuration

## 📝 What You Need to Tell Me

After deployment, please provide:
1. ✅ Backend URL: `https://...`
2. ✅ Frontend URL: `https://...`
3. ✅ Any errors you encountered

## 🎉 Success!

Once deployed, share your URLs and we can test together!


