(function () {
  'use strict';

  /* =========================================================================
   * 1. CONSTANTS & GAME DATA
   * ========================================================================= */

  const MAX_ROD_SLOTS = 10;
  const SESSION_TARGET_FISH = 30;
  const BITE_MIN_MS = 5000;
  const BITE_MAX_MS = 20000;
  const JERK_WINDOW_MS = 10000; // Cửa sổ giật 10s — đủ thời gian thả 10 Tym
  const JERK_TYM_NEEDED = 10; // Số Tym của chủ cần khi cá cắn để giật cá lên

  // Tỉ lệ câu trúng (Cơ chốt 25/11): gốc 50%, mỗi Tym của chủ cần +0,1%,
  // tối đa 95% (luôn còn khả năng hụt). Không hiện số % ra màn hình.
  const CATCH_BASE_PCT = 50;
  const CATCH_PER_LIKE_PCT = 0.1;
  const CATCH_MAX_PCT = 95;
  const SUMMARY_DURATION_MS = 10000;
  const COUNTDOWN_SECONDS = 5;
  const MAX_BANNER_COMMENTS = 10;
  const BOT_CATCH_RATE = 0.6;

  const FISH_SPECIES = [
    // Common (55%)
    { id: 'ca_ro', name: 'Cá rô', rarity: 'common', minPoints: 10, maxPoints: 20, minWeight: 0.2, maxWeight: 0.8, body: '#6b7c2e', belly: '#a8b06a', fin: '#4a5a1e', mark: 'spiny' },
    { id: 'ca_diec', name: 'Cá diếc', rarity: 'common', minPoints: 15, maxPoints: 30, minWeight: 0.3, maxWeight: 1.0, body: '#b8c4c8', belly: '#e8ecec', fin: '#8a9aa0', mark: null },
    // Uncommon (30%)
    { id: 'ca_chep', name: 'Cá chép', rarity: 'uncommon', minPoints: 50, maxPoints: 80, minWeight: 0.5, maxWeight: 3.0, body: '#e07830', belly: '#f2b06a', fin: '#b85a1e', mark: null },
    { id: 'ca_tre', name: 'Cá trê', rarity: 'uncommon', minPoints: 60, maxPoints: 100, minWeight: 0.5, maxWeight: 2.5, body: '#3a4a52', belly: '#6a7a82', fin: '#2a363c', mark: 'whiskers' },
    // Rare (12%)
    { id: 'ca_loc', name: 'Cá lóc', rarity: 'rare', minPoints: 200, maxPoints: 350, minWeight: 0.8, maxWeight: 4.0, body: '#5a6b3a', belly: '#9aa86a', fin: '#3e4a26', mark: 'spots' },
    { id: 'ca_vang', name: 'Cá vàng', rarity: 'rare', minPoints: 300, maxPoints: 500, minWeight: 0.3, maxWeight: 1.5, body: '#f2b01e', belly: '#ffe08a', fin: '#d89410', mark: null },
    // Huge (3%)
    { id: 'ca_ho', name: 'Cá hô', rarity: 'huge', minPoints: 1000, maxPoints: 1000, minWeight: 5.0, maxWeight: 20.0, body: '#5a7a94', belly: '#a8c0d0', fin: '#3e5a6e', mark: null },
    { id: 'ca_map_nuoc_ngot', name: 'Cá mập nước ngọt', rarity: 'huge', minPoints: 1000, maxPoints: 1000, minWeight: 8.0, maxWeight: 30.0, body: '#6a7a8a', belly: '#c8d4dc', fin: '#4a5a6a', mark: 'dorsal' }
  ];

  // Exact 26-gift real TikTok catalog
  const GIFT_CATALOG = [
    // 1 diamond (11)
    { name: 'GG', diamondCount: 1 },
    { name: 'Pop', diamondCount: 1 },
    { name: 'Yêu bạn', diamondCount: 1 },
    { name: 'Kem ốc quế', diamondCount: 1 },
    { name: 'Nhạc tự do', diamondCount: 1 },
    { name: 'Hiếu ý tôi chứ', diamondCount: 1 },
    { name: 'Nhạc xưa', diamondCount: 1 },
    { name: 'Quà phát sáng', diamondCount: 1 },
    { name: 'Bánh sinh nhật', diamondCount: 1 },
    { name: 'Vé hành trình', diamondCount: 1 },
    { name: 'LIVE FEST 26', diamondCount: 1 },
    // 2 diamonds (1)
    { name: 'Vé yêu cầu…', diamondCount: 2 },
    // 5 diamonds (5)
    { name: 'OK', diamondCount: 5 },
    { name: 'quả đào', diamondCount: 5 },
    { name: 'Trái bóng xoáy', diamondCount: 5 },
    { name: 'Bắn tim', diamondCount: 5 },
    { name: 'Hướng tình yêu', diamondCount: 5 },
    // 6 diamonds (1)
    { name: 'Ngón tay thần', diamondCount: 6 },
    // 10 diamonds (5)
    { name: 'Cỏ bốn lá', diamondCount: 10 },
    { name: 'Chó hoa mày…', diamondCount: 10 },
    { name: 'Nhắn tin mê', diamondCount: 10 },
    { name: 'Rosa', diamondCount: 10 },
    { name: 'Vòng cổ tình…', diamondCount: 10 },
    // 15 diamonds (2)
    { name: 'Hoàn hổ', diamondCount: 15 },
    { name: 'Chúc mừng N…', diamondCount: 15 },
    // 20 diamonds (1)
    { name: 'little kiss', diamondCount: 20 }
  ];

  const COUNTDOWN_LINES = [
    'Phiên sau bắt đầu sau 5 giây, thả tim số 1 nếu bạn đã sẵn sàng câu tiếp!',
    'Nhớ follow kênh và tặng quà để có mồi ngon, phiên sau cá to hơn nhé!',
    'Chuẩn bị tinh thần quăng cần nào cả nhà ơi, 5 giây nữa cá khủng lại về hồ!',
    'Ai muốn lên Top 1 phiên tới thì sẵn sàng thả tim thật nhanh khi cá cắn câu nhé!',
    'Cảm ơn mọi người đã chơi thật vui, phiên câu mới sắp mở ra ngay bây giờ!'
  ];

  // Câu MC nói khi rảnh (không có cá cắn / không ai câu) — nói liên tục,
  // mỗi câu cách nhau ít nhất IDLE_VOICE_MS, chỉ dùng lệnh thật trong game.
  const IDLE_LINES = [
    'Cả nhà thả tym để tăng tỉ lệ câu trúng nào!',
    'Ai chưa quăng cần thì bình luận câu ngay nhé!',
    'Cá to đang chờ dưới hồ đó cả nhà ơi!',
    'Thả tim nhiệt tình lên nào, cá khủng sắp cắn câu rồi!',
    'Bình luận câu để quăng cần, bình luận lên hoặc thả 10 tim để giật cá nhé!'
  ];
  const IDLE_VOICE_MS = 20000;

  /* =========================================================================
   * BẢN BÁN HÀNG — MC bán hàng + banner sản phẩm đang ghim (Cơ chốt 25/11)
   * Luật: phần bán hàng CHỈ đọc trong khoảng trống lúc rảnh, event game luôn
   * ưu tiên, KHÔNG chen ngang cá cắn / giật cần / lên cá. MC tự gọi tên +
   * giá SP đang ghim (đọc tự động từ message OEC khi Cơ ghim/đổi SP lúc
   * live) + đọc bình luận nhắc tới SP (tên SP hoặc từ khóa giá/mua/ship/
   * size/màu...). KHÔNG đọc "người đã xem SP" (TikTok không phát dữ liệu
   * đó — đã kết luận không làm được). Khi chưa có danh sách SP từ Cơ: dùng
   * tên + giá từ OEC + câu kêu gọi chung; các câu đã dùng ghi trong báo cáo
   * bàn giao để Cơ sửa sau.
   * ========================================================================= */

  // Từ khóa (đã bỏ dấu, thường) gợi ý bình luận đang hỏi về sản phẩm.
  const SALES_KEYWORDS = [
    'gia', 'bao nhieu', 'mua', 'ship', 'phi ship', 'size', 'mau', 'dat hang',
    'order', 'giam gia', 'khuyen mai', 'gio hang', 'san pham', 'con hang',
    'het hang', 'bao ship', 'tu van', 'chinh hang', 'sale', 'mua o dau',
    'mua nhu the nao', 'gia bao nhieu', 'bao tien'
  ];

  // Câu kêu gọi chung (dùng khi chưa có SP ghim, hoặc xen kẽ câu gọi tên SP).
  const SALES_GENERIC_CTA = [
    'Cả nhà nhớ ghé giỏ hàng xem đồ nhé, nhiều món hay lắm đó!',
    'Mua hàng thì bấm vào giỏ hàng ngay trong live này nhé cả nhà!',
    'Ai thích món nào thì bấm vào giỏ hàng để xem giá và mua ngay nhé!'
  ];

  // Câu kêu gọi khi đã có SP ghim — {name} + {price} điền lúc đọc.
  const SALES_PRODUCT_CTA = [
    'Sản phẩm đang ghim là {name}, giá {price} — mua ngay trong giỏ hàng nhé cả nhà!',
    '{name} chỉ {price} thôi cả nhà ơi, bấm vào giỏ hàng để mua ngay nhé!',
    'Ai thích {name} thì mua ngay trong giỏ hàng nhé, giá chỉ {price} thôi!'
  ];

  const SALES_REPLY_MIN_MS = 20000; // 2 câu trả lời SP cách nhau ít nhất 20s
  const SALES_CTA_MIN_MS = 60000; // câu kêu gọi SP cách nhau ít nhất 60s
  const SALES_REPLY_GAP_MS = 5000; // chỉ trả lời khi đã im tiếng 5s (khoảng trống)

  // Trạng thái bán hàng (riêng, không lẫn state game).
  const sales = {
    product: null, // { name, priceText, priceSpeech, productId, imageUrl }
    lastReplyAt: 0,
    lastCtaAt: 0,
    pendingLine: '', // câu báo SP mới ghim — chỉ đọc ở nhịp rảnh (tick)
    ctaIdx: 0
  };

  // Giá OEC về dạng chuỗi thô ("₫129.000" / "129000" / "") -> câu đọc tự nhiên.
  function priceToSpeech(priceText) {
    const raw = String(priceText || '').trim();
    if (!raw) return '';
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return raw;
    const n = Number(digits);
    if (!Number.isFinite(n) || n <= 0) return raw;
    if (n < 1000) return numberToVietnamese(n) + ' đồng';
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    if (n < 1000000) {
      return rest === 0
        ? numberToVietnamese(thousands) + ' nghìn đồng'
        : numberToVietnamese(thousands) + ' nghìn ' + numberToVietnamese(rest) + ' đồng';
    }
    const millions = Math.floor(n / 1000000);
    const remThousands = Math.floor((n % 1000000) / 1000);
    let out = numberToVietnamese(millions) + ' triệu';
    if (remThousands > 0) out += ' ' + numberToVietnamese(remThousands) + ' nghìn';
    return out + ' đồng';
  }

  function priceToDisplay(priceText) {
    const raw = String(priceText || '').trim();
    if (!raw) return '';
    if (/[₫đ]/i.test(raw)) return raw;
    const digits = raw.replace(/[^\d]/g, '');
    if (digits && Number(digits) > 0) return Number(digits).toLocaleString('vi-VN') + '₫';
    return raw;
  }

  function renderProductBanner() {
    if (!dom.productBannerText) return;
    const p = sales.product;
    if (p && p.name) {
      const price = priceToDisplay(p.priceText);
      dom.productBannerText.textContent = price
        ? '🛒 ' + p.name + ' — ' + price + ' · Mua ngay trong giỏ hàng!'
        : '🛒 ' + p.name + ' · Mua ngay trong giỏ hàng!';
      if (dom.productBanner) dom.productBanner.classList.add('has-product');
    } else {
      dom.productBannerText.textContent = '🛒 Chưa ghim sản phẩm nào — ghé giỏ hàng xem đồ nhé!';
      if (dom.productBanner) dom.productBanner.classList.remove('has-product');
    }
  }

  // Nhận SP đang ghim (từ event 'product' qua WS/Ably, hoặc từ status heartbeat).
  // Chỉ nhận khi có tên; rỗng thì giữ SP cũ (tránh banner nhấp nháy khi mất event).
  function handleProductEvent(data) {
    if (!data || typeof data !== 'object') return false;
    const name = String(data.name || data.title || '').trim();
    if (!name) return false;
    const priceText = String(data.price || data.priceText || '').trim();
    const changed = !sales.product || sales.product.name !== name || sales.product.priceText !== priceText;
    sales.product = {
      name,
      priceText,
      priceSpeech: priceToSpeech(priceText),
      productId: String(data.productId || ''),
      imageUrl: String(data.imageUrl || '')
    };
    renderProductBanner();
    if (changed) {
      // Báo SP mới — NHƯNG chỉ đọc ở nhịp rảnh (tick), không đọc ngay để
      // không chen ngang gameplay đang chạy.
      sales.pendingLine = priceText
        ? 'Sản phẩm mới ghim là ' + name + ', giá ' + sales.product.priceSpeech + ' — mua ngay trong giỏ hàng nhé cả nhà!'
        : 'Sản phẩm mới ghim là ' + name + ' — mua ngay trong giỏ hàng nhé cả nhà!';
    }
    return true;
  }

  // Bình luận có nhắc tới SP không? (tên SP hoặc từ khóa mua hàng)
  // Khớp theo TỪ (ranh giới từ), không khớp chuỗi con — 'gia' trong 'giật'
  // ('giat') không tính là hỏi giá (lỗi gặp 25/11: bot 'Ai giật hụt kìa'
  // bị nhận nhầm là hỏi SP). Cụm từ (có dấu cách) vẫn khớp chuỗi con.
  function isProductMention(text) {
    const norm = normalizeText(text);
    if (!norm) return false;
    const words = new Set(norm.split(/[^a-z0-9]+/).filter(Boolean));
    if (sales.product && sales.product.name) {
      const pname = normalizeText(sales.product.name);
      if (pname && norm.indexOf(pname) !== -1) return true;
      const nameWords = pname.split(' ').filter((w) => w.length >= 4);
      for (const w of nameWords) {
        if (words.has(w)) return true;
      }
    }
    for (const kw of SALES_KEYWORDS) {
      if (kw.indexOf(' ') === -1) {
        if (words.has(kw)) return true;
      } else if (norm.indexOf(kw) !== -1) {
        return true;
      }
    }
    return false;
  }

  function isSpeakingNow() {
    try {
      return Boolean(window.speechSynthesis && window.speechSynthesis.speaking);
    } catch (_e) { return false; }
  }

  function anyRodBiting() {
    return state.rods.some((r) => r.status === 'biting');
  }

  // Trả lời bình luận nhắc SP — CHỈ khi đủ khoảng trống thật: game đang chơi,
  // không có cần nào đang cắn, đã im tiếng 5s, không ai đang nói, cách câu
  // trả lời trước 20s. Không đủ điều kiện thì bỏ qua im lặng (không xếp hàng).
  function maybeReplyProductComment(username, text, options) {
    if (!state.started || state.paused || state.phase !== 'playing') return false;
    if (options && options.isBot) return false;
    if (!isProductMention(text)) return false;
    const now = Date.now();
    if (now - sales.lastReplyAt < SALES_REPLY_MIN_MS) return false;
    if (now - TTS.getLastSpeakAt() < SALES_REPLY_GAP_MS) return false;
    if (isSpeakingNow() || anyRodBiting()) return false;
    const p = sales.product;
    const line = p && p.name
      ? username + ' ơi, ' + p.name + ' giá ' + (p.priceSpeech || p.priceText) + ' nhé, bấm vào giỏ hàng để mua ngay!'
      : 'Cảm ơn ' + username + ' đã hỏi về sản phẩm nhé, ghé giỏ hàng xem chi tiết giúp mình nha!';
    if (!TTS.speak(line)) return false;
    sales.lastReplyAt = now;
    return true;
  }

  // Chọn câu nói ở nhịp rảnh (tick, sau 20s im tiếng): SP mới ghim trước,
  // rồi câu kêu gọi SP (tối đa 60s/lần), rồi câu game thường.
  function pickIdleLine(now) {
    if (sales.pendingLine) {
      const line = sales.pendingLine;
      sales.pendingLine = '';
      sales.lastCtaAt = now;
      return line;
    }
    const p = sales.product;
    if (p && p.name && now - sales.lastCtaAt >= SALES_CTA_MIN_MS) {
      const tpl = SALES_PRODUCT_CTA[sales.ctaIdx % SALES_PRODUCT_CTA.length];
      sales.ctaIdx += 1;
      sales.lastCtaAt = now;
      return tpl.replace('{name}', p.name).replace('{price}', p.priceSpeech || p.priceText || 'ưu đãi');
    }
    if ((!p || !p.name) && Math.random() < 0.25) {
      return SALES_GENERIC_CTA[Math.floor(Math.random() * SALES_GENERIC_CTA.length)];
    }
    return IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
  }

  // Màu áo riêng cho từng nhân vật ngồi câu (theo slot 0–9).
  const MINI_SHIRTS = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#c084fc', '#34d399', '#fb7185', '#f97316', '#22d3ee', '#e879f9'];

  const BOT_NAMES = [
    'Minh Quân', 'Thu Hà', 'Tuấn Anh', 'Ngọc Linh',
    'Hoàng Nam', 'Bảo Trâm', 'Đức Huy', 'Khánh Vy',
    'Quốc Bảo', 'Phương Thảo', 'Gia Huy', 'Thanh Trúc'
  ];

  const BOT_CHATTER = [
    'Hồ nay nhiều cá to quá!',
    'Chờ cá hô lên bờ nào!',
    'Ai giật hụt kìa haha',
    'Thả tim nhiệt tình lên mọi người!',
    'Cần này chắc dính cá chép đây',
    'Chúc cả nhà câu toàn cá khủng nhé!',
    'Nhanh tay giật kẻo chạy mất!'
  ];

  // 10 evenly spaced rod slots along the 1040x900 pond bank & generously staggered water depths
  const ROD_SLOTS = [
    { bankX: 78,  bankY: 302, bobberX: 82,  bobberY: 468 },
    { bankX: 176, bankY: 300, bobberX: 180, bobberY: 646 },
    { bankX: 274, bankY: 304, bobberX: 278, bobberY: 458 },
    { bankX: 372, bankY: 302, bobberX: 376, bobberY: 660 },
    { bankX: 470, bankY: 306, bobberX: 474, bobberY: 476 },
    { bankX: 568, bankY: 306, bobberX: 566, bobberY: 664 },
    { bankX: 666, bankY: 302, bobberX: 664, bobberY: 462 },
    { bankX: 764, bankY: 304, bobberX: 762, bobberY: 652 },
    { bankX: 862, bankY: 300, bobberX: 860, bobberY: 474 },
    { bankX: 960, bankY: 302, bobberX: 956, bobberY: 642 }
  ];

  /* =========================================================================
   * 2. PURE HELPER FUNCTIONS
   * ========================================================================= */

  function normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isCastCommand(text) {
    const norm = normalizeText(text);
    return norm === 'cau' || norm === 'cau ca' || norm === 'tha can';
  }

  // Lệnh giật cá: bình luận 'Lên' (hoặc 'Lên câu') khi cá đang cắn thì
  // giật cần lên ngay — như cũ. Ngoài ra còn có cách lên câu bằng 10 Tym
  // (thả tim đủ 10 cái khi cắn cũng tự giật lên).
  function isJerkCommand(text) {
    const norm = normalizeText(text);
    return norm === 'len' || norm === 'len cau';
  }

  function userKey(username) {
    return String(username || '').trim().toLowerCase();
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function formatWeight(w) {
    return Number(w).toFixed(1).replace(/\.0$/, '');
  }

  function numberToVietnamese(num) {
    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return 'không';

    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    function readHundreds(value, forceHundreds) {
      const h = Math.floor(value / 100);
      const t = Math.floor((value % 100) / 10);
      const u = value % 10;
      const parts = [];

      if (h > 0 || forceHundreds) {
        parts.push(digits[h] + ' trăm');
      }
      if (t === 0) {
        if (u > 0 && (h > 0 || forceHundreds)) {
          parts.push('linh ' + digits[u]);
        } else if (u > 0) {
          parts.push(digits[u]);
        }
      } else if (t === 1) {
        if (u === 0) {
          parts.push('mười');
        } else if (u === 5) {
          parts.push('mười lăm');
        } else {
          parts.push('mười ' + digits[u]);
        }
      } else {
        let str = digits[t] + ' mươi';
        if (u === 1) str += ' mốt';
        else if (u === 5) str += ' lăm';
        else if (u > 0) str += ' ' + digits[u];
        parts.push(str);
      }
      return parts.join(' ');
    }

    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    const groups = [];
    let rem = n;
    while (rem > 0) {
      groups.push(rem % 1000);
      rem = Math.floor(rem / 1000);
    }

    const result = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      if (g === 0) continue;
      const forceHundreds = i < groups.length - 1;
      const chunk = readHundreds(g, forceHundreds);
      if (chunk) {
        result.push(units[i] ? chunk + ' ' + units[i] : chunk);
      }
    }
    return result.join(' ').trim();
  }

  /**
   * Roll a fish according to boost tier ('bait', 'gold', or null).
   * `rOrRng` may be a fixed number in [0, 1) (controls rarity roll) or a function returning [0, 1).
   */
  function rollFish(boost, rOrRng) {
    let rRarity;
    let nextRand;
    if (typeof rOrRng === 'number') {
      rRarity = clamp(rOrRng, 0, 0.9999999);
      nextRand = Math.random;
    } else if (typeof rOrRng === 'function') {
      nextRand = rOrRng;
      rRarity = clamp(nextRand(), 0, 0.9999999);
    } else {
      nextRand = Math.random;
      rRarity = Math.random();
    }

    let rarity;
    if (boost === 'gold') {
      rarity = rRarity < 0.70 ? 'rare' : 'huge';
    } else if (boost === 'bait') {
      if (rRarity < 0.35) rarity = 'common';
      else if (rRarity < 0.70) rarity = 'uncommon';
      else if (rRarity < 0.95) rarity = 'rare';
      else rarity = 'huge';
    } else {
      if (rRarity < 0.55) rarity = 'common';
      else if (rRarity < 0.85) rarity = 'uncommon';
      else if (rRarity < 0.97) rarity = 'rare';
      else rarity = 'huge';
    }

    const pool = FISH_SPECIES.filter((f) => f.rarity === rarity);
    const idx = Math.min(pool.length - 1, Math.floor(clamp(nextRand(), 0, 0.9999999) * pool.length));
    const species = pool[idx];

    const rPts = clamp(nextRand(), 0, 0.9999999);
    const rWt = clamp(nextRand(), 0, 0.9999999);

    const points = species.minPoints === species.maxPoints
      ? species.minPoints
      : clamp(
          Math.floor(species.minPoints + rPts * (species.maxPoints - species.minPoints + 1)),
          species.minPoints,
          species.maxPoints
        );

    const rawWeight = species.minWeight + rWt * (species.maxWeight - species.minWeight);
    const weight = clamp(Math.round(rawWeight * 10) / 10, species.minWeight, species.maxWeight);

    return {
      id: species.id,
      name: species.name,
      rarity: species.rarity,
      points,
      weight
    };
  }

  function parseUrlParams(searchStr) {
    const params = new URLSearchParams(typeof searchStr === 'string' ? searchStr : (window.location ? window.location.search : ''));
    const liveRaw = params.get('live');
    const liveUser = liveRaw ? liveRaw.trim().replace(/^@/, '') : '';
    const ttsParam = params.get('tts');
    const musicParam = params.get('music');
    const cleanParam = params.get('clean');
    const obsParam = params.get('obs');

    return {
      liveUser,
      mode: liveUser ? 'live' : 'demo',
      ttsEnabled: ttsParam !== '0',
      musicEnabled: musicParam !== '0',
      cleanMode: cleanParam === '1',
      // ?obs=1: chế độ OBS — tự bấm ▶ Bắt đầu khi mở link (quyết định 4).
      obsMode: obsParam === '1'
    };
  }

  /* =========================================================================
   * 3. ORIGINAL WEB AUDIO ENGINE (NO COPYRIGHTED AUDIO)
   * ========================================================================= */

  const AudioEngine = (function () {
    let ctx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let enabled = true;
    let volume = 0.55;
    let ducked = false;
    let playing = false;
    let stepIndex = 0;
    let timerId = null;

    // C-major pentatonic countryside melody (100 BPM -> eighth note = 300ms)
    const BPM = 100;
    const STEP_MS = Math.round((60 / BPM / 2) * 1000);
    const MELODY = [
      261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66,
      329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66, 261.63,
      392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 329.63,
      293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 0,      261.63
    ];
    const BASS = [
      130.81, 0, 0, 0, 164.81, 0, 0, 0,
      196.00, 0, 0, 0, 130.81, 0, 0, 0,
      196.00, 0, 0, 0, 220.00, 0, 0, 0,
      146.83, 0, 0, 0, 130.81, 0, 0, 0
    ];

    function getAudioCtxClass() {
      return window.AudioContext || window.webkitAudioContext || null;
    }

    function ensureContext() {
      const AudioCtx = getAudioCtxClass();
      if (!AudioCtx) return false;
      if (!ctx) {
        try {
          ctx = new AudioCtx();
          masterGain = ctx.createGain();
          musicGain = ctx.createGain();
          sfxGain = ctx.createGain();
          musicGain.connect(masterGain);
          sfxGain.connect(masterGain);
          masterGain.connect(ctx.destination);
          applyGains();
        } catch (_e) {
          ctx = null;
          return false;
        }
      }
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        try { ctx.resume(); } catch (_e) { /* noop */ }
      }
      return Boolean(ctx);
    }

    function applyGains() {
      if (!ctx || !masterGain || !musicGain || !sfxGain) return;
      const now = ctx.currentTime || 0;
      const effectiveMusic = enabled ? volume * (ducked ? 0.25 : 0.45) : 0;
      const effectiveSfx = enabled ? volume * 0.85 : 0;
      try {
        masterGain.gain.setValueAtTime(1, now);
        musicGain.gain.setValueAtTime(effectiveMusic, now);
        sfxGain.gain.setValueAtTime(effectiveSfx, now);
      } catch (_e) { /* noop */ }
    }

    function playTone(freq, durationSec, type, targetGain, peakGain, startOffsetSec) {
      if (!ctx || !targetGain || freq <= 0) return;
      const now = (ctx.currentTime || 0) + (startOffsetSec || 0);
      try {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, now);
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(peakGain, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
        osc.connect(env);
        env.connect(targetGain);
        osc.start(now);
        osc.stop(now + durationSec + 0.02);
      } catch (_e) { /* noop */ }
    }

    function tickMusic() {
      if (!playing || !enabled || !ctx) return;
      const mFreq = MELODY[stepIndex % MELODY.length];
      const bFreq = BASS[stepIndex % BASS.length];
      if (mFreq > 0) playTone(mFreq, 0.27, 'triangle', musicGain, 0.22, 0);
      if (bFreq > 0) playTone(bFreq, 0.65, 'sine', musicGain, 0.26, 0);
      stepIndex = (stepIndex + 1) % MELODY.length;
    }

    function startMusic() {
      if (!enabled) return false;
      ensureContext();
      if (playing) return true;
      playing = true;
      applyGains();
      if (ctx) tickMusic();
      timerId = setInterval(tickMusic, STEP_MS);
      return true;
    }

    function stopMusic() {
      playing = false;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      applyGains();
    }

    function setEnabled(flag) {
      enabled = Boolean(flag);
      if (!enabled) {
        stopMusic();
      } else {
        applyGains();
      }
    }

    function setVolume(v) {
      volume = clamp(Number(v), 0, 1);
      applyGains();
      return volume;
    }

    function setDucking(isDucked) {
      ducked = Boolean(isDucked);
      applyGains();
    }

    function playSplash() {
      if (!enabled || !ensureContext()) return;
      const now = ctx.currentTime || 0;
      try {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
        env.gain.setValueAtTime(0.28, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(env);
        env.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (_e) { /* noop */ }
    }

    function playReel() {
      if (!enabled || !ensureContext()) return;
      // 3 rising notes on successful jerk
      playTone(392.00, 0.12, 'triangle', sfxGain, 0.26, 0);
      playTone(493.88, 0.12, 'triangle', sfxGain, 0.28, 0.09);
      playTone(587.33, 0.18, 'triangle', sfxGain, 0.30, 0.18);
    }

    function playFanfare() {
      if (!enabled || !ensureContext()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        playTone(f, 0.28, 'triangle', sfxGain, 0.32, idx * 0.09);
      });
    }

    function playEscape() {
      if (!enabled || !ensureContext()) return;
      playTone(261.63, 0.18, 'sine', sfxGain, 0.24, 0);
      playTone(196.00, 0.26, 'sine', sfxGain, 0.24, 0.14);
    }

    return {
      startMusic,
      stopMusic,
      setEnabled,
      setVolume,
      setDucking,
      playSplash,
      playReel,
      playFanfare,
      playEscape,
      isPlaying: () => playing,
      isEnabled: () => enabled,
      isDucked: () => ducked,
      getVolume: () => volume
    };
  })();

  /* =========================================================================
   * 4. TTS ENGINE (Web Speech API, vi-VN)
   * ========================================================================= */

  const TTS = (function () {
    let enabled = true;
    let lastSpoken = '';
    let lastSpeakAt = 0;
    let duckTimer = null;
    const spokenHistory = [];

    function isAvailable() {
      return typeof window !== 'undefined' &&
        typeof window.speechSynthesis !== 'undefined' &&
        window.speechSynthesis !== null &&
        typeof window.speechSynthesis.speak === 'function';
    }

    function clearDuck() {
      if (duckTimer) {
        clearTimeout(duckTimer);
        duckTimer = null;
      }
      AudioEngine.setDucking(false);
    }

    function speak(text, options) {
      if (!text || typeof text !== 'string') return false;
      const clean = text.trim();
      if (!clean) return false;
      lastSpoken = clean;
      if (!enabled) return false;

      spokenHistory.push(clean);
      if (spokenHistory.length > 50) spokenHistory.shift();

      if (!isAvailable()) return false;

      const opts = options || {};
      try {
        if (opts.interrupt !== false && typeof window.speechSynthesis.cancel === 'function') {
          window.speechSynthesis.cancel();
        }
        const Utterance = window.SpeechSynthesisUtterance || function (t) {
          this.text = t;
          this.lang = 'vi-VN';
          this.rate = 1;
          this.pitch = 1;
          this.volume = 1;
        };
        const utter = new Utterance(clean);
        utter.lang = 'vi-VN';
        utter.rate = opts.rate || 1.05;
        utter.pitch = opts.pitch || 1.05;
        utter.volume = opts.volume || 1.0;

        AudioEngine.setDucking(true);
        if (duckTimer) clearTimeout(duckTimer);
        duckTimer = setTimeout(clearDuck, Math.max(2500, clean.length * 95));

        utter.onend = clearDuck;
        utter.onerror = clearDuck;

        window.speechSynthesis.speak(utter);
        lastSpeakAt = Date.now();
        return true;
      } catch (_e) {
        clearDuck();
        return false;
      }
    }

    function repeatLast() {
      if (!lastSpoken) return false;
      return speak(lastSpoken, { interrupt: true });
    }

    function stop() {
      clearDuck();
      if (isAvailable() && typeof window.speechSynthesis.cancel === 'function') {
        try { window.speechSynthesis.cancel(); } catch (_e) { /* noop */ }
      }
    }

    function setEnabled(flag) {
      enabled = Boolean(flag);
      if (!enabled) stop();
    }

    return {
      speak,
      repeatLast,
      stop,
      setEnabled,
      isEnabled: () => enabled,
      getLastSpoken: () => lastSpoken,
      getLastSpeakAt: () => lastSpeakAt,
      getHistory: () => spokenHistory.slice()
    };
  })();

  /* =========================================================================
   * 5. CONFETTI CANVAS ENGINE
   * ========================================================================= */

  const Confetti = (function () {
    let canvas = null;
    let ctx = null;
    let particles = [];
    const COLORS = ['#ffd23f', '#7dd3fc', '#34d399', '#fb7185', '#f97316', '#ffffff'];

    function init(el) {
      canvas = el;
      if (canvas && typeof canvas.getContext === 'function') {
        try { ctx = canvas.getContext('2d'); } catch (_e) { ctx = null; }
      }
    }

    function burst(count) {
      const n = count || 90;
      for (let i = 0; i < n; i++) {
        particles.push({
          x: 540 + (Math.random() - 0.5) * 680,
          y: 260 + (Math.random() - 0.5) * 260,
          vx: (Math.random() - 0.5) * 12,
          vy: -4 - Math.random() * 10,
          size: 7 + Math.random() * 9,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.22,
          life: 1,
          decay: 0.007 + Math.random() * 0.006
        });
      }
    }

    function updateAndDraw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (particles.length === 0) return;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.vx *= 0.99;
        p.rot += p.vrot;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > canvas.height + 40) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        ctx.restore();
      }
    }

    return {
      init,
      burst,
      updateAndDraw,
      count: () => particles.length
    };
  })();

  /* =========================================================================
   * 6. GAME STATE & DOM REFERENCES
   * ========================================================================= */

  const config = parseUrlParams();

  const state = {
    started: false,
    paused: false,
    pauseStartedAt: 0,
    phase: 'idle', // 'idle' | 'playing' | 'summary' | 'countdown'
    mode: config.mode, // 'demo' | 'live'
    liveUser: config.liveUser,
    obsMode: config.obsMode,
    sessionNumber: 1,
    sessionCaught: 0,
    sessionEscaped: 0,
    rods: [], // active rods (max 10)
    playerScores: Object.create(null), // key -> { username, points, catches }
    giftScores: Object.create(null),   // key -> { username, diamonds, count }
    pendingBoosts: Object.create(null), // key -> 'bait' | 'gold'
    biggestFish: null, // { username, name, rarity, weight, points }
    caughtFlash: null, // { speciesId, x, y, until } — just-caught fish shown big for ~2.5s
    comments: [], // latest 10 items, newest at index 0
    prevTop3Keys: [],
    fishermanMood: 'waiting', // 'waiting' | 'reeling' | 'excited' | 'disappointed'
    fishermanMoodUntil: 0,
    // Ably (trang Pages nhận event qua Ably, không dùng WebSocket nội bộ)
    ably: null,
    ablyChannel: null,
    ablyConnected: false,
    ablyAttachedOnce: false,
    pageLoadTs: Date.now(), // lọc event cũ khi (re)subscribe
    seenMsgIds: new Set(), // chống trùng khi Ably replay sau reconnect
    summaryRemainingMs: 0,
    countdownRemaining: COUNTDOWN_SECONDS,
    lastBotCastAt: 0,
    nextBotCastDelayMs: 2500,
    lastBotGiftAt: 0,
    nextBotGiftDelayMs: 48000,
    lastBotChatAt: 0,
    stats: {
      botBites: 0,
      botCatches: 0
    }
  };

  // Ambient pond fish: each swims as a DETAILED fish of one of the 8 species
  // (Cơ 25/11: thêm hình cá thật/vẽ vào) — huge species swim bigger.
  const fishShadows = Array.from({ length: 9 }, (_, i) => {
    const species = FISH_SPECIES[i % FISH_SPECIES.length];
    const sizeScale = species.rarity === 'huge' ? 1.5 : species.rarity === 'rare' ? 1.15 : 1;
    return {
      x: 80 + i * 115,
      y: 385 + (i % 5) * 105,
      speed: (0.55 + (i % 3) * 0.3) * (i % 2 === 0 ? 1 : -1),
      size: (24 + (i % 3) * 10) * sizeScale,
      phase: i * 1.1,
      species
    };
  });

  const dom = {};

  function cacheDom() {
    dom.stage = document.getElementById('stage');
    dom.viewportFit = document.getElementById('viewportFit');
    dom.modeBadge = document.getElementById('modeBadge');
    dom.sessionProgress = document.getElementById('sessionProgress');
    dom.giftBoard = document.getElementById('giftBoard');
    dom.giftTopList = document.getElementById('giftTopList');
    dom.commentList = document.getElementById('commentList');
    dom.pondCanvas = document.getElementById('pondCanvas');
    dom.biteAlert = document.getElementById('biteAlert');
    dom.toastArea = document.getElementById('toastArea');
    dom.giftBanner = document.getElementById('giftBanner');
    dom.productBanner = document.getElementById('productBanner');
    dom.productBannerText = document.getElementById('productBannerText');
    dom.statRods = document.getElementById('statRods');
    dom.statCaught = document.getElementById('statCaught');
    dom.statEscaped = document.getElementById('statEscaped');
    dom.biggestFishContent = document.getElementById('biggestFishContent');
    dom.top3Board = document.getElementById('top3Board');
    dom.top4to8Board = document.getElementById('top4to8Board');
    dom.giftSuggestionBox = document.getElementById('giftSuggestionBox');
    dom.confettiCanvas = document.getElementById('confettiCanvas');
    dom.pauseBadge = document.getElementById('pauseBadge');
    dom.summaryOverlay = document.getElementById('summaryOverlay');
    dom.summarySessionLabel = document.getElementById('summarySessionLabel');
    dom.summaryHighlights = document.getElementById('summaryHighlights');
    dom.summaryTopFishers = document.getElementById('summaryTopFishers');
    dom.summaryTopGifters = document.getElementById('summaryTopGifters');
    dom.summaryBiggestFish = document.getElementById('summaryBiggestFish');
    dom.summaryTimerFill = document.getElementById('summaryTimerFill');
    dom.countdownOverlay = document.getElementById('countdownOverlay');
    dom.countdownNumber = document.getElementById('countdownNumber');
    dom.countdownSpeech = document.getElementById('countdownSpeech');
    dom.startOverlay = document.getElementById('startOverlay');
    dom.startBtn = document.getElementById('startBtn');
    dom.startModeHint = document.getElementById('startModeHint');
  }

  /* =========================================================================
   * 7. STAGE SCALING (FIT 1080x1920 TO ANY VIEWPORT)
   * ========================================================================= */

  function scaleStage() {
    if (!dom.stage) return;
    const vw = window.innerWidth || 1080;
    const vh = window.innerHeight || 1920;
    // Viewport ngắn hơn 9:16 (Chrome điện thoại còn thanh tab/địa chỉ/điều hướng,
    // hoặc cửa sổ PC không fullscreen): thu ngắn chiều cao stage để scale theo
    // chiều rộng — game lấp đầy viewport.
    // V4 chỉ thu ngắn stage, giữ ao 900px -> bảng dưới (feed) bị co về ~0 và biến mất
    // trên điện thoại (Cơ báo 25/11 17:24). V4.1: ao co theo chiều cao còn lại (giữ
    // đúng tỉ lệ 1040:900, không méo hình), feed luôn giữ tối thiểu 280px — nhưng
    // ao chỉ còn ~67% bề rộng trên viewport ngắn (Cơ báo "bé quá" 25/11 22:36,
    // viewport ~1080x1407: ao 724px).
    // V4.5: ao LUÔN giữ đúng kích thước gốc 1040x900 (to nhất có thể); stage cao
    // thành FIXED_REST + 900 + FEED_MIN = 1680 và scale toàn cục thu nhỏ stage
    // vừa viewport. Ao trên màn hình: 1080x1407 -> 871px (was 724px, +20%),
    // 1080x1080 -> 669px (was 394px). Đồng thời sửa lỗi v4.1: ở tỉ lệ 1.56-1.78
    // ao từng bị kéo rộng quá 1040 và cắt 2 bên.
    // Các phần cố định ngoài ao và feed (header 64 + stats 106 + top3 186 + gift 64
    // + padding 28 + gap 50) ≈ 500px.
    // BẢN BÁN HÀNG: + banner sản phẩm ghim 52px + gap 10px = 562px.
    const FIXED_REST = 562;
    const FEED_MIN = 280;
    const POND_W = 1040;
    const POND_H = 900;
    let stageH = 1920;
    if (vh / vw < 1920 / 1080) {
      const natural = Math.floor((vh * 1080) / vw);
      stageH = Math.max(FIXED_REST + POND_H + FEED_MIN, natural);
      const pondH = POND_H;
      const pondW = POND_W;
      dom.stage.style.height = stageH + 'px';
      if (dom.pondCanvas) {
        dom.pondCanvas.style.width = pondW + 'px';
        dom.pondCanvas.style.height = pondH + 'px';
        const pondStageEl = dom.pondCanvas.parentElement;
        if (pondStageEl) {
          pondStageEl.style.width = pondW + 'px';
          pondStageEl.style.height = pondH + 'px';
        }
      }
    } else {
      dom.stage.style.height = '';
      if (dom.pondCanvas) {
        dom.pondCanvas.style.width = '';
        dom.pondCanvas.style.height = '';
        const pondStageEl = dom.pondCanvas.parentElement;
        if (pondStageEl) {
          pondStageEl.style.width = '';
          pondStageEl.style.height = '';
        }
      }
    }
    const scale = Math.min(vw / 1080, vh / stageH);
    dom.stage.style.transform = `scale(${scale})`;
  }

  /* =========================================================================
   * 8. RENDERING — BANNER, BOARDS, STATS, TOASTS
   * ========================================================================= */

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSortedFishers() {
    return Object.values(state.playerScores)
      .filter((p) => p.points > 0)
      .sort((a, b) => (b.points - a.points) || (b.catches - a.catches) || a.username.localeCompare(b.username));
  }

  function getSortedGifters() {
    return Object.values(state.giftScores)
      .filter((g) => g.diamonds > 0)
      .sort((a, b) => (b.diamonds - a.diamonds) || (b.count - a.count) || a.username.localeCompare(b.username));
  }

  /**
   * Single source of truth for rendering "🎁 Top tặng quà" (top of banner)
   * using the exact same `state.giftScores` store as end-of-session honors.
   */
  function renderGiftBoard() {
    if (!dom.giftTopList) return;
    const topGifters = getSortedGifters().slice(0, 3);
    if (topGifters.length === 0) {
      dom.giftTopList.innerHTML = '<span class="gift-empty">Chưa có quà tặng trong phiên</span>';
      return;
    }
    dom.giftTopList.innerHTML = topGifters
      .map((g, idx) => {
        const rank = idx + 1;
        const prefix = rank === 1 ? '👑 ' : `#${rank} `;
        const avatarHtml = g.avatar
          ? `<img src="${escapeHtml(g.avatar)}" class="gift-avatar" alt="">`
          : `<span class="gift-avatar-fallback">${escapeHtml((g.username || '?').slice(0, 1))}</span>`;
        return `<span class="gift-leader-pill rank-${rank}">${prefix}${avatarHtml}${escapeHtml(g.username)} <span class="gift-leader-diamonds">${g.diamonds}💎</span> <span class="gift-leader-count">• ${g.count} quà</span></span>`;
      })
      .join('');
  }

  function pushComment(entry) {
    state.comments.unshift({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      username: entry.username || 'Khán giả',
      text: entry.text || '',
      type: entry.type || 'chat', // 'chat' | 'catch' | 'gift' | 'escape'
      badge: entry.badge || ''
    });
    if (state.comments.length > MAX_BANNER_COMMENTS) {
      state.comments.length = MAX_BANNER_COMMENTS;
    }
    renderComments();
  }

  function renderComments() {
    if (!dom.commentList) return;
    if (state.comments.length === 0) {
      dom.commentList.innerHTML = '<li class="comment-row comment-waiting">Đang chờ bình luận…</li>';
      return;
    }
    dom.commentList.innerHTML = state.comments
      .map((c, idx) => {
        const enterCls = idx === 0 ? ' comment-enter' : '';
        const typeCls = c.type ? ` type-${c.type}` : '';
        let badgeHtml = '';
        if (c.type === 'catch') {
          badgeHtml = `<span class="comment-badge badge-catch">${escapeHtml(c.badge || '🎣 CÂU ĐƯỢC')}</span>`;
        } else if (c.type === 'gift') {
          badgeHtml = `<span class="comment-badge badge-gift">${escapeHtml(c.badge || '🎁 QUÀ TẶNG')}</span>`;
        } else if (c.type === 'escape') {
          badgeHtml = `<span class="comment-badge badge-escape">${escapeHtml(c.badge || '💨 CHẠY MẤT')}</span>`;
        }
        const userHtml = c.type === 'gift'
          ? ''
          : `<span class="comment-user">${escapeHtml(c.username)}:</span>`;
        return `<li class="comment-row${typeCls}${enterCls}">${badgeHtml}${userHtml}<span class="comment-text">${escapeHtml(c.text)}</span></li>`;
      })
      .join('');
  }

  function renderStats() {
    if (dom.statRods) dom.statRods.textContent = `${state.rods.length}/${MAX_ROD_SLOTS}`;
    if (dom.statCaught) dom.statCaught.textContent = `${state.sessionCaught}/${SESSION_TARGET_FISH}`;
    if (dom.statEscaped) dom.statEscaped.textContent = String(state.sessionEscaped);
    if (dom.sessionProgress) {
      dom.sessionProgress.textContent = `Phiên #${state.sessionNumber} · ${state.sessionCaught}/${SESSION_TARGET_FISH} cá`;
    }
  }

  function renderBiggestFish() {
    if (!dom.biggestFishContent) return;
    if (!state.biggestFish) {
      dom.biggestFishContent.className = 'biggest-fish-value waiting';
      dom.biggestFishContent.textContent = 'Đang chờ cao thủ câu con cá đầu tiên…';
      return;
    }
    const bf = state.biggestFish;
    dom.biggestFishContent.className = 'biggest-fish-value';
    dom.biggestFishContent.textContent = `👑 ${bf.username} — ${bf.name} ${formatWeight(bf.weight)}kg · ${bf.points}đ`;
  }

  function renderLeaderboards() {
    const sorted = getSortedFishers();
    const top3 = sorted.slice(0, 3);
    const top4to8 = sorted.slice(3, 8);

    const newTop3Keys = top3.map((p) => userKey(p.username));
    const newlyEntered = new Set(newTop3Keys.filter((k) => !state.prevTop3Keys.includes(k)));
    state.prevTop3Keys = newTop3Keys;

    if (dom.top3Board) {
      if (top3.length === 0) {
        dom.top3Board.innerHTML = '<div class="top3-empty">Chưa có cần thủ nào ghi điểm — quăng cần ngay!</div>';
      } else {
        const medals = ['👑', '🥈', '🥉'];
        dom.top3Board.innerHTML = top3
          .map((p, idx) => {
            const rank = idx + 1;
            const flashCls = newlyEntered.has(userKey(p.username)) ? ' flash-top3' : '';
            return `
              <div class="top3-card rank-${rank}${flashCls}" data-rank="${rank}">
                <div class="top3-rank-badge">${medals[idx]} HẠNG ${rank}</div>
                <div class="top3-name">${escapeHtml(p.username)}</div>
                <div class="top3-points">${p.points.toLocaleString('vi-VN')}đ</div>
                <div class="top3-meta">${p.catches} con cá</div>
              </div>
            `;
          })
          .join('');
      }
    }

    if (dom.top4to8Board) {
      if (top4to8.length === 0) {
        dom.top4to8Board.innerHTML = sorted.length === 0
          ? ''
          : '<div class="lb-empty-sub">Các hạng 4–8 sẽ hiện khi có thêm cần thủ ghi điểm…</div>';
      } else {
        dom.top4to8Board.innerHTML = top4to8
          .map((p, idx) => {
            const rank = idx + 4;
            return `
              <div class="lb-row" data-rank="${rank}">
                <div class="lb-row-left">
                  <span class="lb-rank">${rank}</span>
                  <span class="lb-name">${escapeHtml(p.username)}</span>
                </div>
                <div class="lb-row-right">
                  <span class="lb-catches">${p.catches} cá</span>
                  <span class="lb-points">${p.points.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  function renderBiteAlert() {
    if (!dom.biteAlert) return;
    const bitingRods = state.rods.filter((r) => r.status === 'biting');
    if (bitingRods.length === 0 || state.phase !== 'playing') {
      dom.biteAlert.classList.add('hidden');
      dom.biteAlert.textContent = '';
      return;
    }
    const latest = bitingRods[bitingRods.length - 1];
    const jerkProgress = Math.min(JERK_TYM_NEEDED, Math.max(0, (latest.likeBonus || 0) - (latest.bonusAtBite || 0)));
    dom.biteAlert.textContent = `🐟 CÁ CẮN CÂU! ${latest.username} gõ "lên" hoặc thả tim (${jerkProgress}/10 Tym) để giật!`;
    dom.biteAlert.classList.remove('hidden');
  }

  function showToast(message, variant) {
    if (!dom.toastArea) return;
    const el = document.createElement('div');
    el.className = 'toast-pill' + (variant ? ` ${variant}` : '');
    el.textContent = message;
    dom.toastArea.appendChild(el);
    while (dom.toastArea.children.length > 2) {
      dom.toastArea.removeChild(dom.toastArea.firstChild);
    }
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, variant === 'huge' ? 4500 : 3000);
  }

  // Banner quà nổi bật: avatar + tên + quà + xu + ưu đãi, hiện 5 giây.
  let giftBannerTimer = null;
  function showGiftBanner(info) {
    if (!dom.giftBanner || !info) return;
    const qty = info.repeatCount > 1 ? ` ×${info.repeatCount}` : '';
    const avatarHtml = info.avatar
      ? `<img src="${escapeHtml(info.avatar)}" class="gift-banner-avatar" alt="">`
      : `<span class="gift-banner-avatar-fallback">🎁</span>`;
    dom.giftBanner.innerHTML = `${avatarHtml}<div class="gift-banner-text"><div class="gift-banner-line"><strong>${escapeHtml(info.username)}</strong> đã tặng <strong>${escapeHtml(info.giftName)}${qty}</strong> · ${info.diamondCount}💎</div><div class="gift-banner-perk">${escapeHtml(info.perkText || '')}</div></div>`;
    dom.giftBanner.classList.remove('hidden');
    if (giftBannerTimer) clearTimeout(giftBannerTimer);
    giftBannerTimer = setTimeout(() => {
      if (dom.giftBanner) dom.giftBanner.classList.add('hidden');
    }, 5000);
  }

  function updateModeBadge(text, isLive) {
    if (!dom.modeBadge) return;
    dom.modeBadge.textContent = text;
    dom.modeBadge.classList.toggle('live', Boolean(isLive));
  }

  /* =========================================================================
   * 9. CORE FISHING LOGIC
   * ========================================================================= */

  function findRodByUser(username) {
    const key = userKey(username);
    return state.rods.find((r) => r.key === key) || null;
  }

  function findFreeSlot() {
    const used = new Set(state.rods.map((r) => r.slot));
    for (let i = 0; i < MAX_ROD_SLOTS; i++) {
      if (!used.has(i)) return i;
    }
    return -1;
  }

  function setFishermanMood(mood, durationMs) {
    state.fishermanMood = mood;
    state.fishermanMoodUntil = durationMs ? Date.now() + durationMs : 0;
  }

  function castRod(username, options) {
    const cleanName = String(username || '').trim();
    if (!cleanName) return null;
    const opts = options || {};
    if (state.phase !== 'playing' && !opts.force) return null;

    const key = userKey(cleanName);
    if (findRodByUser(cleanName)) {
      return null; // Each viewer has max 1 active rod
    }

    const slot = findFreeSlot();
    if (slot === -1) {
      return null; // Max 10 visible slots full
    }

    const now = typeof opts.now === 'number' ? opts.now : Date.now();
    const waitMs = typeof opts.waitMs === 'number'
      ? opts.waitMs
      : BITE_MIN_MS + Math.floor(Math.random() * (BITE_MAX_MS - BITE_MIN_MS + 1));

    const pendingBoost = state.pendingBoosts[key] || null;
    if (pendingBoost) {
      delete state.pendingBoosts[key];
    }

    const rod = {
      key,
      username: cleanName,
      slot,
      status: 'waiting', // 'waiting' | 'biting'
      castAt: now,
      biteScheduledAt: now + waitMs,
      biteAt: 0,
      biteDeadline: 0,
      boost: opts.boost || pendingBoost || null,
      isBot: Boolean(opts.isBot),
      botJerkAt: 0,
      likeBonus: 0, // số Tym của chủ cần từ lúc quăng (mỗi Tym +0,1% tỉ lệ trúng)
      bonusAtBite: 0 // likeBonus lúc cá cắn — Tym trước khi cắn chỉ tăng %, không tính vào 10 Tym
    };

    state.rods.push(rod);
    // MC đọc tên người chơi khi quăng cần (chỉ người thật, bot không nói).
    if (!rod.isBot) TTS.speak(`${cleanName} đã quăng cần!`);
    renderStats();
    return rod;
  }

  function triggerBite(usernameOrRod, nowOverride) {
    const rod = typeof usernameOrRod === 'string'
      ? findRodByUser(usernameOrRod)
      : usernameOrRod;
    if (!rod || rod.status !== 'waiting') return false;

    const now = typeof nowOverride === 'number' ? nowOverride : Date.now();
    rod.status = 'biting';
    rod.biteAt = now;
    rod.biteDeadline = now + JERK_WINDOW_MS;
    rod.bonusAtBite = rod.likeBonus || 0;

    // Schedule bot reaction (~60% catch rate)
    if (rod.isBot) {
      state.stats.botBites += 1;
      if (Math.random() < BOT_CATCH_RATE) {
        rod.botJerkAt = now + 550 + Math.floor(Math.random() * 1700);
      } else {
        rod.botJerkAt = 0; // Misses the 10s window -> fish escapes
      }
    }

    setFishermanMood('reeling', 0);
    AudioEngine.playSplash();
    renderBiteAlert();
    TTS.speak(`Cá cắn câu! ${rod.username} bình luận lên hoặc thả 10 tim để giật cần lên!`);
    return true;
  }

  function escapeFish(rod) {
    if (!rod) return false;
    const idx = state.rods.indexOf(rod);
    if (idx !== -1) state.rods.splice(idx, 1);

    // Boost is consumed ONLY after a catch — preserve if escaped
    if (rod.boost) {
      const existing = state.pendingBoosts[rod.key];
      if (existing !== 'gold') {
        state.pendingBoosts[rod.key] = rod.boost;
      }
    }

    state.sessionEscaped += 1;
    setFishermanMood('disappointed', 2200);
    AudioEngine.playEscape();

    pushComment({
      username: rod.username,
      type: 'escape',
      badge: '💨 CHẠY MẤT',
      text: '💨 cá chạy mất rồi!'
    });

    renderStats();
    renderBiteAlert();
    TTS.speak(`Tiếc quá, cá của ${rod.username} chạy mất rồi!`);
    return true;
  }

  function jerkRod(username, options) {
    const opts = options || {};
    const rod = findRodByUser(username);
    if (!rod) return { ok: false, reason: 'no_rod' };

    // Jerking while waiting does nothing and keeps rod in water
    if (rod.status === 'waiting') {
      return { ok: false, reason: 'waiting' };
    }

    const now = typeof opts.now === 'number' ? opts.now : Date.now();
    // Late jerk beyond 10-second window -> fish escapes
    if (now - rod.biteAt > JERK_WINDOW_MS) {
      escapeFish(rod);
      return { ok: false, caught: false, escaped: true, reason: 'late' };
    }

    // Tỉ lệ trúng: gốc 50% + 0,1% mỗi Tym chủ cần (tối đa 95%).
    // Giật hụt -> cá chạy mất như giật trễ.
    // Bot giữ kiểu cũ: giật kịp trong 10s là trúng (~60% do BOT_CATCH_RATE) — tỉ lệ hụt
    // chỉ áp cho người chơi thật, tránh bot chạy mất quá nhiều làm game im ắng.
    const rngFn = typeof opts.rng === 'function' ? opts.rng : Math.random;
    if (!rod.isBot) {
      const catchChance = Math.min(CATCH_BASE_PCT + CATCH_PER_LIKE_PCT * (rod.likeBonus || 0), CATCH_MAX_PCT);
      if (rngFn() * 100 >= catchChance) {
        escapeFish(rod);
        return { ok: false, caught: false, escaped: true, reason: 'miss', chance: catchChance };
      }
    }

    // Successful catch!
    const fish = rollFish(rod.boost, opts.rng);
    const usedBoost = rod.boost;
    rod.boost = null; // Consumed after one catch

    const idx = state.rods.indexOf(rod);
    if (idx !== -1) state.rods.splice(idx, 1);

    if (rod.isBot) {
      state.stats.botCatches += 1;
    }

    // Update player score (points come ONLY from caught fish)
    if (!state.playerScores[rod.key]) {
      state.playerScores[rod.key] = { username: rod.username, points: 0, catches: 0 };
    }
    state.playerScores[rod.key].username = rod.username;
    state.playerScores[rod.key].points += fish.points;
    state.playerScores[rod.key].catches += 1;

    state.sessionCaught += 1;

    // Show the caught fish big above the water for ~2.5s.
    // NOTE: rod.slot is an INDEX into ROD_SLOTS (not the entry) — resolve it
    // first; rod.slot.bobberX is undefined and drew the flash at NaN (invisible).
    const flashSlot = ROD_SLOTS[rod.slot] || ROD_SLOTS[0];
    state.caughtFlash = {
      speciesId: fish.id,
      x: flashSlot.bobberX,
      y: flashSlot.bobberY,
      until: now + 2500
    };

    // Update biggest fish strictly if heavier
    if (!state.biggestFish || fish.weight > state.biggestFish.weight) {
      state.biggestFish = {
        username: rod.username,
        name: fish.name,
        rarity: fish.rarity,
        weight: fish.weight,
        points: fish.points
      };
      renderBiggestFish();
    }

    const weightStr = formatWeight(fish.weight);
    const boostNote = usedBoost === 'gold' ? ' [★ Cần vàng]' : usedBoost === 'bait' ? ' [● Mồi ngon]' : '';

    pushComment({
      username: rod.username,
      type: 'catch',
      badge: '🎣 CÂU ĐƯỢC',
      text: `${fish.name} ${weightStr}kg (+${fish.points}đ)${boostNote}`
    });

    AudioEngine.playSplash();
    AudioEngine.playReel();

    if (fish.rarity === 'huge') {
      AudioEngine.playFanfare();
      Confetti.burst(120);
      setFishermanMood('excited', 3000);
      showToast(`🌟 CÁ KHỦNG! ${rod.username} câu được ${fish.name} ${weightStr}kg (+${fish.points}đ)!`, 'huge');
      TTS.speak(
        `Cá khủng! Xin chúc mừng ${rod.username} vừa câu được ${fish.name} nặng ${weightStr} ki lô gam, ghi trọn ${numberToVietnamese(fish.points)} điểm!`,
        { rate: 1.05, pitch: 1.15 }
      );
    } else if (fish.rarity === 'rare') {
      AudioEngine.playFanfare();
      setFishermanMood('excited', 2400);
      showToast(`✨ Cá hiếm! ${rod.username} câu được ${fish.name} ${weightStr}kg (+${fish.points}đ)`);
      TTS.speak(
        `Tuyệt vời! ${rod.username} câu được ${fish.name} nặng ${weightStr} ki lô gam, cộng ${numberToVietnamese(fish.points)} điểm!`
      );
    } else {
      setFishermanMood('waiting', 0);
      TTS.speak(
        `${rod.username} câu được ${fish.name} nặng ${weightStr} ki lô gam, cộng ${numberToVietnamese(fish.points)} điểm!`
      );
    }

    renderStats();
    renderLeaderboards();
    renderBiteAlert();

    if (state.sessionCaught >= SESSION_TARGET_FISH && state.phase === 'playing') {
      startEndOfSession();
    }

    return { ok: true, caught: true, fish };
  }

  /* =========================================================================
   * 10. VIEWER INTERACTIONS: COMMENT, LIKE, GIFT
   * ========================================================================= */

  function handleComment(username, text, options) {
    const cleanName = String(username || '').trim();
    const cleanText = String(text || '').trim();
    if (!cleanName || !cleanText) return { casted: false };

    pushComment({
      username: cleanName,
      type: 'chat',
      text: cleanText
    });

    if (isCastCommand(cleanText)) {
      const rod = castRod(cleanName, options);
      return { casted: Boolean(rod), rod };
    }

    if (isJerkCommand(cleanText)) {
      // 'Lên' giật ngay như cũ (Cơ 25/11 'Như cũ nhé': giữ 'Lên' + tặng 1 xu,
      // THÊM 10 Tym làm cách lên câu nữa — không thay thế).
      const result = jerkRod(cleanName, options);
      return { casted: false, jerked: Boolean(result && result.caught), result };
    }

    // BẢN BÁN HÀNG: bình luận nhắc tới sản phẩm -> MC trả lời lúc rảnh.
    maybeReplyProductComment(cleanName, cleanText, options);
    return { casted: false };
  }

  function handleLike(username, options) {
    const cleanName = String(username || '').trim();
    if (!cleanName) return { action: 'ignored' };
    const opts = options || {};
    // Số Tym trong 1 event (TikTok gộp nhiều Tym vào 1 event).
    const likeCount = Math.max(1, Number(opts.likeCount) || 1);

    const rod = findRodByUser(cleanName);
    if (!rod) {
      const newRod = castRod(cleanName, options);
      return { action: newRod ? 'cast' : 'ignored', rod: newRod };
    }
    if (rod.status === 'biting') {
      // Tym của chủ cần: +0,1% tỉ lệ trúng/cái (từ lúc quăng) VÀ đếm vào 10 Tym
      // để lên câu (chỉ tính Tym từ lúc cá cắn). Đủ 10 Tym -> tự giật lên.
      rod.likeBonus = (rod.likeBonus || 0) + likeCount;
      const progress = (rod.likeBonus || 0) - (rod.bonusAtBite || 0);
      renderBiteAlert();
      if (progress >= JERK_TYM_NEEDED) {
        const result = jerkRod(cleanName, options);
        return { action: result.caught ? 'catch' : 'escape', result };
      }
      return { action: 'jerk_progress', progress, rod };
    }
    // Rod is waiting -> mỗi Tym +0,1% tỉ lệ trúng (ẩn số), cần vẫn ở dưới nước
    rod.likeBonus = (rod.likeBonus || 0) + likeCount;
    return { action: 'waiting_noop', rod };
  }

  function handleGift(payload, options) {
    if (!payload) return null;
    const username = String(payload.username || '').trim();
    if (!username) return null;

    const giftName = String(payload.giftName || 'Quà tặng').trim();
    const diamondCount = Math.max(0, Number(payload.diamondCount) || 0);
    const repeatCount = Math.max(1, Number(payload.repeatCount) || 1);
    const totalDiamonds = diamondCount * repeatCount;
    const key = userKey(username);

    // Track total diamonds for Top tặng quà — NEVER adds game points!
    if (!state.giftScores[key]) {
      state.giftScores[key] = { username, diamonds: 0, count: 0, avatar: '' };
    }
    state.giftScores[key].username = username;
    if (payload.avatar) state.giftScores[key].avatar = payload.avatar;
    state.giftScores[key].diamonds += totalDiamonds;
    state.giftScores[key].count += repeatCount;
    renderGiftBoard();

    // Tier determined by SINGLE gift value (diamondCount), NOT totalDiamonds
    let tier = 'support';
    let boostApplied = null;

    if (diamondCount >= 10) {
      tier = 'gold';
      boostApplied = 'gold';
    } else if (diamondCount >= 5) {
      tier = 'bait';
      boostApplied = 'bait';
    }

    // Banner line for gift
    if (diamondCount === 1) {
      const qtyStr = repeatCount > 1 ? ` ×${repeatCount}` : '';
      pushComment({
        username,
        type: 'gift',
        badge: '🎁 1💎',
        text: `🎁 ${username} đã tặng ${giftName}${qtyStr} — Ủng hộ chủ thớt!`
      });
    } else {
      pushComment({
        username,
        type: 'gift',
        badge: `🎁 ${diamondCount}💎`,
        text: `🎁 ${username} đã tặng ${giftName} ×${repeatCount}`
      });
    }

    if (boostApplied) {
      // Attach immediately to active rod if fishing, otherwise wait for next cast
      const activeRod = findRodByUser(username);
      if (activeRod) {
        if (activeRod.boost !== 'gold' || boostApplied === 'gold') {
          activeRod.boost = boostApplied;
        }
      } else {
        if (state.pendingBoosts[key] !== 'gold' || boostApplied === 'gold') {
          state.pendingBoosts[key] = boostApplied;
        }
      }

      if (boostApplied === 'gold') {
        const line = `🎁 ${username} — lần câu sau có Cần vàng!`;
        pushComment({ username, type: 'gift', badge: '★ CẦN VÀNG', text: line });
        AudioEngine.playFanfare();
        TTS.speak(`Cảm ơn ${username} đã tặng ${giftName}! Lần câu sau của ${username} có Cần vàng, chắc chắn câu cá hiếm hoặc cá khủng!`);
      } else {
        const line = `🎁 ${username} — lần câu sau có Mồi ngon!`;
        pushComment({ username, type: 'gift', badge: '● MỒI NGON', text: line });
        TTS.speak(`Cảm ơn ${username} đã tặng ${giftName}! Lần câu sau của ${username} có Mồi ngon, tăng tỉ lệ cá to!`);
      }
    }

    // Banner quà nổi bật cho MỌI món quà (avatar + tên + quà + xu + ưu đãi),
    // hiện 5 giây để đọc rồi tự ẩn.
    const perkText = boostApplied === 'gold'
      ? 'Cần vàng — lần câu sau chắc cá hiếm'
      : boostApplied === 'bait'
        ? 'Mồi ngon — lần câu sau dễ cá to'
        : 'Ủng hộ chủ thớt';
    showGiftBanner({
      avatar: payload.avatar || '',
      username,
      giftName,
      diamondCount,
      repeatCount,
      perkText
    });

    // Tặng 1 xu giật cần lên như cũ (Cơ 25/11 'Như cũ nhé': giữ tặng 1 xu,
    // THÊM 10 Tym làm cách lên câu nữa — không thay thế).
    if (diamondCount === 1) {
      const rod = findRodByUser(username);
      if (rod && rod.status === 'biting') {
        jerkRod(username, options || {});
      }
    }

    return { tier, boostApplied, totalDiamonds };
  }

  /* =========================================================================
   * 11. END-OF-SESSION FLOW (10s SUMMARY -> 5s COUNTDOWN -> AUTO NEW SESSION)
   * ========================================================================= */

  function buildHonorSpeech(topFishers, topGifters, biggestFish) {
    const parts = [`Phiên câu số ${state.sessionNumber} đã kết thúc!`];
    if (topFishers.length > 0) {
      const t1 = topFishers[0];
      parts.push(`Chúc mừng quán quân ${t1.username} đạt ${numberToVietnamese(t1.points)} điểm.`);
    }
    if (topGifters.length > 0) {
      const g1 = topGifters[0];
      parts.push(`Vua quà tặng là ${g1.username} với ${numberToVietnamese(g1.diamonds)} kim cương, xin cảm ơn rất nhiều!`);
    }
    if (biggestFish) {
      parts.push(`Con cá khủng nhất phiên thuộc về ${biggestFish.username} với ${biggestFish.name} nặng ${formatWeight(biggestFish.weight)} ki lô gam.`);
    }
    return parts.join(' ');
  }

  function startEndOfSession() {
    state.phase = 'summary';
    state.summaryRemainingMs = SUMMARY_DURATION_MS;
    state.rods = [];
    renderBiteAlert();
    renderStats();

    const topFishers = getSortedFishers().slice(0, 3);
    const topGifters = getSortedGifters().slice(0, 3);
    const bf = state.biggestFish;

    if (dom.summarySessionLabel) {
      dom.summarySessionLabel.textContent = `PHIÊN #${state.sessionNumber} HOÀN TẤT · ${state.sessionCaught} CÁ`;
    }

    if (dom.summaryHighlights) {
      const lines = [];
      if (topFishers.length > 0) {
        lines.push(`👑 Top 1: ${topFishers[0].username} — ${topFishers[0].points.toLocaleString('vi-VN')} điểm`);
      }
      if (topGifters.length > 0) {
        lines.push(`🎁 Vua quà tặng: ${topGifters[0].username} — ${topGifters[0].diamonds.toLocaleString('vi-VN')} kim cương`);
      }
      if (bf) {
        lines.push(`🐟 Cá khủng nhất phiên: ${bf.username} — ${bf.name} ${formatWeight(bf.weight)}kg`);
      }
      dom.summaryHighlights.innerHTML = lines
        .map((l) => `<div class="summary-highlight-line">${escapeHtml(l)}</div>`)
        .join('');
    }

    if (dom.summaryTopFishers) {
      dom.summaryTopFishers.innerHTML = topFishers.length === 0
        ? '<li>Chưa có cần thủ</li>'
        : topFishers
            .map((p, i) => `<li><span>${['👑', '🥈', '🥉'][i]} ${escapeHtml(p.username)}</span><strong>${p.points.toLocaleString('vi-VN')}đ</strong></li>`)
            .join('');
    }

    if (dom.summaryTopGifters) {
      dom.summaryTopGifters.innerHTML = topGifters.length === 0
        ? '<li>Chưa có quà tặng</li>'
        : topGifters
            .map((g, i) => `<li><span>${['👑', '#2', '#3'][i]} ${escapeHtml(g.username)}</span><strong>${g.diamonds.toLocaleString('vi-VN')}💎</strong></li>`)
            .join('');
    }

    if (dom.summaryBiggestFish) {
      dom.summaryBiggestFish.textContent = bf
        ? `🐟 Cá khủng nhất phiên: ${bf.username} — ${bf.name} ${formatWeight(bf.weight)}kg (${bf.points}đ)`
        : '🐟 Chưa ghi nhận cá khủng';
    }

    if (dom.summaryTimerFill) {
      dom.summaryTimerFill.style.width = '100%';
    }
    if (dom.summaryOverlay) {
      dom.summaryOverlay.classList.remove('hidden');
    }

    Confetti.burst(150);
    AudioEngine.playFanfare();
    const honorSpeech = buildHonorSpeech(topFishers, topGifters, bf);
    TTS.speak(honorSpeech);
  }

  function startCountdown() {
    state.phase = 'countdown';
    state.countdownRemaining = COUNTDOWN_SECONDS;

    if (dom.summaryOverlay) dom.summaryOverlay.classList.add('hidden');
    if (dom.countdownOverlay) dom.countdownOverlay.classList.remove('hidden');
    if (dom.countdownNumber) dom.countdownNumber.textContent = String(state.countdownRemaining);

    const line = COUNTDOWN_LINES[Math.floor(Math.random() * COUNTDOWN_LINES.length)];
    if (dom.countdownSpeech) dom.countdownSpeech.textContent = line;
    TTS.speak(line);
  }

  function startNewSession(isFirst) {
    if (!isFirst) {
      state.sessionNumber += 1;
    }
    state.phase = 'playing';
    state.sessionCaught = 0;
    state.sessionEscaped = 0;
    state.rods = [];
    state.playerScores = Object.create(null);
    state.giftScores = Object.create(null);
    state.biggestFish = null;
    state.prevTop3Keys = [];
    state.fishermanMood = 'waiting';
    state.fishermanMoodUntil = 0;

    if (dom.summaryOverlay) dom.summaryOverlay.classList.add('hidden');
    if (dom.countdownOverlay) dom.countdownOverlay.classList.add('hidden');

    renderGiftBoard();
    renderStats();
    renderBiggestFish();
    renderLeaderboards();
    renderBiteAlert();

    TTS.speak(
      isFirst
        ? 'Chào mừng cả nhà đến với Câu Cá Live! Thả tim hoặc bình luận câu để quăng cần ngay nào!'
        : `Phiên câu số ${state.sessionNumber} bắt đầu! Mời cả nhà thả tim hoặc gõ câu để quăng cần nào!`
    );
  }

  /* =========================================================================
   * 12. DEMO MODE BOTS
   * ========================================================================= */

  function tickDemoBots(now) {
    if (state.mode !== 'demo' || state.phase !== 'playing' || state.paused) return;

    // 1. Bot casting every 2.5–6s (only when idle & slots available)
    if (now - state.lastBotCastAt >= state.nextBotCastDelayMs) {
      state.lastBotCastAt = now;
      state.nextBotCastDelayMs = 2500 + Math.floor(Math.random() * 3500);

      if (state.rods.length < MAX_ROD_SLOTS) {
        const idleBots = BOT_NAMES.filter((name) => !findRodByUser(name));
        if (idleBots.length > 0) {
          const chosen = idleBots[Math.floor(Math.random() * idleBots.length)];
          if (Math.random() < 0.65) {
            handleComment(chosen, Math.random() < 0.7 ? 'câu' : 'thả cần', { isBot: true, now });
          } else {
            handleLike(chosen, { isBot: true, now });
          }
        }
      }
    }

    // 2. Occasional bot chatter every 7–14s
    if (now - state.lastBotChatAt >= 9500) {
      state.lastBotChatAt = now + Math.floor(Math.random() * 4500);
      const speaker = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const line = BOT_CHATTER[Math.floor(Math.random() * BOT_CHATTER.length)];
      handleComment(speaker, line, { isBot: true });
    }

    // 3. Simulated gifts every 45–60s from real GIFT_CATALOG
    if (now - state.lastBotGiftAt >= state.nextBotGiftDelayMs) {
      state.lastBotGiftAt = now;
      state.nextBotGiftDelayMs = 45000 + Math.floor(Math.random() * 15000);

      const gifter = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const gift = GIFT_CATALOG[Math.floor(Math.random() * GIFT_CATALOG.length)];
      const repeatCount = gift.diamondCount <= 2 ? (1 + Math.floor(Math.random() * 3)) : 1;
      handleGift({
        username: gifter,
        giftName: gift.name,
        diamondCount: gift.diamondCount,
        repeatCount,
        giftId: gift.name
      });
    }
  }

  /* =========================================================================
   * 13. MAIN SIMULATION TICK (100ms)
   * ========================================================================= */

  let lastTickAt = Date.now();
  let tickTimerId = null;

  function tick(nowOverride) {
    const now = typeof nowOverride === 'number' ? nowOverride : Date.now();
    if (state.caughtFlash && now >= state.caughtFlash.until) state.caughtFlash = null;
    const dt = clamp(now - lastTickAt, 0, 2000);
    lastTickAt = now;

    if (!state.started || state.paused) return;

    if (state.phase === 'playing') {
      // Check fisherman temporary mood expiry
      if (state.fishermanMoodUntil > 0 && now >= state.fishermanMoodUntil) {
        const anyBiting = state.rods.some((r) => r.status === 'biting');
        state.fishermanMood = anyBiting ? 'reeling' : 'waiting';
        state.fishermanMoodUntil = 0;
      }

      // Evaluate rods (iterate over shallow copy in case escape/catch mutates array)
      const snapshot = state.rods.slice();
      for (let i = 0; i < snapshot.length; i++) {
        const rod = snapshot[i];
        if (!state.rods.includes(rod)) continue;

        if (rod.status === 'waiting' && now >= rod.biteScheduledAt) {
          triggerBite(rod, now);
        } else if (rod.status === 'biting') {
          if (rod.isBot && rod.botJerkAt > 0 && now >= rod.botJerkAt) {
            jerkRod(rod.username, { now });
          } else if (now > rod.biteDeadline) {
            escapeFish(rod);
          }
        }
      }

      tickDemoBots(now);

      // MC nói liên tục cả khi rảnh: 20s không có câu thoại nào thì nói 1 câu.
      // BẢN BÁN HÀNG: câu bán hàng cũng chỉ đọc ở đây (khoảng trống), xen kẽ
      // với câu game — event game luôn ưu tiên vì TTS.speak() của game sẽ
      // ngắt câu bán hàng đang đọc dở.
      if (TTS.isEnabled() && now - TTS.getLastSpeakAt() >= IDLE_VOICE_MS) {
        const line = pickIdleLine(now);
        if (line) TTS.speak(line);
      }
