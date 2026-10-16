# AlgoVision

Cloudflare-first algorithm execution workspace. The current runnable slice includes a React problem browser and editor, Hono Worker API, D1-backed accounts and problem administration, Queue execution, a multi-language Container runner, R2 code snapshots and compressed trace storage, and a dockable problem/editor workspace with solution diagrams.

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
podman build --platform linux/arm64 -t localhost/algovision-multilang-arm64:dev -f containers/python-runner/Dockerfile containers/python-runner
podman run --rm -d --name algovision-runner-local -p 127.0.0.1:8081:8080 localhost/algovision-multilang-arm64:dev
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
| JavaScript, TypeScript, Java, C, C++, Go, Rust | Compilation/execution, stdin/stdout/stderr, main mode and Two Sum core adapters implemented; no variable traces |
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

本地迁移和 seed 会创建力扣第 1 题“两数之和”的中文题面、三个公开示例、六组测试数据和Python 及七种新增语言的核心代码和 main 模板。题目来源：https://leetcode.cn/problems/two-sum/。

编辑器的代码模式可切换：

- 核心代码模式：实现 `Solution.twoSum(nums, target)`，系统从测试输入 JSON 中提取参数并打印返回值。
- main 方法模式：完整 Python 程序通过 `json.load(sys.stdin)` 读取输入，在 `main()` 中调用算法并打印结果。

两种模式的编辑草稿和保存记录互相独立。核心调用配置保存在代码模板的 `invocation` JSON 中（`className`、`method`、`arguments`，原生/JVM 语言另需 `adapter`），随每次执行的代码快照保存。Python 的执行轨迹只包含用户代码，行号与编辑器一致。八种语言均可执行，运行和保存需要登录。测试数据已入库，当前运行按钮执行编辑器下方的一组输入。

## 力扣式灵动布局与图解

默认左侧整高标签组包含「题目描述 / 实际运行轨迹 / 图解题解」，右上为代码，右下为「测试用例 / 测试结果」。通过 FlexLayout 提供标签重排、跨面板合并、拖至边缘拆分、分隔条调整尺寸、面板放大、关闭与重新打开。顶部布局菜单支持预设、图解布局、恢复默认和代码专注模式。布局保存在浏览器 `av_docking_layout_v2` 中；手机宽度采用独立单标签组，不覆盖桌面布局。

题面使用 react-markdown 与 remark-gfm 渲染 Markdown（不执行原始 HTML），支持列表、表格、代码块与链接；原有两数之和纯文本题面也会整理为题意、示例、提示、进阶顺序。编辑器提供 Python、JavaScript、TypeScript、Java、C++、C、Go、Rust，草稿按题目、语言、模式分别保存在本地。后端已接入八种语言的实际运行器。

两数之和图解根据测试输入演示哈希表解法，包含互补值、当前元素、配对、数值到下标映射、步骤解释和复杂度，支持播放、步进和倍速。它解释配置好的算法思路，不会分析编辑器内的任意代码；其他题目显示未配置专属图解。为保持图示可读性，输入上限为 200 个元素，此限制不影响运行器的输入。

参考交互：https://leetcode.cn/problems/two-sum/description/ 。

## 实际运行轨迹

Python 执行完成或失败后，前端读取 `/api/executions/:id/trace` 的 v2 真实轨迹，自动打开「实际运行轨迹」面板。支持播放、暂停、前后步进、进度跳转及 0.5× / 1× / 2× / 4× 速度。编辑器高亮本帧行号并滚动定位；数组、元组、字典及标量按局部变量快照显示，变化着色和动画来自同一次函数调用的前后快照，不依赖题目或特定解法。返回值、异常和失败前的部分轨迹也可查看。旧版 v2 轨迹仍可回放；新运行器补充调用标识、返回值、异常和容器总项数。

轨迹绑定点击运行时的代码与输入快照。修改草稿后停止在草稿上高亮，展开只读运行快照并在快照内定位；切换题目、语言、模式或重新运行会重置回放。行事件的变量状态是在该行执行之前，赋值或容器修改通常在下一事件中可见。当前最多采集 1000 帧、4 秒追踪时间、15 个局部变量，容器最多展开前 30 项及 2 层，其他值使用截断文本。其他语言显示暂不支持逐行轨迹。

