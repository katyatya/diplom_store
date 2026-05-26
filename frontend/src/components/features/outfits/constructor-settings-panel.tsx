"use client";

type ConstructorSettingsPanelProps = {
  selectedRotation: number | null;
  hasSelection: boolean;
  onRotationChange: (nextRotation: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onRemoveSelected: () => void;
};

export function ConstructorSettingsPanel({
  selectedRotation,
  hasSelection,
  onRotationChange,
  onBringForward,
  onSendBackward,
  onRemoveSelected,
}: ConstructorSettingsPanelProps) {
  return (
    <aside className="grid gap-4 border p-4">
      <p className="text-xs uppercase tracking-[0.15em]">Настройки</p>
      {hasSelection && selectedRotation !== null ? (
        <>
          <label className="grid gap-2 text-xs text-muted-foreground">
            Поворот: {Math.round(selectedRotation)}°
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(selectedRotation)}
              className="w-full accent-foreground"
              onChange={(event) => onRotationChange(Number(event.target.value))}
            />
          </label>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={onBringForward}
              className="border px-3 py-2 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
            >
              ↑ Слой выше
            </button>
            <button
              type="button"
              onClick={onSendBackward}
              className="border px-3 py-2 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
            >
              ↓ Слой ниже
            </button>
            <button
              type="button"
              onClick={onRemoveSelected}
              className="border border-foreground/20 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              Удалить
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Нажмите на товар на полотне, чтобы изменить его параметры.
        </p>
      )}
    </aside>
  );
}
