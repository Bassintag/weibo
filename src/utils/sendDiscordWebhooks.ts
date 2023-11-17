import { Post } from "../domain/Post";
import FormData from "form-data";

interface WebhookImage {
  id: number;
  url: string;
  buffer: Buffer;
  display: boolean;
}

class DiscordWebhookBuilder {
  private images: WebhookImage[] = [];
  private embed: any;

  setEmbed(embed: any) {
    this.embed = embed;
  }

  addImage(buffer: Buffer, display: boolean = true): WebhookImage {
    const id = this.images.length;
    const image: WebhookImage = {
      id,
      url: `attachment://file${id}.webp`,
      buffer,
      display,
    };
    this.images.push(image);
    return image;
  }

  build(): FormData {
    const form = new FormData();
    const embedPayload = JSON.stringify({
      embeds: [
        this.embed,
        ...this.images
          .filter((i) => i.display)
          .map((i) => ({
            url: this.embed.url,
            image: { url: i.url },
          })),
      ],
    });
    form.append("payload_json", embedPayload, {
      contentType: "application/json",
    });
    for (let i = 0; i < this.images.length; i++) {
      const image = this.images[i];
      form.append(`file[${i}]`, image.buffer, {
        filename: `file${i}.webp`,
        contentType: "image/webp",
      });
    }
    return form;
  }
}

const sendDiscordWebhook = async (post: Post, webhookUrl: string) => {
  const builder = new DiscordWebhookBuilder();
  const authorImage = builder.addImage(post.author.image, false);
  const blogUrl = `https://weibo.com/u/${post.author.id}`;
  builder.setEmbed({
    url: blogUrl,
    description: post.text,
    color: post.author.color,
    timestamp: post.timestamp,
    thumbnail: {
      url: authorImage.url,
    },
    author: {
      name: post.author.name,
      url: blogUrl,
      icon_url: authorImage.url,
    },
    footer: {
      text: blogUrl,
    },
  });
  for (const image of post.images) {
    builder.addImage(image);
  }
  const form = builder.build();

  const buff = form.getBuffer();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: form.getHeaders(),
    body: buff,
  });

  if (!response.ok) {
    console.log(response.status, await response.text());
  }
};

export const sendDiscordWebhooks = async (
  posts: Post[],
  webhookUrl: string,
) => {
  for (const post of posts) {
    await sendDiscordWebhook(post, webhookUrl);
  }
};
