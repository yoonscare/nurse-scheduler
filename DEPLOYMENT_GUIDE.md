# 🚀 AI Buzz Digest 배포 가이드

## 📋 프로젝트 구조
```
├── ai-news-backend/     # Node.js 백엔드 서버
├── ai-news-digest/      # React 프론트엔드
└── DEPLOYMENT_GUIDE.md  # 이 파일
```

## 🌟 배포 옵션

### 1. **무료 배포 (추천)**

#### **A. Vercel (프론트엔드) + Railway (백엔드)**

##### 백엔드 배포 (Railway)
1. [Railway.app](https://railway.app) 가입
2. GitHub 저장소 연결
3. `ai-news-backend` 폴더 선택
4. 자동 배포 완료
5. 생성된 도메인 복사 (예: `https://your-app.railway.app`)

##### 프론트엔드 배포 (Vercel)
1. [Vercel.com](https://vercel.com) 가입
2. GitHub 저장소 연결
3. `ai-news-digest` 폴더 선택
4. 환경변수 설정:
   ```
   REACT_APP_API_URL=https://your-app.railway.app
   ```
5. 배포 완료

#### **B. Netlify (프론트엔드) + Render (백엔드)**

##### 백엔드 배포 (Render)
1. [Render.com](https://render.com) 가입
2. "New Web Service" 선택
3. GitHub 연결 후 `ai-news-backend` 선택
4. 설정:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 배포 완료

##### 프론트엔드 배포 (Netlify)
1. [Netlify.com](https://netlify.com) 가입
2. "Sites" → "Add new site" → "Import from Git"
3. `ai-news-digest` 폴더 선택
4. Build 설정:
   - Build command: `npm run build`
   - Publish directory: `build`
5. 환경변수 추가:
   ```
   REACT_APP_API_URL=https://your-app.onrender.com
   ```

### 2. **올인원 배포**

#### **Docker + DigitalOcean App Platform**
1. GitHub에 코드 업로드
2. DigitalOcean App Platform에서 앱 생성
3. 자동 Docker 빌드 및 배포

## 🔧 로컬 개발 환경

### 백엔드 실행
```bash
cd ai-news-backend
npm install
npm start
# 서버: http://localhost:5000
```

### 프론트엔드 실행
```bash
cd ai-news-digest
npm install
npm start
# 앱: http://localhost:3000
```

## 🌐 환경변수 설정

### 백엔드 (ai-news-backend)
```env
PORT=5000  # Railway/Render에서 자동 설정됨
```

### 프론트엔드 (ai-news-digest)
```env
REACT_APP_API_URL=https://your-backend-url.com
```

## 🚨 주의사항

### 1. **CORS 설정**
백엔드에서 프론트엔드 도메인 허용 필요:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000']
}));
```

### 2. **크롤링 제한**
- AI Times 서버 부하를 고려하여 요청 간격 조절
- 너무 빈번한 요청 시 IP 차단 가능성

### 3. **무료 티어 제한**
- Railway: 월 500시간 무료
- Vercel: 월 100GB 대역폭
- Render: 750시간 무료 (sleep mode 있음)

## 🔗 추천 배포 플로우

1. **GitHub에 코드 업로드**
2. **Railway에 백엔드 배포**
3. **Vercel에 프론트엔드 배포**
4. **환경변수 설정 확인**
5. **도메인 연결 (선택사항)**

## 📞 지원

문제 발생시:
1. GitHub Issues 등록
2. 로그 확인 (Railway/Vercel 대시보드)
3. CORS 설정 점검

---

🎉 **배포 완료 후 테스트:**
- 실시간 크롤링 작동 확인
- AI 요약 기능 테스트  
- 모바일 반응형 확인