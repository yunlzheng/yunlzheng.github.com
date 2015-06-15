title: Code Review Guide
date: 2015-06-15 21:30:15
tags: [翻译, Agile]
---

作为参与者
--------

* 能够理解多种程序设计方案是可选的，需要讨论并且权衡你更喜欢哪一种，并且能够快速达成一致。
* 问问题，你为什么这么做？而不是你应该怎么做. ("你觉得 `:user_id`的命名怎么样?")
* 要求澄清问题. ("我还不太明白，你能再讲清楚一点吗?")
* 避免出现代码所有权的词汇 ("我的", "不是我的", "你的")
* 假设每个人都是聪明的，善良的；避免使用指代人格相关的词汇(“笨蛋”，“愚蠢”)。
* 并不是每个人都能随时理解你的意图，表达经量明确不含糊。
* 要谦虚。
* 不要使用夸张性的词语. ("总是", "从来", "无休止的", "绝不")。
* 不要嘲讽。
* 表达你的真实意见。
* 面对面沟通，如果在沟通过程中出现太多“不明白”。

作为被审查者
-------------------------

* 感谢别人的意见。
* 对事不对人，审核的是代码而不是人。
* 解释那段代码为什么需要存在. ("It's like that because of these reasons. Would it be more clear if I rename this class/file/method/variable?")。
* 提取一些修改和重构的事作为故事卡来做。
* 把代码审查关联到Story。
* Push commits based on earlier rounds of feedback as isolated commits to the
  branch. Do not squash until the branch is ready to merge. Reviewers should be
  able to read individual updates based on their earlier feedback.
* 尝试理解Reviewer的立场和意图。
* 经量对所有的评论做出回应。
* 等待，直到CI编译成功，并且单元测试通过才合并代码。

如何进行代码审核
--------------

在理解这段代码为什么需要的基础上 (bug, user experience, refactoring). 再:

* Communicate which ideas you feel strongly about and those you don't.
* 确定在简化代码的同时能够解决问题
* 如果讨论变得太抽象，就把这个问题挪到线下讨论，期间，让作者决定最终的实现方式
* 即使作者已经考虑过的问题，我们也可以提出不同的实现方式
* 尝试理解作者的立场和意图.
* 关闭pull request时使用"Ready to merge"的评论.
