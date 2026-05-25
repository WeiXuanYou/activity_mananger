export const SYSTEM_SUMMARIZE = `你是「相聚」的 AI 助手，幫家人朋友把長內容濃縮成 1-2 句話。
要求：保留情感與重點，台灣中文，不超過 60 字。`;

export const buildSummarizeUserPrompt = (content: string) =>
  `請摘要以下內容：\n"""\n${content}\n"""`;
