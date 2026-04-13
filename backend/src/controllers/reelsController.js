const { scrapeInstagramReels, scrapeTikTokReels } = require('../services/scraper')

const getReels = async (req, res, next) => {
  const { username } = req.params
  const { platform = 'instagram' } = req.query

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username é obrigatório' })
  }

  const clean = username.trim().replace(/^@/, '').toLowerCase()

  try {
    console.log(`[CONTROLLER] Buscando reels de @${clean} (${platform})`)
    let result;
    if (platform === 'tiktok') {
      result = await scrapeTikTokReels(clean)
    } else {
      result = await scrapeInstagramReels(clean)
    }
    
    res.json({ success: true, ...result })
  } catch (err) {
    const msg = err.message || ''
    
    // Para remover os erros vermelhos do console, retornamos 200 com success: false
    if (msg.includes('privado') || msg.includes('não encontrado')) {
      return res.status(200).json({ 
        success: false,
        error: msg, 
        code: 'NOT_FOUND' 
      })
    }
    
    if (msg.includes('bloqueio') || msg.includes('401') || msg.includes('403') || msg.includes('login') || msg.includes('sessionid')) {
      return res.status(200).json({ 
        success: false,
        error: 'O Instagram bloqueou o acesso.', 
        code: 'INSTAGRAM_BLOCKED' 
      })
    }
    
    next(err)
  }
}

module.exports = { getReels }
