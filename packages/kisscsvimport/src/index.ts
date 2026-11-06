import { CSVImportDialog } from "./csvImportDialog";

if (!customElements.get("csv-import-dialog")) {
  customElements.define("csv-import-dialog", CSVImportDialog);
}

declare global {
  interface HTMLElementTagNameMap {
    "csv-import-dialog": CSVImportDialog;
  }
}

export { CSVImportDialog };
