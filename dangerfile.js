import { danger, warn, fail, message } from "danger";

// PR 基本检查
const changedLines = danger.github.pr.additions + danger.github.pr.deletions;
const modifiedFiles = danger.git.modified_files;
const createdFiles = danger.git.created_files;
const allFiles = [...modifiedFiles, ...createdFiles];

// 1. PR 大小
if (changedLines > 300) {
  warn(`⚠️ PR 较大 (${changedLines} 行)，建议拆分`);
}

// 2. PR 描述
if (!danger.github.pr.body || danger.github.pr.body.length < 20) {
  warn("💡 建议添加 PR 描述");
}

// 3. 安全检查
const checkSecurity = async () => {
  for (const file of allFiles) {
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      const diff = await danger.git.diffForFile(file);
      if (!diff) continue;

      // 硬编码私钥 - 严重
      if (diff.added.match(/privateKey\s*=\s*['"][^'"]+['"]/i)) {
        fail(`🔒 ${file}: 发现硬编码私钥！请使用环境变量`);
      }

      // 硬编码敏感信息
      if (diff.added.match(/password|secret|mnemonic|api[_-]?key/i)) {
        warn(`⚠️ ${file}: 可能包含硬编码敏感信息`);
      }

      // RPC URL 硬编码
      if (diff.added.match(/https?:\/\/.*rpc/i)) {
        warn(`⚠️ ${file}: 建议使用配置文件管理 RPC URL`);
      }
    }
  }
};

// 4. 依赖同步
if (modifiedFiles.includes("package.json") && !modifiedFiles.includes("pnpm-lock.yaml")) {
  warn("⚠️ 修改了 package.json，记得更新 pnpm-lock.yaml");
}

// 5. 环境变量
if (modifiedFiles.includes(".env")) {
  warn("⚠️ 不要提交敏感的 .env 文件");
}

// 6. 鼓励
if (changedLines < 100 && danger.github.pr.body.length > 50) {
  message("✨ 优秀的 PR！");
}

// 执行检查
(async () => {
  await checkSecurity();
})();