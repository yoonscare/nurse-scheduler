const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// AI Times Most Popular 기사 크롤링
async function crawlAITimesMostPopular() {
  try {
    console.log('Starting crawl of AI Times Most Popular...');
    const response = await axios.get('https://www.aitimes.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Most Popular 섹션 찾기 - 정확한 구조로
    // <div class="item"> 안에 순위와 기사 링크가 있음
    $('.item').each(function() {
      if (articles.length >= 10) return false; // 10개만
      
      // 순위 확인
      const rankElement = $(this).find('.number');
      const rank = rankElement.text().trim();
      
      // 기사 링크와 제목
      const linkElement = $(this).find('a[href*="/news/articleView.html"]');
      const link = linkElement.attr('href');
      const titleElement = linkElement.find('h2.auto-titles');
      let title = titleElement.length > 0 ? titleElement.text().trim() : linkElement.text().trim();
      
      if (link && title && rank) {
        // 중복 제거
        const fullLink = link.startsWith('http') ? link : `https://www.aitimes.com${link}`;
        if (!articles.find(a => a.link === fullLink)) {
          articles.push({
            id: `article-${rank}`,
            rank: parseInt(rank) || articles.length + 1,
            title: title.replace(/\s+/g, ' ').trim(),
            link: fullLink,
            category: 'AI News',
            date: new Date().toISOString().split('T')[0]
          });
          
          console.log(`Found #${rank}: ${title.substring(0, 50)}...`);
        }
      }
    });
    
    // Most Popular를 못찾은 경우 일반 기사 링크로 폴백
    if (articles.length === 0) {
      console.log('Most Popular section not found, using fallback...');
      
      // 일반 기사 링크 찾기
      $('a[href*="/news/articleView.html"]').each(function(index) {
        if (articles.length >= 10) return false;
        
        const link = $(this).attr('href');
        let title = '';
        
        // h2.auto-titles를 먼저 찾고, 없으면 일반 텍스트
        const h2Title = $(this).find('h2.auto-titles');
        if (h2Title.length > 0) {
          title = h2Title.text().trim();
        } else {
          title = $(this).text().trim();
        }
        
        // 제목 정제
        title = title.replace(/\s+/g, ' ').trim();
        
        if (link && title && title.length > 10) {
          const fullLink = link.startsWith('http') ? link : `https://www.aitimes.com${link}`;
          if (!articles.find(a => a.link === fullLink)) {
            articles.push({
              id: `article-${articles.length + 1}`,
              rank: articles.length + 1,
              title: title.substring(0, 200),
              link: fullLink,
              category: 'AI News',
              date: new Date().toISOString().split('T')[0]
            });
            
            console.log(`Found article ${articles.length}: ${title.substring(0, 50)}...`);
          }
        }
      });
    }
    
    // 순위별로 정렬
    articles.sort((a, b) => a.rank - b.rank);
    
    console.log(`Found ${articles.length} articles total`);
    return articles.slice(0, 10); // 최대 10개만 반환
    
  } catch (error) {
    console.error('Crawling error:', error.message);
    throw error;
  }
}

// 기사 상세 내용 크롤링 및 요약
async function getArticleDetails(url) {
  try {
    console.log(`Fetching article details for: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // AI Times 기사 내용 추출 - 더 정확한 선택자
    let content = '';
    const contentSelectors = [
      '#article-view-content-div', // AI Times 메인 콘텐츠
      '.user-snax-post-submission-content',
      '.td-post-content',
      '.article-content',
      '.entry-content',
      'article .content',
      '.post-content'
    ];
    
    for (const selector of contentSelectors) {
      const found = $(selector).text().trim();
      if (found && found.length > 100) {
        content = found;
        console.log(`Content extracted using selector: ${selector}`);
        break;
      }
    }
    
    // 내용이 없으면 본문에서 텍스트 추출
    if (!content) {
      // article 태그 내용 시도
      const articleContent = $('article').text().trim();
      if (articleContent && articleContent.length > 100) {
        content = articleContent;
      } else {
        // 전체 body에서 추출 (최후의 수단)
        content = $('body').text().trim();
      }
    }
    
    // 요약 생성 - 의미있는 첫 문장들 추출
    let summary = '';
    if (content) {
      // 불필요한 텍스트 제거
      const cleanContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .replace(/관련기사|기사목록|댓글|공유|인쇄|스크랩/g, '')
        .trim();
      
      // 첫 2-3 문장을 요약으로 사용
      const sentences = cleanContent.split(/[.!?]/);
      const meaningfulSentences = sentences
        .filter(s => s.trim().length > 20)
        .slice(0, 3);
      
      summary = meaningfulSentences.join('. ').substring(0, 300).trim();
      if (summary && !summary.endsWith('.')) {
        summary += '...';
      }
    }
    
    // 기사 이미지 추출 - AI Times 특화
    let imageUrl = '';
    const imageSelectors = [
      '#article-view-content-div img', // AI Times 기사 내 이미지
      '.user-snax-post-submission-content img',
      '.td-post-featured-image img',
      '.entry-thumb img',
      '.featured-image img',
      'article img:first-of-type', // 첫 번째 이미지
      '.post-thumbnail img'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = $(selector).first();
      const src = imgElement.attr('src') || imgElement.attr('data-src');
      
      if (src) {
        // 상대 경로를 절대 경로로 변환
        if (src.startsWith('//')) {
          imageUrl = `https:${src}`;
        } else if (src.startsWith('/')) {
          imageUrl = `https://www.aitimes.com${src}`;
        } else if (src.startsWith('http')) {
          imageUrl = src;
        }
        
        // 유효한 이미지 URL인지 확인 (광고나 로고 제외)
        if (imageUrl && 
            !imageUrl.includes('logo') && 
            !imageUrl.includes('banner') && 
            !imageUrl.includes('ad') &&
            (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.webp'))) {
          console.log(`Image found: ${imageUrl}`);
          break;
        }
      }
    }
    
    // 기본 이미지 설정
    if (!imageUrl) {
      // AI 관련 기본 이미지들
      const defaultImages = [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      ];
      imageUrl = defaultImages[Math.floor(Math.random() * defaultImages.length)];
    }
    
    // 읽기 시간 계산 (한국어 기준: 분당 약 200-300자)
    const readTime = Math.max(1, Math.ceil(content.length / 250)) + '분';
    
    return {
      summary: summary || '기사 내용을 요약할 수 없습니다.',
      imageUrl: imageUrl,
      readTime: readTime
    };
    
  } catch (error) {
    console.error('Error getting article details:', error.message);
    return {
      summary: '기사 내용을 불러올 수 없습니다.',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      readTime: '3분'
    };
  }
}

// API 엔드포인트
app.get('/api/articles', async (req, res) => {
  try {
    console.log('Fetching articles...');
    const articles = await crawlAITimesMostPopular();
    
    // 각 기사의 상세 정보 가져오기 (병렬 처리)
    const articlesWithDetails = await Promise.all(
      articles.map(async (article) => {
        const details = await getArticleDetails(article.link);
        return {
          ...article,
          ...details,
          trending: Math.random() > 0.7 // 30% 확률로 trending
        };
      })
    );
    
    res.json({
      success: true,
      data: articlesWithDetails,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 개별 기사 요약 API
app.post('/api/summarize', async (req, res) => {
  try {
    const { url } = req.body;
    const details = await getArticleDetails(url);
    
    res.json({
      success: true,
      data: details
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  GET  /api/articles - Get Most Popular articles');
  console.log('  POST /api/summarize - Get article summary');
});