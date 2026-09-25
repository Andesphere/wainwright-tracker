import { useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadIcon, Upload04Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@wainwrights/backend/convex/_generated/api";
import {
  buildBulkReviewRows,
  countImportableRows,
  parseDelimitedImportText,
  type BulkReviewRow,
} from "@/bulkImport";

const IMPORTABLE_FILE_TYPES = ".csv,.txt,.md,.docx,.xls,.xlsx";
const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_TEXT_CHARS = 40_000;

async function extractBulkImportText(file: File) {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      "Import files must be under 2MB. Split the list or paste the fells instead.",
    );
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return workbook.SheetNames.map((sheetName) =>
      XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]),
    ).join("\n");
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }

  return file.text();
}

/** Bulk add (AI matching) and reset, moved unchanged from the old journal column. */
export function BulkImportTools({
  completed,
  onBulkAdd,
  onReset,
}: {
  completed: Set<string>;
  onBulkAdd: (ids: string[]) => Promise<void>;
  onReset: () => void;
}) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkReviewRow[]>([]);
  const [bulkWorking, setBulkWorking] = useState(false);
  const matchImport = useAction(api.importer.matchImport);

  const runBulkMatch = async (text: string) => {
    const lines = parseDelimitedImportText(
      text.slice(0, MAX_IMPORT_TEXT_CHARS),
    );
    if (lines.length === 0) {
      toast.error("Paste a list or upload a file first");
      return;
    }

    setBulkWorking(true);
    try {
      const matches = await matchImport({ lines });
      const rows = buildBulkReviewRows(matches, completed);
      setBulkRows(rows);
      const importable = countImportableRows(rows, completed);
      toast.success(
        importable > 0
          ? `Found ${importable} fells ready to add`
          : "No new fells ready yet — review the matches",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not match imported fells";
      toast.error(message);
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkFile = async (file: File | undefined) => {
    if (!file) return;
    setBulkWorking(true);
    try {
      const text = (await extractBulkImportText(file)).slice(
        0,
        MAX_IMPORT_TEXT_CHARS,
      );
      setBulkText(text);
      await runBulkMatch(text);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not read that file. Try CSV or pasted text.";
      toast.error(message);
    } finally {
      setBulkWorking(false);
    }
  };

  const selectBulkCandidate = (rowIndex: number, id: string) => {
    setBulkRows((rows) =>
      rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              selectedId: id,
              status: completed.has(id) ? "already-bagged" : "ready",
            }
          : row,
      ),
    );
  };

  const addSelectedBulkRows = async () => {
    const ids = Array.from(
      new Set(
        bulkRows
          .map((row) => row.selectedId)
          .filter(
            (id): id is string => typeof id === "string" && !completed.has(id),
          ),
      ),
    );
    if (ids.length === 0) {
      toast.error("Select at least one new fell to add");
      return;
    }
    setBulkWorking(true);
    try {
      await onBulkAdd(ids);
      setBulkRows([]);
      setBulkText("");
    } finally {
      setBulkWorking(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Bulk add fells
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Paste text or load CSV, Excel, Word .docx, or plain text. AI finds
              Wainwright matches; you confirm anything ambiguous before it
              changes your journal.
            </p>
          </div>
          {bulkRows.length > 0 && (
            <Badge variant="secondary" className="shrink-0 rounded-full">
              {countImportableRows(bulkRows, completed)} ready
            </Badge>
          )}
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="bulk-import-text"
            className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground"
          >
            paste list
          </label>
          <Textarea
            id="bulk-import-text"
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"Scafell Pike\nHelvellyn, 2024-05-02\nHigh Raise"}
            className="min-h-24 bg-background/80"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept={IMPORTABLE_FILE_TYPES}
              onChange={(event) => {
                void handleBulkFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <span className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground">
              <HugeiconsIcon icon={Upload04Icon} strokeWidth={1.6} /> Load file
            </span>
          </label>
          <Button
            type="button"
            className="rounded-full"
            disabled={bulkWorking}
            onClick={() => void runBulkMatch(bulkText)}
          >
            {bulkWorking ? "Finding matches…" : "Find matches"}
          </Button>
        </div>

        {bulkRows.length > 0 && (
          <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-2">
            <div className="max-h-80 overflow-auto pr-1">
              <div className="grid gap-2">
                {bulkRows.map((row, index) => (
                  <div
                    key={`${row.sourceText}-${index}`}
                    className="rounded-xl border border-border/70 bg-card/80 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {row.sourceText}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.status === "needs-choice"
                            ? "Choose the right fell"
                            : row.status === "already-bagged"
                              ? "Already in your journal"
                              : row.status === "no-match"
                                ? "No confident match"
                                : "Ready to add"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          row.status === "ready" ? "default" : "secondary"
                        }
                        className="shrink-0 rounded-full"
                      >
                        {row.status === "needs-choice"
                          ? "confirm"
                          : row.status === "no-match"
                            ? "skip"
                            : row.status === "already-bagged"
                              ? "done"
                              : "add"}
                      </Badge>
                    </div>

                    {row.candidates.length > 0 && (
                      <div className="mt-2 grid gap-1.5">
                        {row.candidates.map((candidate) => (
                          <label
                            key={candidate.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5 text-sm transition",
                              row.selectedId === candidate.id
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background/60 hover:bg-accent/50",
                            )}
                          >
                            <input
                              type="radio"
                              name={`bulk-match-${index}`}
                              className="mt-1"
                              checked={row.selectedId === candidate.id}
                              onChange={() =>
                                selectBulkCandidate(index, candidate.id)
                              }
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {candidate.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {Math.round(candidate.confidence * 100)}%
                                {candidate.reason
                                  ? ` · ${candidate.reason}`
                                  : ""}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="button"
              className="rounded-full"
              disabled={
                bulkWorking || countImportableRows(bulkRows, completed) === 0
              }
              onClick={() => void addSelectedBulkRows()}
            >
              Add selected fells
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
        <p className="text-sm font-semibold text-destructive">
          Reset all progress
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          This will reset all of your bagged fells, dates, notes, and saved
          photos from your journal.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setResetDialogOpen(true)}
          className="mt-3 rounded-full"
        >
          <HugeiconsIcon icon={ReloadIcon} strokeWidth={1.6} /> Reset all
        </Button>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="reset-confirmation-dialog">
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription>
              This will reset all of your bagged fells, dates, notes, and saved
              photos. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onReset();
                setResetDialogOpen(false);
              }}
            >
              Reset all progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
