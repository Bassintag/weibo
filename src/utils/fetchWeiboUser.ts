import { FetchWeibo } from "./fetchWeibo";

export const fetchWeiboUser = async (fetchWeibo: FetchWeibo, id: string) => {
  const response = await fetchWeibo(
    `https://weibo.com/ajax/profile/info?uid=${id}`,
  );
  return await response.json();
};
