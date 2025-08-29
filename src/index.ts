import express, { Request, Response, Application } from 'express';
import { webhookHandler } from './handlers/webhookHandler.js';
import { qqBot } from './services/qqBot.js';
import { testController } from './controllers/testController.js';
import { securityConfig } from './config/security.js';
import { securityMiddleware } from './middleware/security.js';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/', (req: Request, res: Response) => {
  const endpoints = securityConfig.getSecureWebhookEndpoints();
  
  res.json({
    message: '智教联盟论坛 QQ Bot 🤖',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      `POST ${endpoints.userPost} - 用户权限帖子过审通知`,
      `POST ${endpoints.adminPost} - 管理员权限帖子过审通知`, 
      `POST ${endpoints.userReply} - 用户回帖通知`,
      'GET /health - 健康检查',
      'GET /security/info - 安全配置信息'
    ]
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    qqBot: qqBot.isConfigured() ? 'configured' : 'not configured',
    security: 'enabled'
  });
});

// 安全配置信息端点
app.get('/security/info', (req: Request, res: Response) => {
  const endpoints = securityConfig.getSecureWebhookEndpoints();
  res.json({
    message: '安全配置信息',
    webhookToken: securityConfig.getWebhookToken(),
    secureEndpoints: endpoints,
    note: '请将这些安全地址配置到论坛的 Webhook 设置中'
  });
});

// 安全 Webhook 端点 - 需要令牌验证
// 1. 论坛帖子过审时，用户权限数据接收端点
app.post('/webhook/:token/forum/user', 
  securityMiddleware.logSecureRequest,
  securityMiddleware.rateLimiter(60000, 20), // 1分钟内最多20次请求
  securityMiddleware.validateWebhookToken,
  webhookHandler.handleUserPostApproval
);

// 2. 论坛帖子过审时，管理员权限数据接收端点  
app.post('/webhook/:token/forum/admin',
  securityMiddleware.logSecureRequest,
  securityMiddleware.rateLimiter(60000, 20),
  securityMiddleware.validateWebhookToken,
  webhookHandler.handleAdminPostApproval
);

// 3. 用户回帖事件
app.post('/webhook/:token/forum/reply',
  securityMiddleware.logSecureRequest,
  securityMiddleware.rateLimiter(60000, 50), // 回帖可能更频繁
  securityMiddleware.validateWebhookToken,
  webhookHandler.handleUserReply
);

// 测试端点
app.get('/test/connection', testController.testConnection);
app.post('/test/message', testController.sendTestMessage);
app.post('/test/webhook/:type', testController.simulateWebhook);
app.get('/test/secure/:type', testController.testSecureWebhook);

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, _next: Function) => {
  console.error('错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404 处理
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: '端点未找到',
    message: `${req.method} ${req.originalUrl} 不存在`
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 智教联盟论坛 QQ Bot 服务启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔐 安全配置: http://localhost:${PORT}/security/info`);
  
  // 显示安全配置信息
  securityConfig.displaySecurityInfo();
  
  // 检查 QQ Bot 配置
  if (!qqBot.isConfigured()) {
    console.warn('⚠️  请配置环境变量:');
    console.warn('   NAPCAT_URL - NapCat API 地址');
    console.warn('   QQ_GROUP_ID - 目标QQ群号');
    console.warn('   WEBHOOK_TOKEN - Webhook 安全令牌（可选，未设置将自动生成）');
  } else {
    console.log('✅ QQ Bot 配置完成');
  }
});

export default app;
