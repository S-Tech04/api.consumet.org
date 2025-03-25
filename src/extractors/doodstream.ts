import axios from 'axios';
import { IVideo } from '@consumet/extensions';

class DoodStream {
  name = 'DoodStream';
  protected mainUrl = 'https://dood.la';
  protected alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  async extract(videoUrl: URL): Promise<IVideo> {
    try {
      const embedUrl = videoUrl.href.replace('/d/', '/e/');
      const response = await axios.get(embedUrl);
      const host = this.getBaseUrl(response.request.res.responseUrl);
      const html = response.data;

      const md5Match = html.match(/\/pass_md5\/([^']*)/);
      if (!md5Match) {
        throw new Error('Could not find MD5 token');
      }

      const md5 = host + '/pass_md5/' + md5Match[1];
      const md5Response = await axios.get(md5, {
        headers: {
          Referer: response.request.res.responseUrl
        }
      });

      const token = md5.split('/').pop();
      const trueUrl = md5Response.data + this.createHashTable() + '?token=' + token;

      const qualityMatch = html.match(/<title>([^<]*)<\/title>/);
      let quality = '720';
      if (qualityMatch) {
        const title = qualityMatch[1];
        const qualityRegex = /(\d{3,4})p/.exec(title);
        if (qualityRegex) {
          quality = qualityRegex[1];
        }
      }

      return {
        url: videoUrl.href,
        sources: [
          {
            url: trueUrl,
            isM3U8: false,
            quality: quality + 'p',
          },
        ],
        subtitles: [],
      };
    } catch (error) {
      console.error('Error extracting DoodStream video:', error);
      throw error;
    }
  }

  private getBaseUrl(url: string): string {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  }

  private createHashTable(): string {
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += this.alphabet.charAt(Math.floor(Math.random() * this.alphabet.length));
    }
    return result;
  }
}

export default DoodStream;
