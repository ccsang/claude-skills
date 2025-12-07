# AI Image Generator Skill - 使用指南

## 🎯 技能概述

这个 Claude Code 技能使用 Google 的 Gemini API 生成高质量 AI 图像，支持多种艺术主题和自定义宽高比。

## 🚀 基本使用方法

### 1. 设置环境变量
```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

### 2. 在 Claude Code 中使用技能

#### 基础命令
```
node scripts/generate.js "a beautiful sunset over mountains"
```

#### 完整选项命令
```
node scripts/generate.js "futuristic cyberpunk city" --theme anime --ratio 16:9 --save --quality 95
```

## 🎨 支持的艺术主题

| 主题 | 描述 | 示例 |
|------|------|------|
| `photorealistic` | 照片级真实感 | 专业摄影，自然光照 |
| `anime` | 动漫风格 | 日式动画，鲜艳色彩 |
| `oil-painting` | 油画风格 | 经典艺术，可见笔触 |
| `watercolor` | 水彩画 | 柔和边缘，透明色彩 |
| `digital-art` | 数字艺术 | 现代，干净，专业 |
| `sketch` | 素描 | 铅笔，炭笔，线条艺术 |
| `impressionist` | 印象派 | 松散笔触，光影效果 |
| `surreal` | 超现实 | 梦幻，抽象，想象力 |
| `cyberpunk` | 赛博朋克 | 霓虹色彩，未来主义 |
| `fantasy` | 奇幻 | 魔法，空灵，神话 |
| `vintage` | 复古 | 怀旧，经典，复古感 |
| `minimalist` | 极简主义 | 简洁，干净，基本元素 |

## 📐 支持的宽高比

| 比例 | 用途 | 描述 |
|------|------|------|
| `1:1` | 正方形 | 头像，社交媒体 |
| `16:9` | 宽屏电影 | 电影感，风景 |
| `4:3` | 标准格式 | 传统摄影 |
| `3:2` | 摄影标准 | 经典相机比例 |
| `2:1` | 全景 | 宽幅风景 |
| `9:16` | 竖屏 | 手机故事格式 |
| `3:4` | 竖版肖像 | 传统肖像 |

## 💡 使用示例

### 示例 1: 生成真实风景
```bash
node scripts/generate.js "serene mountain landscape at sunset with golden light" --theme photorealistic --ratio 16:9 --save
```

### 示例 2: 动漫角色
```bash
node scripts/generate.js "futuristic cyberpunk character with neon accessories" --theme anime --ratio 1:1 --quality 95 --save
```

### 示例 3: 艺术绘画
```bash
node scripts/generate.js "vintage car on country road" --theme oil-painting --ratio 4:3 --style "impressionist style" --save --output-dir ./artwork
```

### 示例 4: 抽象艺术
```bash
node scripts/generate.js "geometric patterns with flowing shapes" --theme surreal --ratio 1:1 --style "vibrant colors" --quality 90
```

### 示例 5: 极简设计
```bash
node scripts/generate.js "clean geometric logo" --theme minimalist --ratio 1:1 --save --filename my-logo
```

## ⚙️ 命令选项

| 选项 | 简写 | 类型 | 默认值 | 描述 |
|------|------|------|--------|------|
| `--theme` | `-t` | string | `photorealistic` | 艺术主题 |
| `--ratio` | `-r` | string | `16:9` | 宽高比 |
| `--style` | `-s` | string | `""` | 附加风格描述 |
| `--quality` | `-q` | number | `80` | 图像质量 (1-100) |
| `--save` | | boolean | `false` | 保存图像到文件 |
| `--output-dir` | | string | `./output` | 输出目录 |
| `--filename` | | string | 自动生成 | 自定义文件名 |
| `--verbose` | `-v` | boolean | `false` | 详细输出 |

## 🔧 高级功能

### 调试模式
```bash
node scripts/generate.js "test image" --verbose
```

### 批量生成
```bash
node scripts/generate.js "mountain landscape" --theme photorealistic --save
node scripts/generate.js "same mountain" --theme anime --save
node scripts/generate.js "same mountain" --theme watercolor --save
```

### 自定义保存路径
```bash
node scripts/generate.js "my artwork" --save --output-dir ~/Documents/AI_Art --filename my-masterpiece
```

## ✅ 输入验证

技能会自动验证：

- **提示词**: 3-1000字符，排除有害内容
- **主题**: 必须是支持的主题之一
- **宽高比**: 必须是支持的格式
- **质量**: 1-100范围内
- **文件名**: 安全字符，长度限制
- **路径**: 防止目录遍历攻击

## 📁 输出文件

### 文件命名规则
```
{prompt-slug}-{theme}-{timestamp}.png
```

例如：`beautiful-sunset-over-mountains-photorealistic-2025-01-15T10-30-45-123Z.png`

### 保存位置
- 默认：`./output/`
- 可自定义：`--output-dir /path/to/directory`

## ❌ 错误处理

常见错误及解决方法：

### API Key 错误
```
❌ Error: GEMINI_API_KEY environment variable is required
```
**解决**: 设置环境变量 `export GEMINI_API_KEY="your_key"`

### 无效主题
```
❌ Error: Invalid theme "invalid-theme". Valid themes are: photorealistic, anime, oil-painting...
```
**解决**: 使用支持的主题之一

### 提示词太短
```
❌ Error: Prompt must be at least 3 characters long
```
**解决**: 提供更详细的提示词

### 文件保存错误
```
❌ Error: Failed to save image: Permission denied
```
**解决**: 检查目录权限或使用不同的输出目录

## 🧪 测试技能

运行演示脚本查看技能功能：
```bash
node demo-skill-usage.js
```

运行测试套件：
```bash
npm test
```

验证技能结构：
```bash
node scripts/validate-skill.js
```

## 🌟 最佳实践

1. **提示词技巧**：
   - 使用描述性语言
   - 包含情感和氛围
   - 指定光照和颜色

2. **主题选择**：
   - 根据内容选择合适主题
   - 实验不同主题找到最佳效果

3. **质量设置**：
   - 80-90适合大多数用途
   - 95+用于高质量打印

4. **文件管理**：
   - 使用自定义文件名便于管理
   - 按主题组织输出目录

## 📊 性能信息

- **平均生成时间**: 2-10秒
- **支持图像尺寸**: 最大1024x1024
- **输出格式**: PNG
- **最大提示词长度**: 1000字符

## 🆘 故障排除

1. **网络问题**: 确保能访问Google API
2. **API限制**: 检查Gemini API使用配额
3. **权限问题**: 确保输出目录有写入权限
4. **版本兼容**: 确保Node.js版本>=16.0.0

## 📞 支持

如遇问题：
1. 检查环境变量设置
2. 启用verbose模式查看详细信息
3. 运行验证脚本检查配置
4. 查看测试结果确认功能正常

---

🎨 **开始创作您的AI艺术作品吧！**