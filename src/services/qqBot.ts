import { NapCatMessage, NapCatResponse, ParsedForumMessage, ForumEventType } from '../types/index.js';

class QQBot {
  private napcatUrl: string;
  private groupId: string;

  constructor() {
    this.napcatUrl = process.env.NAPCAT_URL || '';
    this.groupId = process.env.QQ_GROUP_ID || '';
  }

  // 检查配置是否完整
  isConfigured(): boolean {
    return Boolean(this.napcatUrl && this.groupId);
  }

  // 发送消息到群
  async sendToGroup(message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('QQ Bot 未配置，无法发送消息');
      return false;
    }

    const napcatMessage: NapCatMessage = {
      group_id: this.groupId,
      message: [
        {
          type: 'text',
          data: {
            text: message
          }
        }
      ]
    };

    try {
      const response = await fetch(`${this.napcatUrl}/send_group_msg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(napcatMessage)
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态: ${response.status}`);
      }

      const result: NapCatResponse = await response.json();
      
      if (result.status === 'ok' && result.retcode === 0) {
        console.log(`✅ 消息发送成功，消息ID: ${result.data.message_id}`);
        return true;
      } else {
        console.error('❌ 消息发送失败:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ 发送消息时出错:', error);
      return false;
    }
  }

  // 格式化论坛消息为QQ消息
  formatForumMessage(parsed: ParsedForumMessage): string {
    const emojis = {
      [ForumEventType.USER_POST_APPROVAL]: '📝',
      [ForumEventType.ADMIN_POST_APPROVAL]: '✅', 
      [ForumEventType.USER_REPLY]: '💬'
    };

    const typeNames = {
      [ForumEventType.USER_POST_APPROVAL]: '新帖发布',
      [ForumEventType.ADMIN_POST_APPROVAL]: '帖子审核通过',
      [ForumEventType.USER_REPLY]: '新回复'
    };

    const emoji = emojis[parsed.type] || '📢';
    const typeName = typeNames[parsed.type] || '论坛动态';

    let message = `${emoji} 【${typeName}】\n`;
    message += `📖 标题：${parsed.title}\n`;
    message += `👤 作者：${parsed.author}\n`;
    
    if (parsed.content && parsed.content.trim()) {
      // 简化内容，移除图片等特殊标记
      const cleanContent = this.cleanContent(parsed.content);
      if (cleanContent.length > 100) {
        message += `📄 内容：${cleanContent.substring(0, 100)}...\n`;
      } else if (cleanContent.length > 0) {
        message += `📄 内容：${cleanContent}\n`;
      }
    }
    
    message += `🔗 链接：${parsed.link}`;

    return message;
  }

  // 清理内容，移除特殊标记
  private cleanContent(content: string): string {
    return content
      .replace(/\[upl-image-preview[^\]]*\]/g, '[图片]') // 替换图片预览标记
      .replace(/\[img[^\]]*\]/g, '[图片]') // 替换图片标记
      .replace(/\[url[^\]]*\]/g, '') // 移除URL标记
      .replace(/\[\/[^\]]*\]/g, '') // 移除结束标记
      .replace(/\n+/g, ' ') // 将换行符替换为空格
      .trim();
  }

  // 发送论坛消息到群
  async sendForumMessage(parsed: ParsedForumMessage): Promise<boolean> {
    const formattedMessage = this.formatForumMessage(parsed);
    console.log('📤 准备发送消息:', formattedMessage);
    return await this.sendToGroup(formattedMessage);
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('QQ Bot 未配置');
      return false;
    }

    try {
      // 发送测试消息
      const testMessage = `🤖 论坛机器人连接测试 - ${new Date().toLocaleString('zh-CN')}`;
      return await this.sendToGroup(testMessage);
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }
}

export const qqBot = new QQBot();
