// 要素のためのクラスを作成
export class PopupInfo extends HTMLElement {
  constructor() {
    // コンストラクターでは super を常に最初に呼び出す
    super();
  }

  connectedCallback() {
    // シャドウルートを生成
    const shadow = this.attachShadow({ mode: "open" });

    // span 要素を生成
    const wrapper = document.createElement("button");

    wrapper.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("popup-info-click", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    const text = this.getAttribute("data-text");
    wrapper.textContent = text;

    // いくらかの CSS を生成してシャドウ DOM に適用
    const style = document.createElement("style");
    console.log(style.isConnected);

    style.textContent = `
      button {
        color: pink;
      }
    `;

    // 生成要素をシャドウ DOM に結びつける
    shadow.appendChild(style);
    console.log(style.isConnected);
    shadow.appendChild(wrapper);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    console.log(`Attribute ${name} has changed. ${oldValue} -> ${newValue}`);
  }
}

if (!customElements.get("popup-info")) {
  customElements.define("popup-info", PopupInfo);
}

declare global {
  interface HTMLElementTagNameMap {
    "popup-info": PopupInfo;
  }
}
