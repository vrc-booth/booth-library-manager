import type { BoothItem } from "../types/booth.ts";

interface TagRule {
  tag: string;
  keywords: string[];
}

const TAG_RULES: TagRule[] = [
  { tag: "VRChat", keywords: ["vrchat", "vrc"] },
  { tag: "Unity", keywords: ["unity", "unitypackage", ".unitypackage"] },
  { tag: "Avatar", keywords: ["avatar", "アバター"] },
  { tag: "Clothing", keywords: ["clothes", "clothing", "outfit", "衣装", "服"] },
  { tag: "Accessory", keywords: ["accessory", "accessories", "アクセサリー"] },
  { tag: "Hair", keywords: ["hair", "wig", "髪", "ヘアー"] },
  { tag: "Texture", keywords: ["texture", "テクスチャ"] },
  { tag: "Shader", keywords: ["shader", "シェーダー"] },
  { tag: "3D Model", keywords: ["3d", "model", "fbx", "obj"] },
  { tag: "Tool", keywords: ["tool", "editor", "plugin", "ツール"] },
];

export function generateSmartTags(item: BoothItem): string[] {
  const searchText = item.title.toLowerCase();
  const tags: string[] = [];

  for (const rule of TAG_RULES) {
    const hasMatch = rule.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );
    if (hasMatch) {
      tags.push(rule.tag);
    }
  }

  return tags;
}

export function generateSmartTagsForItems(items: BoothItem[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const item of items) {
    const tags = generateSmartTags(item);
    if (tags.length > 0) {
      result[item.id] = tags;
    }
  }

  return result;
}
