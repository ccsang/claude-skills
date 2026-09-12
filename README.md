# Skills 统一维护仓库

所有自行创建和维护的 skills 统一以 [ccsang/claude-skills](https://github.com/ccsang/claude-skills) 为源头，保留原仓库名称与历史，同时服务 Codex 和 Claude Code。

**仓库维护，按项目安装。** 不默认安装到个人或全局目录；用户指定项目后，只安装需要的 skill。

## 技能目录

| Skill | 用途 |
| --- | --- |
| [creative-design-workflow](skills/creative-design-workflow/SKILL.md) | 创意设计三阶段：发散、独立截图评审、生成媒体、交付做减法 |
| [ai-image](skills/ai-image/SKILL.md) | AI 图片生成 |
| [ydl-js](skills/ydl-js/SKILL.md) | YouTube 字幕下载 |
| [youtube-search](skills/youtube-search/SKILL.md) | YouTube 搜索 |
| [wx-uploader](skills/wx-uploader/SKILL.md) | 微信内容上传 |
| [imitate-writing](skills/imitate-writing/SKILL.md) | 写作风格模仿 |
| [ai-detect](skills/ai-detect/SKILL.md) | AI 文本检测 |

每项独立放在 skills/<name>/，入口为 SKILL.md，按需包含 references/、scripts/、assets/、agents/。纯指令技能不需要 package.json。现有 Claude 插件注册保留在 [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json)。

## 安装到指定项目

本次仅维护仓库，不向任何项目自动安装。以后在仓库根目录执行以下示例；将目标路径替换为真实项目：

```sh
project_dir=/absolute/path/to/project
test -d "$project_dir" && \
mkdir -p "$project_dir/.agents/skills" && \
test ! -e "$project_dir/.agents/skills/creative-design-workflow" && \
cp -R skills/creative-design-workflow "$project_dir/.agents/skills/"
git rev-parse HEAD
```

Codex 项目路径依据 [官方技能文档](https://learn.chatgpt.com/docs/build-skills)。Claude Code 项目使用 .claude/skills/。复制整个 skill 目录，保留相对引用。目标已存在时先比较改动，不直接覆盖。将源提交号记录到目标项目的维护说明，作为安装版本。

项目中的副本是固定版本；更新仓库不会自动改变已安装项目。共享改进先回到本仓库，验证并提交后，再按用户要求同步到指定项目，保留该项目的定制。

## 维护流程

1. 在 skills/<name>/ 新增或修改技能，保持触发范围准确、步骤可执行、引用为相对路径。
2. 新增或删除时同步更新上方目录及 marketplace 注册。
3. 执行下方验证。脚本技能另跑相关功能测试；纯指令变更无需安装 Node 依赖。
4. 提交并推送，使用 Git 历史追踪版本。记录真实试跑结果，不将格式校验等同于行为验证。
5. 用户要求安装时，选择目标项目和具体技能，不自动安装整个合集。

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python scripts/validate_skills.py
```

GitHub Actions 自动检查技能元数据与注册覆盖。Node.js 工具沿用 pnpm workspaces；安装依赖用 pnpm，功能测试按对应技能说明执行。

creative-design-workflow 的图片、视频、独立评审需要宿主具备对应能力；缺能力时按技能说明披露和降级。原文与改编说明保留在其 references/sources.md。
