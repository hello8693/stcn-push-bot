import { randomBytes } from 'crypto';

class SecurityConfig {
  private webhookToken: string;

  constructor() {
    // 从环境变量获取或生成随机令牌
    this.webhookToken = process.env.WEBHOOK_TOKEN || this.generateToken();
    
    if (!process.env.WEBHOOK_TOKEN) {
      console.warn('⚠️  未设置 WEBHOOK_TOKEN 环境变量，使用随机生成的令牌');
      console.warn(`🔑 当前 Webhook 令牌: ${this.webhookToken}`);
      console.warn('   建议将此令牌设置到环境变量中以保持一致性');
    }
  }

  // 生成随机令牌
  private generateToken(): string {
    return randomBytes(16).toString('hex');
  }

  // 获取 webhook 令牌
  getWebhookToken(): string {
    return this.webhookToken;
  }

  // 验证 webhook 令牌
  validateWebhookToken(token: string): boolean {
    return token === this.webhookToken;
  }

  // 获取安全的 webhook 路径
  getSecureWebhookPath(endpoint: string): string {
    return `/webhook/${this.webhookToken}/${endpoint}`;
  }

  // 获取所有安全的 webhook 端点
  getSecureWebhookEndpoints(): { [key: string]: string } {
    return {
      userPost: this.getSecureWebhookPath('forum/user'),
      adminPost: this.getSecureWebhookPath('forum/admin'),
      userReply: this.getSecureWebhookPath('forum/reply')
    };
  }

  // 显示安全配置信息
  displaySecurityInfo(): void {
    console.log('🔐 安全配置信息:');
    console.log(`   Webhook 令牌: ${this.webhookToken}`);
    console.log('🔗 安全 Webhook 端点:');
    
    const endpoints = this.getSecureWebhookEndpoints();
    Object.entries(endpoints).forEach(([key, path]) => {
      console.log(`   ${key}: ${path}`);
    });
    
    console.log('💡 提示: 请将这些安全地址配置到论坛的 Webhook 设置中');
  }
}

export const securityConfig = new SecurityConfig();
