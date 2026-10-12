# AlgoVision

Cloudflare-first algorithm execution workspace. The current runnable slice includes a React problem browser and editor, Hono Worker API, D1-backed accounts and problem administration, Queue execution, a Python Container runner, R2 code snapshots and compressed trace storage, and a dockable problem/editor workspace with solution diagrams.

## Local setup

Requires Node 22+, pnpm 10+, Wrangler 4+, and a Cloudflare account with Containers enabled. Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and set a long bootstrap token. Keep this file private.

```sh
pnpm install
pnpm db:generate
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

The web UI is at `http://localhost:5173`, admin UI at `http://localhost:5174`, and API at `http://localhost:8787`. To create the first administrator, call `POST /api/auth/bootstrap` with JSON `{ "email", "password", "displayName", "token" }`. This route refuses subsequent bootstraps once an admin exists. Remove `ADMIN_BOOTSTRAP_TOKEN` from the deployed Worker after bootstrap.

The local API can use Docker-compatible Container support. Wrangler 4.149 passes `--provenance=false` to builds, which Podman 5.8 does not accept, and its local network sidecar failed under this Podman machine's cgroup v2 setup. On Apple Silicon, the following verified fallback runs the real runner in Podman while Wrangler handles Worker, Queue, D1, and R2:

```sh
podman build --platform linux/arm64 -t localhost/algovision-python-arm64:dev -f containers/python-runner/Dockerfile containers/python-runner
podman run --rm -d --name algovision-runner-local -p 127.0.0.1:8081:8080 localhost/algovision-python-arm64:dev
# Set LOCAL_RUNNER_URL=http://localhost:8081 in apps/api/.dev.vars
pnpm --filter @algovision/api exec wrangler dev --local --enable-containers=false
```

Use `podman stop algovision-runner-local` when done. This local-only path was tested end to end with trusted sample code. It reuses one Runner container and is not an isolation boundary for untrusted users; do not set `LOCAL_RUNNER_URL` in staging or production. `wrangler dev` stores D1, R2, and KV state locally unless explicitly configured otherwise.

## Capability status

| Capability | Status |
| --- | --- |
| Problem catalog and admin problem CRUD | Implemented against D1 |
| User registration, login and saved code | Implemented against D1 |
| Python output and line/variable trace | Verified locally with Podman; Cloudflare deployment not verified |
| Two Sum explanatory diagram | Hash table scenes generated from test input; independent of editor code |
| JavaScript, TypeScript, Java, C, C++, Go, Rust | Editor templates, syntax highlighting and local drafts implemented; runners planned |
| Tags, languages, test cases, code templates, examples, visualizations, settings CRUD | Implemented against D1 |
| Role and permission definitions | D1 CRUD; assignment and granular checks not complete |
| User, execution, and object management | Partial read-only views; not complete |
| OpenAPI document | Health route documented; remaining route schemas pending |
| Live push and cancellation | Planned; current UI polls |
| Hardened untrusted-code isolation | Requires target-environment security validation |

See [Cloudflare deployment](docs/cloudflare-deployment.md) before deploying.

## 主题与统一组件

主题规范保存在 [`saas-theme-prompt.xml`](saas-theme-prompt.xml)，其中完整保留 Linear / Modern prompt，并定义后续主题的接入约定。

- `packages/ui/src/themes/linear.css`：默认主题的语义 CSS 变量，包含深浅模式。
- `packages/ui/src/theme-provider.tsx`：读取 CSS 变量并统一配置 Ant Design `ConfigProvider` 和中文语言包。
- `packages/ui/src/index.tsx`：共用 Ant Design 按钮、弹窗、输入框、下拉框、标签和空状态。业务页面统一从 `@algovision/ui` 导入。
- `packages/ui/src/styles.css`：共用组件样式；业务 CSS 通过 `var(--accent)`、`var(--bg)` 等变量引用主题。

