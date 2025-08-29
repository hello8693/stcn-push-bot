import { Request, Response } from 'express';
import { MessageParser } from '../services/messageParser.js';
import { qqBot } from '../services/qqBot.js';
import { SlackWebhookMessage } from '../types/index.js';

class WebhookHandler {
  // 处理用户权限的帖子过审事件
  async handleUserPostApproval(req: Request, res: Response): Promise<void> {
    try {
      console.log('📨 收到用户帖子过审 Webhook:', JSON.stringify(req.body, null, 2));

      // 验证消息格式
      if (!MessageParser.validateSlackMessage(req.body)) {
        res.status(400).json({ 
          error: '无效的 Slack Webhook 消息格式',
          received: req.body
        });
        return;
      }

      const webhook: SlackWebhookMessage = req.body;
      const parsed = MessageParser.parseUserPostApproval(webhook);

      if (!parsed) {
        res.status(400).json({ 
          error: '无法解析消息内容',
          webhook: webhook
        });
        return;
      }

      // 发送到 QQ 群
      const success = await qqBot.sendForumMessage(parsed);

      if (success) {
        res.json({ 
          success: true, 
          message: '用户帖子过审通知已发送',
          parsed: parsed
        });
      } else {
        res.status(500).json({ 
          error: '发送 QQ 消息失败',
          parsed: parsed
        });
      }
    } catch (error) {
      console.error('处理用户帖子过审 Webhook 失败:', error);
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 处理管理员权限的帖子过审事件
  async handleAdminPostApproval(req: Request, res: Response): Promise<void> {
    try {
      console.log('📨 收到管理员帖子过审 Webhook:', JSON.stringify(req.body, null, 2));

      // 验证消息格式
      if (!MessageParser.validateSlackMessage(req.body)) {
        res.status(400).json({ 
          error: '无效的 Slack Webhook 消息格式',
          received: req.body
        });
        return;
      }

      const webhook: SlackWebhookMessage = req.body;
      const parsed = MessageParser.parseAdminPostApproval(webhook);

      if (!parsed) {
        res.status(400).json({ 
          error: '无法解析消息内容',
          webhook: webhook
        });
        return;
      }

      // 发送到 QQ 群
      const success = await qqBot.sendForumMessage(parsed);

      if (success) {
        res.json({ 
          success: true, 
          message: '管理员帖子过审通知已发送',
          parsed: parsed
        });
      } else {
        res.status(500).json({ 
          error: '发送 QQ 消息失败',
          parsed: parsed
        });
      }
    } catch (error) {
      console.error('处理管理员帖子过审 Webhook 失败:', error);
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 处理用户回帖事件
  async handleUserReply(req: Request, res: Response): Promise<void> {
    try {
      console.log('📨 收到用户回帖 Webhook:', JSON.stringify(req.body, null, 2));

      // 验证消息格式
      if (!MessageParser.validateSlackMessage(req.body)) {
        res.status(400).json({ 
          error: '无效的 Slack Webhook 消息格式',
          received: req.body
        });
        return;
      }

      const webhook: SlackWebhookMessage = req.body;
      const parsed = MessageParser.parseUserReply(webhook);

      if (!parsed) {
        res.status(400).json({ 
          error: '无法解析消息内容',
          webhook: webhook
        });
        return;
      }

      // 发送到 QQ 群
      const success = await qqBot.sendForumMessage(parsed);

      if (success) {
        res.json({ 
          success: true, 
          message: '用户回帖通知已发送',
          parsed: parsed
        });
      } else {
        res.status(500).json({ 
          error: '发送 QQ 消息失败',
          parsed: parsed
        });
      }
    } catch (error) {
      console.error('处理用户回帖 Webhook 失败:', error);
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 通用 Webhook 处理器（自动识别类型）
  async handleGenericWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('📨 收到通用 Webhook:', JSON.stringify(req.body, null, 2));

      // 验证消息格式
      if (!MessageParser.validateSlackMessage(req.body)) {
        res.status(400).json({ 
          error: '无效的 Slack Webhook 消息格式',
          received: req.body
        });
        return;
      }

      const webhook: SlackWebhookMessage = req.body;
      const parsed = MessageParser.parseMessage(webhook);

      if (!parsed) {
        res.status(400).json({ 
          error: '无法解析消息内容或不支持的消息类型',
          webhook: webhook
        });
        return;
      }

      // 发送到 QQ 群
      const success = await qqBot.sendForumMessage(parsed);

      if (success) {
        res.json({ 
          success: true, 
          message: '论坛通知已发送',
          type: parsed.type,
          parsed: parsed
        });
      } else {
        res.status(500).json({ 
          error: '发送 QQ 消息失败',
          parsed: parsed
        });
      }
    } catch (error) {
      console.error('处理通用 Webhook 失败:', error);
      res.status(500).json({ 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

export const webhookHandler = new WebhookHandler();
