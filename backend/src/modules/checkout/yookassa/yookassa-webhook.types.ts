export type YooKassaWebhookNotification = {
  type?: string;
  event?: string;
  object?: {
    id?: string;
    status?: string;
    metadata?: Record<string, string>;
  };
};
