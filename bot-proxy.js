addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Xử lý OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  const url = new URL(request.url)
  const path = url.pathname

  // Kiểm tra path phải bắt đầu bằng /bot (ví dụ /bot<token>/method)
  if (!path.startsWith('/bot')) {
    return new Response('Invalid path', { status: 404 })
  }

  // Tạo URL Telegram API dựa trên path và query
  const telegramUrl = 'https://api.telegram.org' + path + url.search

  // Clone request để lấy body nếu có
  const requestClone = request.clone()

  // Copy headers từ request gốc
  const headers = new Headers(request.headers)

  // Telegram Bot API không cần thêm Authorization header,
  // vì token đã có trong URL rồi.
  // Nếu bạn cần thêm header khác, chỉnh sửa ở đây.

  // Lấy body nếu method khác GET, HEAD
  let body = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await requestClone.arrayBuffer()
    } catch (e) {
      return new Response('Error reading request body: ' + e.message, { status: 400 })
    }
  }

  // Tạo request mới để gửi tới Telegram API
  const telegramRequest = new Request(telegramUrl, {
    method: request.method,
    headers: headers,
    body: body,
    redirect: 'follow',
  })

  try {
    const response = await fetch(telegramRequest)

    // Tạo response mới, copy body, status và headers từ Telegram
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })

    // Thêm header CORS để cho phép truy cập từ web
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return newResponse
  } catch (error) {
    return new Response('Error proxying request: ' + error.message, { status: 500 })
  }
}

// Hàm xử lý OPTIONS cho CORS preflight
function handleOptions(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
  return new Response(null, {
    status: 204,
    headers: headers,
  })
}
