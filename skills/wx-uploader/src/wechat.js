import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import path from 'path';

export class WeChatAPI {
    constructor(appId, appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.accessToken = null;
        this.expiresAt = 0;
    }

    async getAccessToken() {
        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }

        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
        const response = await axios.get(url);

        if (response.data.errcode) {
            throw new Error(`Failed to get access token: ${response.data.errmsg}`);
        }

        this.accessToken = response.data.access_token;
        // Expire 5 minutes early to be safe
        this.expiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
        return this.accessToken;
    }

    /**
     * Upload an image to be used inside an article (returns URL).
     * @param {string} imagePath 
     */
    async uploadImage(imagePath) {
        const token = await this.getAccessToken();
        const runUrl = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;

        const form = new FormData();
        form.append('media', fs.createReadStream(imagePath), {
            filename: path.basename(imagePath)
        });

        const response = await axios.post(runUrl, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data.errcode) {
            throw new Error(`Failed to upload image ${imagePath}: ${response.data.errmsg}`);
        }

        return response.data.url;
    }

    /**
     * Upload a cover image (permanent material) (returns media_id + url).
     * @param {string} imagePath 
     */
    async uploadCover(imagePath) {
        const token = await this.getAccessToken();
        // Use add_material for permanent media (covers usually need to be permanent or temp, but drafts often use permanent)
        // Actually, for drafts, we often need a permanent media_id or a temp one. 
        // Let's use temporary media for simplicity if possible, but covers usually require permanent material or specifically 'image' type.
        // According to docs, thumb_media_id usually comes from permanent material or temp material. 
        // Let's try permanent material first as it's safer for drafts.
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

        const form = new FormData();
        form.append('media', fs.createReadStream(imagePath), {
            filename: path.basename(imagePath)
        });

        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data.errcode) {
            throw new Error(`Failed to upload cover ${imagePath}: ${response.data.errmsg}`);
        }

        return {
            media_id: response.data.media_id,
            url: response.data.url
        };
    }

    /**
     * Create a draft (not published yet).
     * @param {Object} article 
     */
    async addDraft(article) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

        const payload = {
            articles: [
                {
                    title: article.title,
                    author: article.author,
                    digest: article.digest,
                    content: article.content,
                    content_source_url: article.content_source_url,
                    thumb_media_id: article.thumb_media_id,
                    need_open_comment: article.need_open_comment || 0,
                    only_fans_can_comment: article.only_fans_can_comment || 0
                }
            ]
        };

        const response = await axios.post(url, payload);

        if (response.data.errcode) {
            throw new Error(`Failed to create draft: ${response.data.errmsg}`);
        }

        return response.data;
    }
}
