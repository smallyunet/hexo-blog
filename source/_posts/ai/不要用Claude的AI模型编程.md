---
title: 不要用 Claude 的 AI 模型编程
date: 2025-11-11 14:00:00
tags: AI
---


因为不好用。特指 Claude Sonnet 4.5。

在日常的使用中已经被坑过几次：

1. 一味按照我说的做，不会提出任何反驳意见或者提醒
2. 在代码里留下 TODO，然后说完美，功能完成了
3. 会执行一些危险操作，比如 `git checkout —`
4. 对于有执行顺序的数据库 schema 变更记录，竟然直接修改某一个历史节点

相比之下，GPT-5 几乎不会犯这种错误。

所以可以放心地禁用掉所有来自 Claude 的 AI 模型。除非你的项目允许生成有逻辑漏洞的代码。

---

顺便分享一个 instructions 文件，用于指导 AI Agent 编程：[yincs-coding-style.md](https://gist.github.com/smallyunet/7095f51f7bf8c1b31e7e6dcd83a29703)

