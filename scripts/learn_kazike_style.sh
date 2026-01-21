#!/bin/bash

# Define the style name
STYLE_NAME="madong-style"

# List of URLs to learn from
URLS=(
    "https://mp.weixin.qq.com/s/OgBJ52KkiBl4xWlDQQfnbw" # 你的AI女友
    "https://mp.weixin.qq.com/s/QcrZSrU0nxdpKqPBx8l6Lg" # Vibe Coding
    "https://mp.weixin.qq.com/s/7mVcw1KpCDZdrZZjebPl8g" # Kling O1
    "https://mp.weixin.qq.com/s/2CjsuJvDE5OhJhqurGE8kw" # 豆包手机助手" # DeepSeek
    "https://mp.weixin.qq.com/s/SOJv1djpD4eSADVabTN05A" # AI Girlfriend (Backup)
    "https://mp.weixin.qq.com/s/8CtfAwlLNSRkIOgHrYdsOA"
    "https://mp.weixin.qq.com/s/FIZeOLhDdQdBaSGiqTV1Vg"
    "https://mp.weixin.qq.com/s/-MGL0pi_QQRl4JtobylTjw"
    "https://mp.weixin.qq.com/s/uKydPt72xH97-fqmvkB4hg"
    "https://mp.weixin.qq.com/s/lrG7VkQEQdAQWUVusGrjMQ"
)

echo "Starting to learn style: $STYLE_NAME"

for url in "${URLS[@]}"; do
    echo "------------------------------------------------"
    echo "Learning from: $url"
    imitate-writing learn "$url" --name "$STYLE_NAME" || echo "Failed to learn from $url"
    echo "------------------------------------------------"
    sleep 2 # Pause to avoid rate limits
done

echo "Finished learning process."
imitate-writing list