新增主题时，在 `packages/ui/src/themes/<theme-id>.css` 覆盖相同变量，并在共享 `styles.css` 导入。使用 `:root[data-theme="<theme-id>"]` 定义浅色值，使用 `:root[data-theme="<theme-id>"] body.dark` 定义深色值。应用入口在 `html` 上设置 `data-theme`，所有共用组件和弹层自动继承；深浅切换继续使用现有按钮。编辑器颜色 token 请使用十六进制格式。新增变量时同步更新 XML 的 `token-contract`。

## 两数之和与代码模式

本地迁移和 seed 会创建力扣第 1 题“两数之和”的中文题面、三个公开示例、六组测试数据和两份 Python 模板。题目来源：https://leetcode.cn/problems/two-sum/。

编辑器的代码模式可切换：

- 核心代码模式：实现 `Solution.twoSum(nums, target)`，系统从测试输入 JSON 中提取参数并打印返回值。
- main 方法模式：完整 Python 程序通过 `json.load(sys.stdin)` 读取输入，在 `main()` 中调用算法并打印结果。

两种模式的编辑草稿和保存记录互相独立。核心调用配置保存在代码模板的 `invocation` JSON 中（`className`、`method`、`arguments`），随每次执行的代码快照保存；执行轨迹只包含用户代码，行号与编辑器一致。目前可执行语言为 Python，运行和保存需要登录。测试数据已入库，当前运行按钮执行编辑器下方的一组输入。

## 力扣式灵动布局与图解

默认左侧整高标签组包含「题目描述 / 图解题解」，右上为代码，右下为「测试用例 / 测试结果」。通过 FlexLayout 提供标签重排、跨面板合并、拖至边缘拆分、分隔条调整尺寸、面板放大、关闭与重新打开。顶部布局菜单支持预设、图解布局、恢复默认和代码专注模式。布局保存在浏览器 `av_docking_layout_v2` 中；手机宽度采用独立单标签组，不覆盖桌面布局。

题面使用 react-markdown 与 remark-gfm 渲染 Markdown（不执行原始 HTML），支持列表、表格、代码块与链接；原有两数之和纯文本题面也会整理为题意、示例、提示、进阶顺序。编辑器提供 Python、JavaScript、TypeScript、Java、C++、C、Go、Rust，草稿按题目、语言、模式分别保存在本地。后端目前仍只有 Python 运行器。

两数之和图解根据测试输入演示哈希表解法，包含互补值、当前元素、配对、数值到下标映射、步骤解释和复杂度，支持播放、步进和倍速。它解释配置好的算法思路，不会分析编辑器内的任意代码；其他题目显示未配置专属图解。为保持图示可读性，输入上限为 200 个元素，此限制不影响运行器的输入。

参考交互：https://leetcode.cn/problems/two-sum/description/ 。

## Web 布局样式

Web 端参考 LeetCode 题目工作区，使用紧凑顶栏、独立面板、题面与代码左右分栏，右侧代码和测试区默认按 64:36 分配。题库首页使用介绍卡片、搜索筛选和紧凑列表。`apps/web/src/leetcode-layout.css` 负责紧凑布局，视觉统一遵循 `saas-theme-prompt.xml`：Web 与管理端均使用 `packages/ui/src/themes/linear.css` 的主题变量，保留靛蓝主色、深浅模式、背景光效、透明面板及多层阴影。编辑器、弹窗和下拉菜单继承同一主题；业务样式不再覆盖全局主题变量或硬编码主题配色。既有浏览器布局仍保留，可通过布局菜单应用预设。

做题页补齐力扣式操作区：题库抽屉、前后题导航、随机一题、图标运行按钮、笔记、布局和设置、计时器。设置弹窗包含布局、代码编辑器、快捷键、高级设置、Leet 服务状态和计时器；字体、字号、连字、缩进、换行、相对行号、补全、运行按钮位置与实时调整均接入实际行为，偏好保存在当前浏览器。支持预设 / 题解 / 笔记布局及本地自定义布局。计时器支持正计时、倒计时、暂停和重置；笔记按题目保存在本地。测试用例支持参数模式、原始 JSON、添加删除自定义用例、无效参数校验，运行结果展示本次执行的输入和公开示例预期输出。按需求不提供提交判题或断点调试，也没有相应占位按钮；AI 服务尚未接入。
