"use client";

import { Order } from "@/lib/api";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  getPaymentStatusBadgeClass,
  getStatusBadgeClass,
} from "@/lib/orders";
import { formatPrice, formatSizeLabel } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllowedNextStatuses } from "@/lib/admin";

type OrderCardProps = {
  order: Order;
  statusDraft: string;
  cancelReasonDraft: string;
  isUpdating: boolean;
  onStatusDraftChange: (orderId: string, nextStatus: string) => void;
  onCancelReasonDraftChange: (orderId: string, nextReason: string) => void;
  onUpdate: (order: Order) => void;
};

export function OrderCard({
  order,
  statusDraft,
  cancelReasonDraft,
  isUpdating,
  onStatusDraftChange,
  onCancelReasonDraftChange,
  onUpdate,
}: OrderCardProps) {
  return (
    <article className="rounded-lg border p-3">
      <strong>Заказ {order.id}</strong> - {order.customerName}
      <p className="my-1 text-sm text-muted-foreground">
        {order.email} / {order.phone}
      </p>
      <p className="my-1 text-sm text-muted-foreground">
        {order.deliveryType} / {formatPrice(order.totalAmount, "word")}
      </p>
      <p className="my-1 text-sm text-muted-foreground">
        Способ оплаты: {order.paymentMethod}
      </p>
      <p className="my-1 text-sm text-muted-foreground">
        Оплата:{" "}
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusBadgeClass(order.paymentStatus)}`}
        >
          {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </span>
        {order.paidAt ? (
          <span className="ml-2 text-xs">
            ({new Date(order.paidAt).toLocaleString("ru-RU")})
          </span>
        ) : null}
      </p>
      {order.yookassaPaymentId ? (
        <p className="my-1 text-xs text-muted-foreground">
          ID платежа ЮKassa: <span className="font-mono">{order.yookassaPaymentId}</span>
        </p>
      ) : null}
      <div className="my-2">
        <p className="mb-1 text-sm font-medium">Товары в заказе:</p>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.productName} ({formatSizeLabel(item.sizeLabel)}) x {item.quantity} -{" "}
              {formatPrice(item.productPrice, "word")}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2 grid max-w-md gap-2">
        <p className="text-sm text-muted-foreground">
          Текущий статус:{" "}
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
        </p>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={statusDraft}
          onChange={(event) => onStatusDraftChange(order.id, event.target.value)}
        >
          {getAllowedNextStatuses(order.status, order.deliveryType).map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {ORDER_STATUS_LABELS[statusOption] ?? statusOption}
            </option>
          ))}
        </select>
        {statusDraft.startsWith("CANCELLED") ? (
          <Input
            value={cancelReasonDraft}
            onChange={(event) => onCancelReasonDraftChange(order.id, event.target.value)}
            placeholder="Причина отмены"
          />
        ) : null}
        {order.cancelReason ? (
          <p className="text-sm text-muted-foreground">Причина отмены: {order.cancelReason}</p>
        ) : null}
        <Button size="sm" disabled={isUpdating} onClick={() => onUpdate(order)}>
          Обновить статус
        </Button>
      </div>
    </article>
  );
}
