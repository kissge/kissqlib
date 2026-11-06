/**
 * localStorageを使った簡易的なパスワード認証
 * @param hashString - パスワードと比較するハッシュ値
 * @param storageKey - localStorageに保存するキー名
 */
export async function isUnlocked(
  hashString: string = "624233c0268fe544d136c26a3a0a966e3cda0cb7bd1452c5ba9d641e490861b4",
  storageKey: string = "hash",
): Promise<boolean> {
  return (
    typeof window !== "undefined" &&
    (await hash(window.localStorage.getItem(storageKey) ?? "")) === hashString
  );
}

/**
 * パスワードをハッシュ化してlocalStorageに保存する
 * @param value - パスワード文字列
 * @param storageKey - localStorageに保存するキー名
 */
export async function setPassword(value: string, storageKey: string = "hash") {
  const hex1 = await hash(value.trim());
  const hex2 = await hash(hex1);
  const hex3 = await hash(hex2);

  window.localStorage.setItem(storageKey, hex3);
}

async function hash(value: string) {
  const encoder = new TextEncoder();
  const buffer = await window.crypto.subtle.digest("SHA-256", encoder.encode(value));

  return (new Uint8Array(buffer) as any).toHex();
}

/** AmazonのほしいものリストURL */
export const wishlistURL = "https://www.amazon.co.jp/hz/wishlist/ls/1E7FJD98L3TW6?sort=custom";
/** 作者のXアカウントURL */
export const authorURL = "https://x.com/_kidochan";
