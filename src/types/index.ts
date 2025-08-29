// Slack Webhook 消息格式类型定义
export interface SlackWebhookMessage {
  username: string;
  avatar_url: string;
  text: string;
  attachments: SlackAttachment[];
}

export interface SlackAttachment {
  fallback: string;
  color: string;
  title: string;
  title_link: string;
  text: string | null;
  footer: string;
  fields: any;
  author_name: string;
  author_link: string;
  author_icon: string;
}

// NapCat API 消息格式类型定义
export interface NapCatMessage {
  group_id: string;
  message: NapCatMessageSegment[];
}

export interface NapCatMessageSegment {
  type: 'text' | 'at' | 'image' | 'face';
  data: Record<string, any>;
}

export interface NapCatResponse {
  status: string;
  retcode: number;
  data: {
    message_id: number;
  };
  message: string;
  wording: string;
}

// 论坛事件类型
export enum ForumEventType {
  USER_POST_APPROVAL = 'user_post_approval',
  ADMIN_POST_APPROVAL = 'admin_post_approval', 
  USER_REPLY = 'user_reply'
}

// 解析后的论坛消息
export interface ParsedForumMessage {
  type: ForumEventType;
  title: string;
  author: string;
  link: string;
  content?: string;
  isApproval?: boolean;
}
