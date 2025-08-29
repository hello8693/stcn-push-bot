import { Request, Response } from 'express';
import { qqBot } from '../services/qqBot.js';
import { SlackWebhookMessage } from '../types/index.js';
import { securityConfig } from '../config/security.js';

class TestController {
  // 测试 QQ Bot 连接
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const success = await qqBot.testConnection();
      
      if (success) {
        res.json({
          success: true,
          message: 'QQ Bot 连接测试成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'QQ Bot 连接测试失败'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '测试时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 发送测试消息
  async sendTestMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body;
      
      if (!message) {
        res.status(400).json({
          error: '请提供测试消息内容',
          example: { message: '这是一条测试消息' }
        });
        return;
      }

      const success = await qqBot.sendToGroup(message);
      
      if (success) {
        res.json({
          success: true,
          message: '测试消息发送成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '测试消息发送失败'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '发送测试消息时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 模拟论坛 Webhook 消息
  async simulateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      let mockMessage: SlackWebhookMessage;

      switch (type) {
        case 'user-post':
          mockMessage = {
            username: "智教联盟论坛",
            avatar_url: "https://forum.smart-teach.cn/assets/favicon-v4ksoaxf.png",
            text: "",
            attachments: [{
              fallback: "[upl-image-preview uuid=1c68879b-33c9-49a6-89c5-6cf8facc2a67 url=https://forum.smart-teach.cn/assets/files/2025-08-29/1756474720-825803-screenshot-2025-08-29-21-38-03-05-9d26c6446fd7bb8e41d99b6262b17def.jpg alt={TEXT?}]\n - TestUser",
              color: "fed330",
              title: "发布主题 `测试帖子标题`",
              title_link: "https://forum.smart-teach.cn/d/611",
              text: "这是一个测试帖子的内容...",
              footer: "智教联盟论坛",
              fields: null,
              author_name: "TestUser",
              author_link: "https://forum.smart-teach.cn/u/TestUser",
              author_icon: "https://forum.smart-teach.cn/assets/avatars/ngrK2izwcquevB8u.png"
            }]
          };
          break;

        case 'admin-approval':
          mockMessage = {
            username: "智教联盟论坛",
            avatar_url: "https://forum.smart-teach.cn/assets/favicon-v4ksoaxf.png",
            text: "",
            attachments: [{
              fallback: " - TestUser",
              color: "26de81",
              title: "在 `测试帖子标题` 中审核通过的帖子",
              title_link: "https://forum.smart-teach.cn/d/612/1",
              text: null,
              footer: "智教联盟论坛",
              fields: null,
              author_name: "TestUser",
              author_link: "https://forum.smart-teach.cn/u/TestUser",
              author_icon: "https://forum.smart-teach.cn/assets/avatars/QkZ5vVgZJNzI25dY.png"
            }]
          };
          break;

        case 'user-reply':
          mockMessage = {
            username: "智教联盟论坛",
            avatar_url: "https://forum.smart-teach.cn/assets/favicon-v4ksoaxf.png",
            text: "",
            attachments: [{
              fallback: "测试回复内容 - TestUser",
              color: "26de81",
              title: "新回复于 `测试帖子标题`",
              title_link: "https://forum.smart-teach.cn/d/612/2",
              text: "这是一个测试回复的内容",
              footer: "智教联盟论坛",
              fields: null,
              author_name: "TestUser",
              author_link: "https://forum.smart-teach.cn/u/TestUser",
              author_icon: "https://forum.smart-teach.cn/assets/avatars/QkZ5vVgZJNzI25dY.png"
            }]
          };
          break;

        default:
          res.status(400).json({
            error: '不支持的消息类型',
            supportedTypes: ['user-post', 'admin-approval', 'user-reply']
          });
          return;
      }

      // 模拟发送到对应的处理器
      const mockReq = { body: mockMessage } as Request;
      const mockRes = {
        json: (data: any) => {
          res.json({
            success: true,
            message: `模拟 ${type} Webhook 消息处理完成`,
            result: data,
            mockData: mockMessage
          });
        },
        status: (code: number) => ({
          json: (data: any) => {
            res.status(code).json({
              success: false,
              message: `模拟 ${type} Webhook 消息处理失败`,
              error: data,
              mockData: mockMessage
            });
          }
        })
      } as any;

      // 根据类型调用对应的处理器
      const { webhookHandler } = await import('../handlers/webhookHandler.js');
      
      switch (type) {
        case 'user-post':
          await webhookHandler.handleUserPostApproval(mockReq, mockRes);
          break;
        case 'admin-approval':
          await webhookHandler.handleAdminPostApproval(mockReq, mockRes);
          break;
        case 'user-reply':
          await webhookHandler.handleUserReply(mockReq, mockRes);
          break;
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: '模拟 Webhook 时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 测试安全端点
  async testSecureWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const token = securityConfig.getWebhookToken();
      const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
      
      const endpoints = {
        'user-post': `${baseUrl}/webhook/${token}/forum/user`,
        'admin-approval': `${baseUrl}/webhook/${token}/forum/admin`,
        'user-reply': `${baseUrl}/webhook/${token}/forum/reply`
      };

      const endpoint = endpoints[type as keyof typeof endpoints];
      
      if (!endpoint) {
        res.status(400).json({
          error: '不支持的端点类型',
          supportedTypes: Object.keys(endpoints)
        });
        return;
      }

      res.json({
        message: '安全 Webhook 端点信息',
        type,
        endpoint,
        token,
        note: '请使用此 URL 配置论坛的 Webhook',
        curlExample: `curl -X POST ${endpoint} -H "Content-Type: application/json" -d '{"test": "data"}'`
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取安全端点信息时发生错误',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}

export const testController = new TestController();
