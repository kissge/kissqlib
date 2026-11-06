import { html, render, nothing } from "lit-html";
import { createRef, ref } from "lit-html/directives/ref.js";
import { parseCSV } from "./parse";
import style from "./style.css?inline";

export class CSVImportDialog extends HTMLElement {
  static observedAttributes = ["open"];

  dialog = createRef<HTMLDialogElement>();

  rawText: string = "";
  config: {
    hasHeader: "true" | "false";
    delimiter: "comma" | "tab" | "auto";
    googleSheetsMode?: "on";
    question: string;
    answer: string;
    comment: string;
  } = {
    hasHeader: "false",
    delimiter: "auto",
    question: "0",
    answer: "1",
    comment: "",
  };

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });

    render(
      html`<dialog closedby="any" ${ref(this.dialog)}>
          ${this.header} ${this.main1} ${this.main2}
        </dialog>

        <style>
          ${style}
        </style>`,
      shadow,
    );
  }

  attributeChangedCallback(name: "open", _oldValue: string | null, newValue: string | null) {
    if (name === "open") {
      if (newValue) {
        this.dialog.value!.classList.remove("stage-2");
        this.dialog.value!.showModal();
      } else {
        this.dialog.value!.close();
      }
    }
  }

  get header() {
    return html`<header>
      <h1>
        <div class="shown-1">問題を読み込む</div>
        <div class="shown-2">
          <button class="back-btn" @click=${() => this.dialog.value!.classList.remove("stage-2")}>
            ←
          </button>
          読み込み設定
        </div>
      </h1>
      <div class="spacer"></div>
      <button class="close-btn" @click=${() => this.dialog.value!.close()}>×</button>
    </header>`;
  }

  get main1() {
    return html`<main class="shown-1">
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
            @change=${(e: Event) => (this.rawText = (e.currentTarget as HTMLTextAreaElement).value)}
          ></textarea>

          <p style:font-size="0.8em">
            ヒント：スプレッドシート上で質問と回答の列を選択してコピーするとTSV形式になります。
          </p>
        </fieldset>
      </div>

      <div class="buttons">
        <button @click=${() => this.clickNextButton()}>
          データを読み込んで、取り込み方の設定へ進む
        </button>
      </div>
    </main>`;
  }

  get main2() {
    return html`<main class="shown-2">
      <form class="table" @change=${() => this.handleFormChange()}>
        <div>1行目</div>
        <div>
          <label>
            <input type="radio" name="hasHeader" value="true" />
            ヘッダーとして扱う
          </label>
          <label>
            <input type="radio" name="hasHeader" value="false" checked />
            問題データの1件目として扱う
          </label>
        </div>

        <div>データ形式</div>
        <div>
          <label>
            <input type="radio" name="delimiter" value="comma" />
            CSV
          </label>
          <label>
            <input type="radio" name="delimiter" value="tab" />
            TSV
          </label>
          <label>
            <input type="radio" name="delimiter" value="auto" checked />
            自動判定
          </label>
          <br />
          <br />
          <label>
            <input type="checkbox" name="googleSheetsMode" />
            Google Sheetsからコピペした、ぶっ壊れているかもしれないデータをなるべくいい感じにする
          </label>
        </div>

        <div>列の対応</div>
        <div class="table-wrapper" id="row-mapping"></div>
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
          <tbody id="preview-tbody"></tbody>
        </table>
      </div>

      <div class="buttons">
        <button @click=${() => this.import()}>取り込む</button>
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
      question: row[Number(this.config.question)],
      answer: row[Number(this.config.answer)],
      comment: !this.config.comment ? "" : row[Number(this.config.comment)],
    }));
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

  clickNextButton() {
    if (!this.rawText) {
      alert("ファイルを選択するか、CSVまたはTSV形式のデータを貼り付けてください。");
      return;
    }

    this.handleFormChange();

    this.dialog.value!.classList.add("stage-2");
  }

  handleFormChange() {
    const form = this.dialog.value!.querySelector("form")!;
    const formData = new FormData(form);
    const newConfig = {
      ...this.config,
      ...Object.fromEntries(formData.entries()),
    } as typeof this.config;

    if (!this.config.googleSheetsMode && newConfig.googleSheetsMode) {
      if (newConfig.delimiter !== "tab") {
        newConfig.delimiter = "tab";
        (form.querySelector('input[value="tab"]') as HTMLInputElement).checked = true;
      }
    } else if (this.config.delimiter === "tab" && newConfig.delimiter !== "tab") {
      if (newConfig.googleSheetsMode) {
        newConfig.googleSheetsMode = undefined;
        (form.querySelector('input[name="googleSheetsMode"') as HTMLInputElement).checked = false;
      }
    }

    this.config = newConfig;

    render(
      html`${(
        [
          { name: "question", label: "質問" },
          { name: "answer", label: "回答" },
          { name: "comment", label: "コメント" },
        ] as const
      ).map(
        ({ name, label }) => html`
          <div>${label}</div>
          <div>
            <select name="${name}">
              ${
                name === "comment"
                  ? html`<option value="" ?selected=${this.config[name] === ""}>なし</option>`
                  : nothing
              }
              ${this.rowLabels.map(
                ({ key, label }) =>
                  html`<option value="${key}" ?selected=${this.config[name] === String(key)}>
                    ${label}
                  </option>`,
              )}
            </select>
          </div>
        `,
      )}`,
      this.dialog.value!.querySelector("#row-mapping")!,
    );

    render(
      html`${this.table.map(
        ({ question, answer, comment }) => html`
          <tr>
            <td><div>${question}</div></td>
            <td><div>${answer}</div></td>
            <td><div>${comment}</div></td>
          </tr>
        `,
      )}`,
      this.dialog.value!.querySelector("#preview-tbody")!,
    );
  }

  import() {
    this.dialog.value!.close();
    this.dispatchEvent(new CustomEvent("import", { detail: this.table }));
  }
}
