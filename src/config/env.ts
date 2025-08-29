import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前模块的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
const envPath = join(__dirname, '../../.env');
const result = config({ path: envPath });

if (result.error) {
  console.warn('⚠️  未找到 .env 文件，使用默认环境变量或系统环境变量');
  console.warn(`   预期路径: ${envPath}`);
} else {
  console.log('✅ 成功加载 .env 文件');
}

// 环境变量配置类
export class EnvConfig {
  // NapCat API 配置
  static get NAPCAT_URL(): string {
    return process.env.NAPCAT_URL || '';
  }

  // QQ 群号
  static get QQ_GROUP_ID(): string {
    return process.env.QQ_GROUP_ID || '';
  }

  // Webhook 安全令牌
  static get WEBHOOK_TOKEN(): string {
    return process.env.WEBHOOK_TOKEN || '';
  }

  // 服务端口
  static get PORT(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  // 环境模式
  static get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }

  // 验证必要的环境变量
  static validate(): { valid: boolean; missing: string[] } {
    const required = ['NAPCAT_URL', 'QQ_GROUP_ID'];
    const missing: string[] = [];

    for (const key of required) {
      if (!process.env[key] || process.env[key]!.trim() === '') {
        missing.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  // 显示当前配置（隐藏敏感信息）
  static displayConfig(): void {
    console.log('🔧 当前环境配置:');
    console.log(`   NODE_ENV: ${this.NODE_ENV}`);
    console.log(`   PORT: ${this.PORT}`);
    console.log(`   NAPCAT_URL: ${this.NAPCAT_URL ? '已配置' : '未配置'}`);
    console.log(`   QQ_GROUP_ID: ${this.QQ_GROUP_ID ? '已配置' : '未配置'}`);
    console.log(`   WEBHOOK_TOKEN: ${this.WEBHOOK_TOKEN ? '已配置' : '将自动生成'}`);

    const validation = this.validate();
    if (!validation.valid) {
      console.warn('⚠️  缺少必要的环境变量:', validation.missing.join(', '));
    }
  }
}

// 立即验证环境变量
const validation = EnvConfig.validate();
if (!validation.valid) {
  console.error('❌ 缺少必要的环境变量:', validation.missing.join(', '));
  console.error('   请检查 .env 文件或系统环境变量');
}
