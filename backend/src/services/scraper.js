const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const https = require('https')

puppeteer.use(StealthPlugin())

const INSTAGRAM_BASE = 'https://www.instagram.com'
const MAX_REELS = 20
const TIMEOUT = 45000

const sleep = ms => new Promise(r => setTimeout(r, ms))

const parseMetric = str => {
  if (!str) return 0
  const clean = str.replace(/\s/g, '').replace(',', '.').toUpperCase()
  if (clean.includes('M')) return Math.round(parseFloat(clean) * 1_000_000)
  if (clean.includes('K')) return Math.round(parseFloat(clean) * 1_000)
  const n = parseInt(clean.replace(/\D/g, ''), 10)
  return isNaN(n) ? 0 : n
}

// ─── MÉTODO 1: API JSON interna do Instagram ──────────────────────────────────
const fetchViaInstagramAPI = async (username) => {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'www.instagram.com',
      path: `/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        'Referer': `https://www.instagram.com/${username}/`,
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        // Cookie de sessão (opcional, mas melhora muito o acesso)
        ...(process.env.IG_SESSION_ID
          ? { 'Cookie': `sessionid=${process.env.IG_SESSION_ID}; csrftoken=${process.env.IG_CSRF || 'missing'}` }
          : {}),
      },
    }

    const req = https.request(opts, (res) => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Instagram API retornou status ${res.statusCode}`))
        }
        try {
          const json = JSON.parse(body)
          const user = json?.data?.user
          if (!user) return reject(new Error('Usuário não encontrado na API do Instagram'))
          resolve(user)
        } catch (e) {
          reject(new Error('Falha ao parsear resposta da API do Instagram'))
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error('Timeout na API do Instagram'))
    })
    req.end()
  })
}

const scrapeInstagramViaAPI = async (username) => {
  console.log(`[SCRAPER] Tentando via API interna do Instagram...`)
  const user = await fetchViaInstagramAPI(username)

  const full_name = user.full_name || ''
  const profile_pic_url = user.profile_pic_url_hd || user.profile_pic_url || ''
  const is_verified = user.is_verified || false

  // Pegar reels do edge_felix_video_timeline (reels) ou edge_owner_to_timeline_media (posts)
  const reelEdge = user.edge_felix_video_timeline?.edges || []
  const postEdge = user.edge_owner_to_timeline_media?.edges || []

  // Combinar e filtrar apenas vídeos
  const allMedia = [...reelEdge, ...postEdge]
  const seen = new Set()
  const reels = []

  for (const { node } of allMedia) {
    if (!node || seen.has(node.id)) continue
    if (!node.is_video) continue
    seen.add(node.id)

    const shortcode = node.shortcode || node.id
    reels.push({
      url: `${INSTAGRAM_BASE}/reel/${shortcode}/`,
      platform: 'instagram',
      thumbnail: node.thumbnail_src || node.display_url || '',
      views: node.video_view_count || 0,
      likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
      comments: node.edge_media_to_comment?.count || 0,
      date: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : null,
    })

    if (reels.length >= MAX_REELS) break
  }

  if (reels.length === 0) {
    throw new Error('API retornou 0 reels. Perfil pode ser privado.')
  }

  console.log(`[SCRAPER] API retornou ${reels.length} reels para @${username}`)

  return {
    username,
    platform: 'instagram',
    full_name,
    profile_pic_url,
    is_verified,
    reels,
  }
}

// ─── MÉTODO 2: Puppeteer (fallback com melhorias) ─────────────────────────────
const launchBrowser = async () => {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768',
      '--lang=pt-BR,pt',
    ],
    defaultViewport: { width: 1366, height: 768 },
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  })
}

const loginInstagram = async (page) => {
  const user = process.env.IG_USER
  const pass = process.env.IG_PASS
  if (!user || !pass) {
    console.log('[SCRAPER] Credenciais .env ausentes. Seguindo como anônimo.')
    return false
  }

  console.log(`[SCRAPER] Realizando login com: ${user}`)
  await page.goto(`${INSTAGRAM_BASE}/accounts/login/`, { waitUntil: 'networkidle2', timeout: TIMEOUT })
  await sleep(2000)

  try {
    await page.waitForSelector('input[name="username"]', { timeout: 15000 })
    await page.type('input[name="username"]', user, { delay: 100 })
    await sleep(500)
    await page.type('input[name="password"]', pass, { delay: 100 })
    await sleep(800)

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => null),
      page.click('button[type="submit"]'),
    ])

    await sleep(5000)

    // Dispensar popup "Salvar informações de login"
    const notNowBtn = await page.$x('//button[contains(text(),"Agora não") or contains(text(),"Not Now")]')
    if (notNowBtn.length > 0) {
      await notNowBtn[0].click()
      await sleep(1500)
    }

    console.log('[SCRAPER] Login concluído.')
    return true
  } catch (error) {
    console.log('[SCRAPER] Falha no login:', error.message)
    return false
  }
}

const setSessionCookies = async (page) => {
  const sessionId = process.env.IG_SESSION_ID
  if (!sessionId) return

  console.log('[SCRAPER] Injetando cookie de sessão...')
  await page.setCookie(
    { name: 'sessionid', value: sessionId, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
    ...(process.env.IG_CSRF
      ? [{ name: 'csrftoken', value: process.env.IG_CSRF, domain: '.instagram.com', path: '/' }]
      : [])
  )
}

const scrapeInstagramViaPuppeteer = async (username) => {
  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Anti-detecção avançada
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    })
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
      window.chrome = { runtime: {} }
    })

    // Injetar cookies de sessão se disponíveis
    await setSessionCookies(page)

    // Login se credenciais disponíveis e sem cookie de sessão
    if (!process.env.IG_SESSION_ID && process.env.IG_USER && process.env.IG_PASS) {
      await loginInstagram(page)
    }

    const profileUrl = `${INSTAGRAM_BASE}/${username}/reels/`
    console.log(`[SCRAPER] Puppeteer acessando ${profileUrl}`)

    await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT })
    await sleep(3000)

    // Verificar se foi redirecionado para login
    const currentUrl = page.url()
    if (currentUrl.includes('/accounts/login')) {
      throw new Error('Instagram exigiu login. Configure IG_USER/IG_PASS ou IG_SESSION_ID no .env')
    }

    // Aguardar grade de reels ou erro conhecido
    await page.waitForFunction(() => {
      const links = document.querySelectorAll('a[href*="/reel/"], a[href*="/p/"]')
      const notFound = document.body.innerText.includes('Page Not Found') ||
                       document.body.innerText.includes('Não encontrada') ||
                       document.body.innerText.includes('Sorry')
      return links.length > 0 || notFound
    }, { timeout: 15000 }).catch(() => {})

    // Scroll gradual para carregar mais conteúdo
    for (let i = 1; i <= 3; i++) {
      await page.evaluate((pct) => window.scrollTo(0, document.body.scrollHeight * pct), i * 0.33)
      await sleep(1200)
    }

    // Dados do perfil via meta tags
    const profileData = await page.evaluate(() => {
      const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
      const metaImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
      let full_name = ''
      const titleMatch = metaTitle.match(/^(.+?)\s*[•(]/)
      if (titleMatch) full_name = titleMatch[1].trim()
      else if (metaTitle) full_name = metaTitle

      const verifiedEl = document.querySelector('[aria-label="Verificado"]') ||
        document.querySelector('svg[aria-label*="erified"]')
      return { full_name, profile_pic_url: metaImage, is_verified: !!verifiedEl }
    })

    // Extrair dados da grade
    const reelsData = await page.evaluate((max) => {
      // Tentar múltiplos seletores para achar os cards de reel
      const anchors = Array.from(document.querySelectorAll([
        'a[href*="/reel/"]',
        'a[href*="/p/"]',
        'article a',
      ].join(', '))).filter(a => a.href && (a.href.includes('/reel/') || a.href.includes('/p/')))

      const results = []
      const seen = new Set()

      for (const a of anchors) {
        if (seen.has(a.href)) continue
        seen.add(a.href)

        let views = '0', likes = '0', comments = '0', thumbnail = ''

        // Thumbnail: background-image ou img tag
        const bgDiv = a.querySelector('div[style*="background-image"]')
        if (bgDiv) {
          const match = bgDiv.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)
          if (match) thumbnail = match[1].replace(/&amp;/g, '&')
        }
        if (!thumbnail) {
          const img = a.querySelector('img')
          if (img && img.src && !img.src.includes('data:')) thumbnail = img.src
        }

        // Métricas dos <li> tooltip (aparecem em hover, mas podem estar no DOM)
        const lis = a.querySelectorAll('ul li')
        if (lis.length >= 2) {
          likes = lis[0].innerText.trim()
          comments = lis[1].innerText.trim()
        } else if (lis.length === 1) {
          likes = lis[0].innerText.trim()
        }

        // Views: buscar span com número grande
        const allSpans = Array.from(a.querySelectorAll('span')).map(s => s.innerText.trim()).filter(t => /[\d]/.test(t))
        if (allSpans.length > 0) views = allSpans[0]

        results.push({
          url: a.href,
          platform: 'instagram',
          thumbnail,
          gridViews: views,
          gridLikes: likes,
          gridComments: comments,
          date: null,
        })

        if (results.length >= max) break
      }
      return results
    }, MAX_REELS)

    console.log(`[SCRAPER] Puppeteer encontrou ${reelsData.length} links de reels na grade`)

    if (reelsData.length === 0) {
      throw new Error(
        'O Instagram bloqueou a visualização da grade.'
      )
    }

    const reels = reelsData.map(r => ({
      url: r.url,
      platform: r.platform,
      thumbnail: r.thumbnail || '',
      views: parseMetric(r.gridViews),
      likes: parseMetric(r.gridLikes),
      comments: parseMetric(r.gridComments),
      date: null,
    }))

    return {
      username,
      platform: 'instagram',
      full_name: profileData.full_name,
      profile_pic_url: profileData.profile_pic_url,
      is_verified: profileData.is_verified,
      reels,
    }
  } finally {
    if (browser) {
      await browser.close()
      console.log('[SCRAPER] Browser Puppeteer fechado.')
    }
  }
}

// ─── MÉTODO 3: API pública (sem autenticação, para perfis públicos selecionados) ─
const scrapeInstagramViaPublicAPI = async (username) => {
  console.log(`[SCRAPER] Tentando API pública (graphql)...`)
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'www.instagram.com',
      path: `/${encodeURIComponent(username)}/?__a=1&__d=dis`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': `https://www.instagram.com/${username}/`,
        'X-IG-App-ID': '936619743392459',
        ...(process.env.IG_SESSION_ID
          ? { 'Cookie': `sessionid=${process.env.IG_SESSION_ID}` }
          : {}),
      },
    }

    const req = https.request(opts, (res) => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`API pública retornou ${res.statusCode}`))
        }
        try {
          const json = JSON.parse(body)
          const user = json?.graphql?.user || json?.data?.user
          if (!user) return reject(new Error('Usuário não encontrado na API pública'))
          resolve(user)
        } catch {
          reject(new Error('Resposta não é JSON válido'))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout API pública')) })
    req.end()
  }).then(user => {
    const reelEdge = user.edge_felix_video_timeline?.edges || []
    const postEdge = user.edge_owner_to_timeline_media?.edges || []
    const allMedia = [...reelEdge, ...postEdge]
    const seen = new Set()
    const reels = []

    for (const { node } of allMedia) {
      if (!node || seen.has(node.id) || !node.is_video) continue
      seen.add(node.id)
      const shortcode = node.shortcode || node.id
      reels.push({
        url: `${INSTAGRAM_BASE}/reel/${shortcode}/`,
        platform: 'instagram',
        thumbnail: node.thumbnail_src || node.display_url || '',
        views: node.video_view_count || 0,
        likes: node.edge_liked_by?.count || 0,
        comments: node.edge_media_to_comment?.count || 0,
        date: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : null,
      })
      if (reels.length >= MAX_REELS) break
    }

    if (reels.length === 0) throw new Error('API pública retornou 0 reels')

    return {
      username,
      platform: 'instagram',
      full_name: user.full_name || '',
      profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      is_verified: user.is_verified || false,
      reels,
    }
  })
}

