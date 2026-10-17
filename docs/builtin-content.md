# 内置内容维护

仓库 `content/` 是内置内容的来源；数据库用于查询、关联用户数据和保存部署环境自己的内容。当前完整收录官方 Hot 100 的 100 题、101 个解法与 684 份语言实现，覆盖 Java、C、C++、Go、Rust、Python、JavaScript、TypeScript。各题仅展示来源中实际存在的语言实现。题目来源、参考代码许可与改编说明见 `content/THIRD_PARTY_CONTENT.md`。

## 初始化和部署

- 本地首次安装和升级：`pnpm db:init:local`。`pnpm dev:api` 也会先执行它。
- 远端：先确认 `apps/api/wrangler.jsonc` 的目标数据库，再执行 `pnpm db:init:remote`，成功后发布应用。默认开发流程不访问远端。
- 已应用迁移后，仅更新内容：`pnpm content:sync:local` 或显式的 `pnpm content:sync:remote`。
- 独立测试库：`node scripts/sync-content.mjs --local --persist-to /tmp/algovision-content-test`。迁移时使用相同的 `--persist-to`。
- 其他环境配置：同步脚本接受 `--config <path>`、`--env <name>`，迁移也必须指向相同配置和环境。

同步脚本先读取并校验完整内容包，再生成临时 SQL 文件交给已安装的 Wrangler。当前 Wrangler 的本地执行使用 D1 batch，远端文件执行使用 D1 import；失败回滚，版本记录与内容在同一次执行中写入。临时 SQL 执行后清理。不要将这些 SQL 拆开逐条执行。

同一数据库的发布流程应串行执行（CI 使用数据库级 concurrency group）。重复部署相同版本无内容变更；低版本覆盖高版本、或者相同版本出现不同内容，会因版本保护校验失败。修改内容后必须递增 `manifest.json` 的整数 `version`。回退内容也应发布一个更高版本的修订包。

## 文件约定

`manifest.json` 声明包标识、版本、题目和题单列表、基础语言及标签。题单文件只引用题目 slug，记录分组和排序。每道题使用独立目录：

```text
content/problems/two-sum/
  problem.json
  description.md
  examples.json
  tests.json
  templates/
  solutions/
    brute-force/{solution.json,explanation.md,python-core.py}
    hash-map/{solution.json,explanation.md,python-core.py}
```

- 题目 ID 使用稳定 UUID，解法及实现使用稳定字符串 ID；修订内容不得更换 ID。
- 同一种算法的不同语言代码写入同一个 `solution.json` 的 `implementations`。
- 新算法增加一个解法目录，并加入 `problem.json.solutions`；修改现有算法保持目录与 ID 不变。
- 模板保存起始代码，完整答案放入解法实现。两数之和的两种解法均提供 Java、C++、C、Python、Go。官方代码原文及来源在 `content/problems/two-sum/sources/leetcode-official.json`；应用版本补充导入声明，C 哈希表改用无第三方依赖的开放寻址实现。其他题目的 Python、JavaScript、TypeScript 核心模板只在当前运行器能接收其参数及返回值时启用。链表、树、设计题及缺少通用核心适配器的语言代码可在题解中阅读，载入按钮会停用。
- `diagram` 可为空；目前只有哈希表解法绑定 `two-sum-hash-map` 图解，不把图解套用到暴力枚举。
- 输入和输出使用 JSON 字符串，公开示例与隐藏测试分开。浏览接口不返回隐藏测试。
- 修改完运行 `pnpm content:check`、`pnpm test:content`，递增版本并同步。

## 现有数据保护

内容表的 `content_package` 为空代表本地/自定义内容。迁移不接管已有记录：旧版“两数之和”的 UUID、题面、发布/删除状态、语言模板、示例及测试均保留，新题单引用原 UUID，新解法独立插入。

由本同步器新建的记录才拥有内容包标识，后续由仓库更新。内置题目、示例、模板、测试的后台修改/删除会返回明确提示，避免后台编辑被下次同步悄悄覆盖。旧记录仍可按原方式编辑。

用户、登录会话、账号保存的代码、收藏、提交和执行记录均不属于内容同步范围。撤下解法/实现/模板/示例/测试使用软删除；题目从题单移除时仅删除本包拥有的关联，保留题目及其用户关联。自定义解法和自定义题单关联不会被删除。新版本重新加入已撤下的内置记录会恢复它。

如果旧题目曾被删除或改为草稿，同步不会重新发布它，题单只显示公开且未删除的题目。若现有 slug 或唯一键与不同 ID 的数据冲突，同步失败并回滚，需先明确对应关系，不会自动合并或删除用户数据。

语言、角色与标签作为共享基础字典，只补充缺失项，不覆盖已有配置。当前标签关联为增量补充；删除/重命名共享标签不属于内容包同步。

旧 `scripts/seed.sql` 仅作为历史升级测试夹具保留，不应再手动执行。已有部署只需应用新增迁移和新同步脚本，无需重置数据库。

## 浏览接口

- `GET /api/problem-lists`：公开题单与可见题数。
- `GET /api/problem-lists/:slug`：公开题单及按顺序排列的可见题目、分组。
- `GET /api/problems/:id/solutions`：公开题目的已发布解法和未撤下的代码实现。

前端 `/lists/:slug` 展示题单，跳转做题页时通过 `?list=...` 保持题单导航范围。题解切换不改变编辑器；主动载入需确认并备份目标语言/模式草稿，可在编辑器撤回。备份仅存当前浏览器，保留最近一次载入前版本，不是账号代码的历史版本。

## 回归验证

`pnpm test:content` 使用内存 SQLite 和实际迁移，验证全新初始化、重复执行、旧数据原样保留、版本更新、撤下解法、自定义记录保留、错误回滚、版本保护、公开接口对草稿/已删除内容的过滤，以及可运行的 Python、JavaScript、TypeScript 题解的公开样例。参考代码还经过对应语言的语法解析。Node 需支持 `node:sqlite`（Node 22.13+ 或 24）；解法检查需 Python 3。

远端发布前先在独立 D1 环境验证迁移和同步。本次实现不自动创建远端资源，也未执行远端部署。

多语言编译验证：`python3 scripts/tests/check-solution-languages.py`，使用项目实际核心代码适配器验证 C、C++、Java、Go 的全部内置用例，需要本机对应编译器。Python 验证包含在 `pnpm test:content` 中。
