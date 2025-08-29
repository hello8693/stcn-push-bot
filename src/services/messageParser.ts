import { SlackWebhookMessage, ParsedForumMessage, ForumEventType } from '../types/index.js';

export class MessageParser {
  // 解析用户权限的帖子过审消息
  static parseUserPostApproval(webhook: SlackWebhookMessage): ParsedForumMessage | null {
    try {
      const attachment = webhook.attachments?.[0];
      if (!attachment) {
        console.error('用户帖子过审消息缺少附件');
        return null;
      }

      // 从标题中提取帖子名称，格式: "发布主题 `帖子标题`"
      const titleMatch = attachment.title?.match(/发布主题\s*`([^`]+)`/);
      if (!titleMatch) {
        console.error('无法从标题中解析帖子名称:', attachment.title);
        return null;
      }

      return {
        type: ForumEventType.USER_POST_APPROVAL,
        title: titleMatch[1],
        author: attachment.author_name || '未知用户',
        link: attachment.title_link || '',
        content: attachment.text || '',
        isApproval: false
      };
    } catch (error) {
      console.error('解析用户帖子过审消息失败:', error);
      return null;
    }
  }

  // 解析管理员权限的帖子过审消息
  static parseAdminPostApproval(webhook: SlackWebhookMessage): ParsedForumMessage | null {
    try {
      const attachment = webhook.attachments?.[0];
      if (!attachment) {
        console.error('管理员帖子过审消息缺少附件');
        return null;
      }

      // 从标题中提取帖子名称，格式: "在 `帖子标题` 中审核通过的帖子"
      const titleMatch = attachment.title?.match(/在\s*`([^`]+)`\s*中审核通过的帖子/);
      if (!titleMatch) {
        console.error('无法从标题中解析帖子名称:', attachment.title);
        return null;
      }

      return {
        type: ForumEventType.ADMIN_POST_APPROVAL,
        title: titleMatch[1],
        author: attachment.author_name || '未知用户',
        link: attachment.title_link || '',
        content: attachment.text || '',
        isApproval: true
      };
    } catch (error) {
      console.error('解析管理员帖子过审消息失败:', error);
      return null;
    }
  }

  // 解析用户回帖消息
  static parseUserReply(webhook: SlackWebhookMessage): ParsedForumMessage | null {
    try {
      const attachment = webhook.attachments?.[0];
      if (!attachment) {
        console.error('用户回帖消息缺少附件');
        return null;
      }

      // 从标题中提取帖子名称，格式: "新回复于 `帖子标题`"
      const titleMatch = attachment.title?.match(/新回复于\s*`([^`]+)`/);
      if (!titleMatch) {
        console.error('无法从标题中解析帖子名称:', attachment.title);
        return null;
      }

      return {
        type: ForumEventType.USER_REPLY,
        title: titleMatch[1],
        author: attachment.author_name || '未知用户',
        link: attachment.title_link || '',
        content: attachment.text || '',
        isApproval: false
      };
    } catch (error) {
      console.error('解析用户回帖消息失败:', error);
      return null;
    }
  }

  // 通用解析方法，自动判断消息类型
  static parseMessage(webhook: SlackWebhookMessage): ParsedForumMessage | null {
    if (!webhook.attachments || webhook.attachments.length === 0) {
      console.error('Webhook 消息缺少附件');
      return null;
    }

    const attachment = webhook.attachments[0];
    const title = attachment.title || '';

    // 根据标题模式判断消息类型
    if (title.includes('发布主题')) {
      return this.parseUserPostApproval(webhook);
    } else if (title.includes('审核通过的帖子')) {
      return this.parseAdminPostApproval(webhook);
    } else if (title.includes('新回复于')) {
      return this.parseUserReply(webhook);
    } else {
      console.error('未知的消息类型:', title);
      return null;
    }
  }

  // 验证 Slack Webhook 消息格式
  static validateSlackMessage(data: any): data is SlackWebhookMessage {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.username || !data.avatar_url || !Array.isArray(data.attachments)) {
      return false;
    }

    if (data.attachments.length === 0) {
      return false;
    }

    const attachment = data.attachments[0];
    return Boolean(
      attachment.title &&
      attachment.author_name &&
      attachment.title_link
    );
  }
}
