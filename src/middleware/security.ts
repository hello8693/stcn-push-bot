import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security.js';

// 扩展 Request 类型以包含 webhookToken
declare global {
  namespace Express {
    interface Request {
      webhookToken?: string;
    }
  }
}

class SecurityMiddleware {
  // Webhook 令牌验证中间件
  validateWebhookToken(req: Request, res: Response, next: NextFunction): void {
    try {
      // 从路径参数中提取令牌
      const token = req.params.token;

      if (!token) {
        res.status(401).json({
          error: '缺少认证令牌',
          message: '请使用正确的 Webhook URL'
        });
        return;
      }

      // 验证令牌
      if (!securityConfig.validateWebhookToken(token)) {
        console.warn(`❌ 无效的 Webhook 令牌访问: ${token} from ${req.ip}`);
        res.status(403).json({
          error: '无效的认证令牌',
          message: 'Webhook 令牌不正确'
        });
        return;
      }

      // 令牌有效，继续处理
      req.webhookToken = token;
      console.log(`✅ Webhook 令牌验证成功 from ${req.ip}`);
      next();
    } catch (error) {
      console.error('Webhook 令牌验证中间件错误:', error);
      res.status(500).json({
        error: '服务器内部错误',
        message: '令牌验证过程中发生错误'
      });
    }
  }

  // 请求日志中间件（用于安全审计）
  logSecureRequest(req: Request, res: Response, next: NextFunction): void {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`🔍 [${timestamp}] 安全请求: ${req.method} ${req.path}`);
    console.log(`   IP: ${ip}, User-Agent: ${userAgent}`);
    
    next();
  }

  // 速率限制中间件（简单实现）
  rateLimiter(windowMs: number = 60000, maxRequests: number = 10) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      // 清理过期记录
      for (const [key, value] of requests.entries()) {
        if (now > value.resetTime) {
          requests.delete(key);
        }
      }

      // 检查当前 IP 的请求次数
      const currentRecord = requests.get(ip);
      
      if (!currentRecord) {
        // 首次请求
        requests.set(ip, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (currentRecord.count >= maxRequests) {
        console.warn(`⚠️  IP ${ip} 触发速率限制 (${currentRecord.count}/${maxRequests})`);
        res.status(429).json({
          error: '请求过于频繁',
          message: '请稍后再试',
          retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000)
        });
        return;
      }

      // 增加请求计数
      currentRecord.count++;
      next();
    };
  }
}

export const securityMiddleware = new SecurityMiddleware();
