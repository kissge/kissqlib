import { html, nothing, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";

import { parseCSV } from "./parse";

import style from "./style.css?inline";

@customElement("csv-import-dialog")
export class CSVImportDialog extends LitElement {
  @property({ type: Boolean, reflect: true })
  open: boolean = false;

  dialog = createRef<HTMLDialogElement>();

  @state()
  stage: 1 | 2 = 1;

  @state()
  rawText: string = "";

  @state()
  config: {
    hasHeader: "true" | "false";
    delimiter: "comma" | "tab" | "auto";
    googleSheetsMode?: "on";
    question: string;
    answer: string;
    comment: string;
  } = { hasHeader: "false", delimiter: "auto", question: "0", answer: "1", comment: "" };

  render() {
    return html`<dialog closedby="any" ${ref(this.dialog)} @close=${this.onClose}>
      ${this.header}${this.stage === 1 ? this.main1 : this.main2}
      <style>
        ${style}
      </style>
    </dialog>`;
  }

  willUpdate(changedProperties: Map<string, any>) {
    if (!this.dialog.value) {
      return;
    }

    if (changedProperties.has("open")) {
      if (this.open) {
        this.rawText = "";
        this.stage = 1;
        this.dialog.value.showModal();
      } else {
        this.dialog.value.close();
      }
    }
  }

  get header() {
    return html`<header>
      <h1>
        ${
          this.stage === 1
            ? html`<div>問題を読み込む</div>`
            : html`
                <div>
                  <button class="back-btn" @click=${() => (this.stage = 1)}>←</button>
                  読み込み設定
                </div>
              `
        }
      </h1>
      <div class="spacer"></div>
      <button class="close-btn" @click=${() => this.dialog.value!.close()}>×</button>
    </header>`;
  }

  get main1() {
    return html`<main>
      <div class="input-area">
        <fieldset>
          <legend>ファイルから読み込む</legend>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            @change=${(e: Event) => this.handleFileInput(e.currentTarget as HTMLInputElement)}
          />
        </fieldset>

        <div>or</div>

        <fieldset>
          <legend>コピペして読み込む</legend>

          <p>この下にCSVまたはTSV形式のデータを貼り付けてください。</p>

          <textarea
            autofocus
            rows="5"
            placeholder="ここだよ"
            .value=${this.rawText}
            @change=${(e: Event) => (this.rawText = (e.currentTarget as HTMLTextAreaElement).value)}
            @keyup=${(e: Event) => (this.rawText = (e.currentTarget as HTMLTextAreaElement).value)}
          ></textarea>

          <p style:font-size="0.8em">
            ヒント：スプレッドシート上で質問と回答の列を選択してコピーするとTSV形式になります。
          </p>
        </fieldset>
      </div>

      <div class="buttons">
        <button
          ?disabled=${!this.rawText.trim()}
          @click=${() => {
            this.config = { ...this.config, question: "0", answer: "1", comment: "2" };
            this.setDelimiter("auto");
            this.stage = 2;
          }}
        >
          データを読み込んで、取り込み方の設定へ進む
        </button>
      </div>
    </main>`;
  }

  get main2() {
    return html`<main>
      <form class="table">
        <div>1行目</div>
        <div>
          <label>
            <input
              type="radio"
              name="hasHeader"
              value="true"
              .checked=${this.config.hasHeader === "true"}
              @click=${() => {
                this.config = { ...this.config, hasHeader: "true" };
              }}
            />
            ヘッダーとして扱う
          </label>
          <label>
            <input
              type="radio"
              name="hasHeader"
              value="false"
              .checked=${this.config.hasHeader === "false"}
              @click=${() => {
                this.config = { ...this.config, hasHeader: "false" };
              }}
            />
            問題データの1件目として扱う
          </label>
        </div>
        <div>データ形式</div>
        <div>
          <label>
            <input
              type="radio"
              name="delimiter"
              value="comma"
              .checked=${this.config.delimiter === "comma"}
              @click=${() => this.setDelimiter("comma")}
            />
            CSV
          </label>
          <label>
            <input
              type="radio"
              name="delimiter"
              value="tab"
              .checked=${this.config.delimiter === "tab"}
              @click=${() => this.setDelimiter("tab")}
            />
            TSV
          </label>
          <label>
            <input
              type="radio"
              name="delimiter"
              value="auto"
              .checked=${this.config.delimiter === "auto"}
              @click=${() => this.setDelimiter("auto")}
            />
            自動判定
          </label>
          <br />
          <br />
          <label>
            <input
              type="checkbox"
              name="googleSheetsMode"
              .checked=${this.config.googleSheetsMode}
              @click=${() => {
                this.config = {
                  ...this.config,
                  googleSheetsMode: this.config.googleSheetsMode ? undefined : "on",
                  delimiter: this.config.googleSheetsMode ? this.config.delimiter : "tab",
                };
              }}
            />
            Google Sheetsからコピペした、ぶっ壊れているかもしれないデータをなるべくいい感じにする
          </label>
        </div>

        <div>列の対応</div>
        <div class="table-wrapper">
          ${(
            [
              { name: "question", label: "質問" },
              { name: "answer", label: "回答" },
              { name: "comment", label: "コメント" },
            ] as const
          ).map(
            ({ name, label }) =>
              html` <div>${label}</div>
                <div>
                  <select
                    name="${name}"
                    @change=${(e: Event) => {
                      const value = (e.currentTarget as HTMLSelectElement).value;
                      this.config = { ...this.config, [name]: value };
                    }}
                  >
                    <option value="" .selected=${this.config[name] === ""}>なし</option>
                    ${this.rowLabels.map(
                      ({ key, label }) =>
                        html`<option value="${key}" .selected=${this.config[name] === String(key)}>
                          ${label}
                        </option>`,
                    )}
                  </select>
                </div>`,
          )}
        </div>
      </form>

      <div class="preview">
        <p>プレビュー</p>

        <table>
          <thead>
            <tr>
              <th>質問</th>
              <th>回答</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            ${this.table.map(
              ({ question, answer, comment }) => html`
                <tr>
                  <td><div>${question}</div></td>
                  <td><div>${answer}</div></td>
                  <td><div>${comment}</div></td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>

      <div class="buttons">
        <span>
          ${this.table.length === 0 ? "取り込むデータがありません。" : this.config.question === "" || this.config.answer === "" ? "質問と回答の列を選択してください。" : nothing}
        </span>
        <button
          ?disabled=${this.table.length === 0 || this.config.question === "" || this.config.answer === ""}
          @click=${this.import}
        >
          取り込む
        </button>
      </div>
    </main>`;
  }

  get parsed() {
    return parseCSV(this.rawText, {
      googleSheetsMode: !!this.config.googleSheetsMode,
      delimiter: this.config.delimiter,
    });
  }

  get rowLabels() {
    if (!this.rawText) {
      return [];
    } else if (this.config.hasHeader === "true") {
      return Object.entries(this.parsed[0])
        .toSorted(([a], [b]) => Number(a) - Number(b))
        .filter(([, value]) => value)
        .map(([key, value]) => ({ key: Number(key), label: String(value).slice(0, 20) }));
    } else {
      const maxIndex = this.parsed.reduce(
        (max, row) =>
          Math.max(
            max,
            ...Object.entries(row)
              .filter(([, value]) => value)
              .map(([key]) => Number(key)),
          ),
        0,
      );
      return Array.from({ length: maxIndex + 1 }, (_, i) => ({
        key: i,
        label: `${i + 1}列目`,
      }));
    }
  }

  get table() {
    return this.parsed.slice(this.config.hasHeader === "true" ? 1 : 0).map((row, id) => ({
      id: id + 1,
      question: !this.config.question ? "" : row[Number(this.config.question)],
      answer: !this.config.answer ? "" : row[Number(this.config.answer)],
      comment: !this.config.comment ? "" : row[Number(this.config.comment)],
    }));
  }

  onClose() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  handleFileInput(element: HTMLInputElement) {
    const file = element.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.rawText = reader.result as string;
    };

    reader.readAsText(file);
  }

  setDelimiter(delimiter: "comma" | "tab" | "auto") {
    const googleSheetsMode = delimiter !== "tab" ? undefined : this.config.googleSheetsMode;

    this.config = { ...this.config, delimiter, googleSheetsMode };

    for (const name of ["question", "answer", "comment"] as const) {
      if (!this.rowLabels.some(({ key }) => key === Number(this.config[name]))) {
        this.config = { ...this.config, [name]: "" };
      }
    }
  }

  import() {
    this.dialog.value!.close();
    this.dispatchEvent(new CustomEvent("import", { detail: this.table }));
  }
}

export interface ImportedQuestion {
  id: number;
  question: string;
  answer: string;
  comment: string;
}
