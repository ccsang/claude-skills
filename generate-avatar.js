// Generate WeChat avatar: Dragon Ball style monk
const GeminiImageClient = require('./skills/gemini-image-generator/src/lib/gemini-client');

async function generateWeChatAvatar() {
  console.log('🎨 正在生成微信头像：鸟山明龙珠风格的戴眼镜光头和尚在傻笑');

  const client = new GeminiImageClient();

  try {
    const result = await client.generateImage(
      '鸟山明龙珠风格的戴眼镜光头和尚在傻笑，微信头像尺寸，动漫风格，表情夸张有趣',
      {
        theme: 'anime',
        aspectRatio: '1:1',  // 微信头像通常是正方形
        style: 'Dragon Ball Z anime style, Akira Toriyama art style, expressive face, big smile, glasses',
        imageSize: '1K',
        enableGoogleSearch: true,  // 获取更多鸟山明风格参考
        onProgress: (progress) => {
          if (progress.type === 'image') {
            console.log(`✅ 头像已生成: ${progress.fileName}`);
            console.log(`📂 保存路径: ${progress.path}`);
          } else if (progress.type === 'text') {
            console.log(`📝 生成说明: ${progress.content.slice(0, 80)}...`);
          }
        }
      }
    );

    if (result.success) {
      console.log('\n🎉 微信头像生成成功！');
      console.log('📁 文件位置:', result.images[0].path);
      console.log('🎨 风格:', result.metadata.theme);
      console.log('⚡ 尺寸:', result.metadata.imageSize);
      console.log('🔍 搜索增强:', result.metadata.enableGoogleSearch ? '已启用' : '未启用');

      if (result.text) {
        console.log('💬 附加说明:', result.text.slice(0, 100) + '...');
      }

      console.log('\n✨ 您的微信头像已经准备就绪！');
      console.log('💡 提示：图片已保存到 ./output/ 目录中');

    } else {
      console.error('❌ 生成失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

// 检查API密钥
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ 错误: 需要设置 GEMINI_API_KEY 环境变量');
  console.log('\n请设置您的 Gemini API 密钥:');
  console.log('export GEMINI_API_KEY=your_api_key_here');
  process.exit(1);
}

// 生成头像
generateWeChatAvatar().catch(console.error);