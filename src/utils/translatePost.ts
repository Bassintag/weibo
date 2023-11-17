import { Post } from "../domain/Post";

const translateText = async (
  text: string[],
  deeplApiKey: string,
): Promise<string[]> => {
  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      source_lang: "ZH",
      target_lang: "EN",
    }),
  });
  const body = await response.json();
  return (body.translations as any[]).map((translation) => translation.text);
};

export const translatePosts = async (post: Post[], deeplApiKey: string) => {
  const translations = await translateText(
    post.map((p) => p.text),
    deeplApiKey,
  );
  for (let i = 0; i < translations.length; i++) {
    post[i].text = translations[i];
  }
};
