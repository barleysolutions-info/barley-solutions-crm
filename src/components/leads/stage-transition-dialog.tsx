import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Rep } from "@/lib/leads-data";
import type { StageKey } from "@/lib/pipeline";
import { stageLabel } from "@/lib/pipeline";

export function StageTransitionDialog({
  open,
  toStage,
  reps,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  toStage: StageKey;
  reps: Rep[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (extra: { closedByRepId: string; lostReason?: string }) => void;
}) {
  const [closedByRepId, setClosedByRepId] = useState("");
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    if (!open) {
      setClosedByRepId("");
      setLostReason("");
    }
  }, [open]);

  const activeReps = reps.filter((r) => r.active);
  const isLost = toStage === "lost";
  const canConfirm = closedByRepId !== "" && (!isLost || lostReason.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Přesun na {stageLabel(toStage)}</DialogTitle>
          <DialogDescription>
            {isLost
              ? "Zapiš, kdo lead uzavřel a proč se ztratil — bez toho se deal nedá zavřít."
              : "Vyber, kdo lead uzavřel."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="label-mono text-muted-foreground">Kdo uzavřel</Label>
            <Select value={closedByRepId} onValueChange={setClosedByRepId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Vyber obchodníka" />
              </SelectTrigger>
              <SelectContent>
                {activeReps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLost && (
            <div>
              <Label className="label-mono text-muted-foreground">Důvod ztráty</Label>
              <Textarea
                className="mt-1.5"
                rows={3}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="quiet" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="ink"
            disabled={!canConfirm}
            onClick={() => onConfirm(isLost ? { closedByRepId, lostReason } : { closedByRepId })}
          >
            Potvrdit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