// ─── ORQUESTRADOR: tenta os métodos em sequência ──────────────────────────────
const scrapeInstagramReels = async (username) => {
  const errors = []

  // Tentativa 1: API interna /api/v1/users/web_profile_info
  try {
    return await scrapeInstagramViaAPI(username)
  } catch (e) {
    console.log(`[SCRAPER] API interna falhou: ${e.message}`)
    errors.push(`API interna: ${e.message}`)
  }

  // Tentativa 2: API pública /?__a=1
  try {
    return await scrapeInstagramViaPublicAPI(username)
  } catch (e) {
    console.log(`[SCRAPER] API pública falhou: ${e.message}`)
    errors.push(`API pública: ${e.message}`)
  }

  // Tentativa 3: Puppeteer (fallback pesado)
  try {
    return await scrapeInstagramViaPuppeteer(username)
  } catch (e) {
    console.log(`[SCRAPER] Puppeteer falhou: ${e.message}`)
    errors.push(`Puppeteer: ${e.message}`)
  }

  throw new Error(
    `Não foi possível buscar reels de @${username}.`
  )
}

// ─── TikTok ───────────────────────────────────────────────────────────────────
const scrapeTikTokReels = async (username) => {
  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    )

    const profileUrl = `https://www.tiktok.com/@${username}`
    console.log(`[SCRAPER] Acessando TikTok de @${username}`)

    await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT })
    await sleep(2000)

    const isBlocked = await page.evaluate(() => {
      return !!document.querySelector('.verify-wrap') || document.body.innerText.includes('página não encontrada')
    })

    if (isBlocked) {
      throw new Error('TikTok exigiu Captcha ou perfil não encontrado.')
    }

    // Scroll para carregar thumbnails de todos os videos
    await page.evaluate(() => window.scrollTo(0, 1000))
    await sleep(1000)
    await page.evaluate(() => window.scrollTo(0, 2000))
    await sleep(1000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await sleep(1500)

    const data = await page.evaluate((max) => {
      const full_name = document.querySelector('h1[data-e2e="user-title"]')?.innerText || ''
      const is_verified = !!document.querySelector('[data-e2e="verified-badge"]')
      const profile_pic_url = document.querySelector('[data-e2e="user-avatar"] img, img[class*="Avatar"]')?.src || ''

      const videoCards = Array.from(document.querySelectorAll('div[data-e2e="user-post-item"]'))
      const reels = []

      for (const card of videoCards.slice(0, max)) {
        const url = card.querySelector('a')?.href || ''
        const views = card.querySelector('[data-e2e="video-views"]')?.innerText || '0'
        const thumbnail = card.querySelector('img')?.src || ''
        reels.push({ url, thumbnail, views: views.replace(/[^0-9KMkbm.,]/g, ''), likes: '0', comments: '0', date: null })
      }
      return { full_name, profile_pic_url, is_verified, reels }
    }, MAX_REELS)

    if (data.reels.length === 0) {
      throw new Error('Nenhum vídeo encontrado no TikTok. Pode ser conta privada ou bloqueio de bot.')
    }

    const normalizedReels = data.reels.map(r => ({
      ...r,
      platform: 'tiktok',
      views: parseMetric(r.views),
      likes: 0,
      comments: 0,
    }))

    return {
      username,
      platform: 'tiktok',
      full_name: data.full_name,
      profile_pic_url: data.profile_pic_url,
      is_verified: data.is_verified,
      reels: normalizedReels,
    }
  } finally {
    if (browser) {
      await browser.close()
      console.log('[SCRAPER] Browser TikTok fechado.')
    }
  }
}

module.exports = { scrapeInstagramReels, scrapeTikTokReels }
