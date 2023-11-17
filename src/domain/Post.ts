export interface Post {
  id: string;
  timestamp: string;
  author: {
    id: string;
    name: string;
    image: Buffer;
    color: number;
  };
  text: string;
  images: Buffer[];
}
