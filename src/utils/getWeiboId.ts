export const getWeiboId = (url: string): string => {
  const match = url.match(/\/u\/(\d+)/);
  if (match == null) throw new Error("Failed to parse blog id");
  return match[1];
};
