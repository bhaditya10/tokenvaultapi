const Koa = require("koa");
const KoaRouter = require("koa-router");
const json = require("koa-json");
const path = require("path");
const render = require("koa-ejs");
const bodyParser = require('koa-bodyparser');

// initializer
const app = new Koa();
const router = new KoaRouter();

async function responseHandler (ctx, next) {  
    try {
      await next()
    } catch (err) {
      ctx.throw(err.code, err.message)
    }
  
    // Ignore post-processing if body was already set
    if (!ctx.state.response || ctx.body) return
  
    ctx.status = 200
    ctx.body = {
      ...ctx.state.response,
      ok: true
    }
}

// middleware
app.use(json());
app.use(bodyParser());
app.use(responseHandler);
app.use(router.routes()).use(router.allowedMethods());

// additional settings
app.context.user = 'Aditya'

// layout templating
render(app, {
    root : path.join(__dirname, 'views'),
    layout : 'layout',
    viewExt : 'html',
    cache : false,
    debug : false
})

// src
const src = require("./src");

// configure routes
router.get('/eth/api/v1/transaction/:txh', src.txhash);

// start server
app.listen(5000, () => console.log('Server started...'));
