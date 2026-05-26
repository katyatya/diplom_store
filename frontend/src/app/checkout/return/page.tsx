"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmYooKassaMockPayment, fetchMyOrders } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ReturnStatus = "loading" | "success" | "fail" | "info";

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка...</p>}>
      <CheckoutReturnPageInner />
    </Suspense>
  );
}

function CheckoutReturnPageInner() {
  const searchParams = useSearchParams();

  const { orderId, mockResult, isMock } = useMemo(() => {
    const orderId = searchParams.get("orderId");
    const isMock = searchParams.get("mock") === "1";
    const mockResult = searchParams.get("result") ?? undefined;
    return { orderId, mockResult, isMock };
  }, [searchParams]);

  const [status, setStatus] = useState<ReturnStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("info");
      return;
    }

    if (!isMock) {
      let cancelled = false;

      const pollOrderStatus = async () => {
        for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
          try {
            const orders = await fetchMyOrders();
            const order = orders.find((entry) => entry.id === orderId);
            if (order?.status === "CONFIRMED") {
              setStatus("success");
              return;
            }
            if (order?.status.startsWith("CANCELLED")) {
              setStatus("fail");
              return;
            }
          } catch {
            setStatus("info");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        setStatus("info");
      };

      void pollOrderStatus();
      return () => {
        cancelled = true;
      };
    }

    // MVP: confirm mock payment when the user is returned.
    const result = mockResult === "success" ? "success" : "fail";
    setStatus("loading");

    void confirmYooKassaMockPayment({ orderId, result })
      .then(() => setStatus(result === "success" ? "success" : "fail"))
      .catch(() => {
        setError("Не удалось подтвердить оплату. Попробуйте снова или проверьте статус в профиле.");
        setStatus(result === "success" ? "success" : "fail");
      });
  }, [isMock, mockResult, orderId]);

  return (
    <section className="grid gap-4">
      <h1 className="text-4xl font-light italic" style={{ fontFamily: "var(--font-serif)" }}>
        Результат оплаты
      </h1>

      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Проверяем статус...</p>
      ) : null}

      {status === "success" ? (
        <p className="text-sm text-muted-foreground">
          Оплата прошла успешно. Заказ <strong>№ {orderId}</strong> подтвержден.
        </p>
      ) : null}

      {status === "fail" ? (
        <p className="text-sm text-muted-foreground">
          Оплата не завершена. Заказ <strong>№ {orderId}</strong> отменен.
        </p>
      ) : null}

      {status === "info" ? (
        <p className="text-sm text-muted-foreground">
          Платеж инициирован. Статус заказа обновится автоматически (обычно через webhook).{" "}
          <Link className="underline underline-offset-2" href="/profile">
            Перейти в профиль
          </Link>
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {status === "success" ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href="/profile">К моим заказам</Link>
        </Button>
      ) : null}

      {status === "fail" ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href="/cart">Вернуться в корзину</Link>
        </Button>
      ) : null}
    </section>
  );
}

