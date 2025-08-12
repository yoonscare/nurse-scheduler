# 🤖 AI Buzz Digest

> AI Times Most Popular 기사를 실시간으로 크롤링하고 AI 요약을 제공하는 웹 애플리케이션

![Demo](https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800)

## ✨ 주요 기능

- 📈 **실시간 Most Popular 10위 크롤링**
- 🖼️ **기사 원본 이미지 추출**
- 🤖 **AI 기반 자동 요약**
- 📱 **반응형 모던 UI/UX**
- 🔄 **5분 자동 새로고침**
- ⚡ **빠른 로딩 및 애니메이션**

## 🚀 라이브 데모

- **프론트엔드**: [배포 후 URL 추가]
- **백엔드 API**: [배포 후 API URL 추가]

## 🛠️ 기술 스택

### 프론트엔드
- **React 18** + TypeScript
- **Framer Motion** (애니메이션)
- **Axios** (HTTP 클라이언트)
- **Lucide Icons**

### 백엔드  
- **Node.js** + Express
- **Cheerio** (HTML 파싱)
- **Axios** (웹 크롤링)

### 배포
- **Vercel** (프론트엔드)
- **Railway** (백엔드)

## 🏃‍♂️ 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/ai-buzz-digest.git
cd ai-buzz-digest
```

### 2. 백엔드 실행
```bash
cd ai-news-backend
npm install
npm start
```

### 3. 프론트엔드 실행
```bash
cd ../ai-news-digest
npm install
npm start
```

### 4. 브라우저에서 확인
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:5000

## 📁 프로젝트 구조

```
ai-buzz-digest/
├── ai-news-backend/          # Node.js 백엔드
│   ├── server.js            # 메인 서버 파일
│   ├── package.json         # 백엔드 의존성
│   └── Dockerfile           # Docker 설정
└── ai-news-digest/          # React 프론트엔드
    ├── src/
    │   ├── components/      # UI 컴포넌트
    │   ├── types/          # TypeScript 타입
    │   └── data/           # 샘플 데이터
    ├── package.json        # 프론트엔드 의존성
    └── vercel.json         # Vercel 배포 설정
```

## 🌐 배포하기

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

### 빠른 배포 (무료)

1. **백엔드 배포 (Railway)**
   - [Railway.app](https://railway.app)에서 GitHub 연결
   - `ai-news-backend` 폴더 선택

2. **프론트엔드 배포 (Vercel)**
   - [Vercel.com](https://vercel.com)에서 GitHub 연결  
   - `ai-news-digest` 폴더 선택
   - 환경변수 `REACT_APP_API_URL` 설정

## 🔧 환경변수

### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

### 프로덕션 (.env.production)
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## 📊 API 엔드포인트

### GET /api/articles
Most Popular 10개 기사 목록 조회

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "article-1",
      "rank": 1,
      "title": "GPT-5 출시...",
      "link": "https://www.aitimes.com/news/...",
      "summary": "오픈AI가 차세대 언어모델...",
      "imageUrl": "https://cdn.aitimes.com/...",
      "readTime": "3분",
      "trending": true
    }
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### POST /api/summarize
개별 기사 요약 생성

**요청:**
```json
{
  "url": "https://www.aitimes.com/news/articleView.html?idxno=123"
}
```

## 🎨 주요 화면

### 메인 화면
- 실시간 Most Popular 순위
- 아름다운 그라디언트 배경
- 카드 형태의 기사 목록

### 기사 요약 모달
- AI 생성 요약 내용
- 원문 링크 제공
- 부드러운 애니메이션

## 🔒 주의사항

- AI Times 서버 부하 고려하여 적절한 크롤링 간격 유지
- 과도한 요청 시 IP 차단 가능성 있음
- 무료 배포 플랫폼의 사용량 제한 확인 필요

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 연락처

- 이슈 제기: [GitHub Issues](https://github.com/your-username/ai-buzz-digest/issues)
- 이메일: your-email@example.com

---

⭐ **이 프로젝트가 유용하다면 Star를 눌러주세요!**