验证：`pnpm --filter @algovision/web test:trace`、`python3 -B -m unittest discover -s containers/python-runner -p test_trace.py -v`。更新 Python 采集端后需重建并重启运行器镜像。

## Web 布局样式

Web 端参考 LeetCode 题目工作区，使用紧凑顶栏、独立面板、题面与代码左右分栏，右侧代码和测试区默认按 64:36 分配。题库首页使用介绍卡片、搜索筛选和紧凑列表。`apps/web/src/leetcode-layout.css` 负责紧凑布局，视觉统一遵循 `saas-theme-prompt.xml`：Web 与管理端均使用 `packages/ui/src/themes/linear.css` 的主题变量，保留靛蓝主色、深浅模式、背景光效、透明面板及多层阴影。编辑器、弹窗和下拉菜单继承同一主题；业务样式不再覆盖全局主题变量或硬编码主题配色。既有浏览器布局仍保留，可通过布局菜单应用预设。

做题页补齐力扣式操作区：题库抽屉、前后题导航、随机一题、图标运行按钮、布局和设置。设置弹窗包含布局、代码编辑器、快捷键、高级设置和 Leet 服务状态；字体、字号、连字、缩进、换行、相对行号、补全、运行按钮位置与实时调整均接入实际行为，偏好保存在当前浏览器。支持预设 / 题解布局及本地自定义布局；恢复旧布局时自动移除已下线的面板。测试用例支持参数模式、原始 JSON、添加删除自定义用例、无效参数校验，运行结果展示本次执行的输入和公开示例预期输出。按需求不提供提交判题或断点调试，也没有相应占位按钮；AI 服务尚未接入。

## 多语言运行

同一运行器镜像包含 Python 3.12、Node.js 22、TypeScript 5.8、OpenJDK 17、GCC/G++ 12、Go 1.19 和 Rust 1.63。TypeScript 先做类型检查并编译为 CommonJS，其他编译型语言先编译再执行；编译失败会作为失败结果返回，不会运行生成物。运行时不在线安装第三方依赖。Java 完整程序使用 `public class Main`，Go 完整程序使用 `package main`。

- main 模式：所有已支持语言均可运行完整程序，输入原样送入标准输入。
- 核心模式：Python 调用配置的类方法；JavaScript/TypeScript 调用配置的顶层函数。Java、C、C++、Go、Rust 当前使用 `adapter: "two-sum"` 的有类型适配器，参数为 `nums`（int32 数组）和 `target`（int32）。其他题目的这些语言可使用 main 模式，新增核心签名需要扩展适配器。
- 两数之和签名与编辑器一致：Java/C++ 为 `Solution.twoSum`，C 为带 `returnSize` 的 `twoSum`（返回堆分配数组），Go 为 `twoSum`，Rust 为 `Solution::two_sum`。
- 支持级别 `1` 表示可执行并返回输出，`2` 表示额外支持逐行/变量轨迹。目前仅 Python 为 `2`，其余语言为 `1`。
- 每次编译最多 30 秒、运行最多 6 秒；stdout/stderr 各最多返回 64 KiB。任务使用独立临时目录，终止时清理进程组。原生运行进程使用 256 MiB 地址空间限制；Node/Java 设置堆限制，托管运行时和编译器的总内存依赖容器限制。

现有数据库运行 `pnpm db:migrate:local` 应用 `0002_multilanguage_execution.sql`，启用新增语言并补齐两数之和模板；新数据库在迁移后运行 seed。升级保留已存在的自定义模板。然后重建上面的本地运行器镜像并重启容器/API。历史 `PythonRunner` 类名和 `PYTHON_RUNNER` 绑定名保留，以兼容已有部署。

运行器验证：`pnpm test:runner` 使用宿主机编译器（需将编译器放入 PATH，并为 TypeScript 设置 NODE_TYPE_ROOTS）；推荐通过 `RUNNER_URL=http://localhost:8081 pnpm test:runner` 测试真实容器。这会覆盖八种语言的输入输出、两数之和全部种子用例、编译/类型/运行错误、超时、输出上限和新旧数据库升级。

在独立的本地测试数据库启动 API 后，可用 `API_URL=http://localhost:8788 pnpm test:runner` 验证登录、接口校验、队列、运行器、D1/R2 结果持久化和 Python 轨迹读取的完整链路；该命令会注册测试账号并写入测试执行记录。
