#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  deploy-frontend.sh — React build → S3 upload
#
#  Use: ./deploy-frontend.sh
#  Prerequisites:
#    - aws cli configured
#    - .env.production मध्ये EC2 IP filled असावा
# ─────────────────────────────────────────────────────────────
set -e   # कुठेही error आला तर script थांब

# ── Config — हे तुझ्या terraform outputs मधून भर ─────────────
S3_BUCKET="healthcare-dev-frontend-6921b573"    # terraform output: s3_frontend_bucket
AWS_REGION="ap-south-1"

# ── Step 1: Production env check ─────────────────────────────
echo "▶ Checking .env.production..."
if [ ! -f ".env.production" ]; then
  echo "❌ .env.production file नाही! आधी बनवा."
  exit 1
fi

if grep -q "YOUR_EC2_PUBLIC_IP" .env.production; then
  echo "❌ .env.production मध्ये EC2 IP अजून बदललेला नाही!"
  exit 1
fi

echo "✅ .env.production OK"

# ── Step 2: Dependencies install ─────────────────────────────
echo ""
echo "▶ Installing dependencies..."
npm install

# ── Step 3: Production build ──────────────────────────────────
echo ""
echo "▶ Building React app..."
npm run build

echo "✅ Build complete → ./build folder"

# ── Step 4: S3 upload ─────────────────────────────────────────
echo ""
echo "▶ Uploading to S3: $S3_BUCKET"

# HTML files — cache नको (नवीन deploy लगेच दिसावा)
aws s3 sync build/ s3://$S3_BUCKET/ \
  --region $AWS_REGION \
  --delete \
  --exclude "*.js" \
  --exclude "*.css" \
  --exclude "*.png" \
  --exclude "*.jpg" \
  --exclude "*.ico" \
  --exclude "*.woff*" \
  --cache-control "no-cache, no-store, must-revalidate"

# JS/CSS/Images — 1 year cache (filename मध्ये hash असतो)
aws s3 sync build/ s3://$S3_BUCKET/ \
  --region $AWS_REGION \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable"

echo "✅ Upload complete!"

# ── Step 5: Website URL दाखव ──────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "🌐 Frontend live at:"
echo "   http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com"
echo "════════════════════════════════════════"
