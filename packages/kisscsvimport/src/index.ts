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
    const wrapper = document.createElement("span");
    wrapper.setAttribute("class", "wrapper");

    const icon = document.createElement("span");
    icon.setAttribute("class", "icon");
    icon.setAttribute("tabindex", "0");

    const info = document.createElement("span");
    info.setAttribute("class", "info");

    // 属性の中身を取得し、情報 span の中に入れる
    const text = this.getAttribute("data-text");
    info.textContent = text;

    // アイコンを挿入
    let imgUrl;
    if (this.hasAttribute("img")) {
      imgUrl = this.getAttribute("img")!;
    } else {
      imgUrl = "img/default.png";
    }

    const img = document.createElement("img");
    img.src = imgUrl;
    icon.appendChild(img);

    // いくらかの CSS を生成してシャドウ DOM に適用
    const style = document.createElement("style");
    console.log(style.isConnected);

    style.textContent = `
      .wrapper {
        position: relative;
      }

      .info {
        font-size: 0.8rem;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        border-radius: 10px;
        opacity: 0;
        transition: 0.6s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }

      img {
        width: 1.2rem;
      }

      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
      }
    `;

    // 生成要素をシャドウ DOM に結びつける
    shadow.appendChild(style);
    console.log(style.isConnected);
    shadow.appendChild(wrapper);
    wrapper.appendChild(icon);
    wrapper.appendChild(info);
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
