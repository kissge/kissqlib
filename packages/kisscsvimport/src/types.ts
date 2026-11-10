import type { CSVImportDialog } from "./csvImportDialog";

declare global {
  interface HTMLElementTagNameMap {
    "csv-import-dialog": CSVImportDialog;
  }
}

export type { ImportedQuestion } from "./csvImportDialog";
