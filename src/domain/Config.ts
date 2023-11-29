export interface BlogConfig {
  alias?: string;
  name?: string;
  url: string;
}

export interface Config {
  deeplApiKey: string;
  webhooks: string[];
  blogs: BlogConfig[];
  cookies?: string[];
}
