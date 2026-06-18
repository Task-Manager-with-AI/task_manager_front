const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const httpProxy = require("http-proxy")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOST || "localhost"
const port = parseInt(process.env.PORT || "3000", 10)
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(
  /\/api\/v1\/?$/,
  ""
)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()
const upgradeHandler = app.getUpgradeHandler()

const backendProxy = httpProxy.createProxyServer({
  target: apiBase,
  ws: true,
  changeOrigin: true,
})

backendProxy.on("error", (err, req, res) => {
  console.error("[backend proxy]", err.message)
  if (res && !res.headersSent && typeof res.writeHead === "function") {
    res.writeHead(502)
    res.end("Backend proxy error")
  }
})

function isSocketIoRequest(pathname) {
  return pathname === "/socket.io" || pathname.startsWith("/socket.io/")
}

function isCollaborationRequest(pathname) {
  return pathname === "/collaboration" || pathname.startsWith("/collaboration/")
}

function shouldProxyToBackend(pathname) {
  return isSocketIoRequest(pathname) || isCollaborationRequest(pathname)
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)

    if (shouldProxyToBackend(parsedUrl.pathname)) {
      backendProxy.web(req, res)
      return
    }

    handle(req, res, parsedUrl)
  })

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url)

    if (shouldProxyToBackend(pathname)) {
      backendProxy.ws(req, socket, head)
      return
    }

    upgradeHandler(req, socket, head)
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO proxied to ${apiBase}`)
    console.log(`> Collaboration proxied to ${apiBase}`)
  })
})
