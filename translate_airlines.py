import json
import os
import time
from deep_translator import GoogleTranslator

INPUT = "public/data/airlines-global.json"
BACKUP = "public/data/airlines-global.backup.json"
CACHE = "airlines-translation-cache.json"

translator = GoogleTranslator(
    source="en",
    target="zh-CN"
)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    temp = path + ".tmp"

    with open(temp, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

    os.replace(temp, path)


# -----------------------------
# 读取数据
# -----------------------------

data = load_json(INPUT)


# -----------------------------
# 第一次运行先建立备份
# -----------------------------

if not os.path.exists(BACKUP):
    save_json(BACKUP, data)
    print("✅ 已创建原始数据备份")


# -----------------------------
# 读取翻译缓存
# -----------------------------

if os.path.exists(CACHE):
    cache = load_json(CACHE)
else:
    cache = {}


# -----------------------------
# 找出需要翻译的名称
# -----------------------------

names = sorted({
    str(x.get("name_en", "")).strip()
    for x in data
    if (
        str(x.get("name_en", "")).strip()
        and not str(x.get("name_cn", "")).strip()
    )
})


print()
print("=" * 60)
print("BoardingPassMuseum 航司中文化")
print("=" * 60)
print("总记录:", len(data))
print("需要翻译的唯一名称:", len(names))
print("已有缓存:", len(cache))
print("=" * 60)
print()


translated = 0
failed = 0


# -----------------------------
# 翻译
# -----------------------------

for index, name in enumerate(names, 1):

    if name in cache:
        continue

    success = False

    for attempt in range(3):

        try:

            result = translator.translate(name)

            if result:
                cache[name] = result
                translated += 1
                success = True

                print(
                    f"[{index}/{len(names)}] "
                    f"{name} -> {result}"
                )

                break

        except Exception as e:

            print(
                f"⚠️ 翻译失败 "
                f"({attempt + 1}/3): {name}"
            )

            time.sleep(2)

    if not success:

        failed += 1

        print(
            f"❌ 放弃本次，稍后可继续: {name}"
        )

    # 每 20 条保存一次
    if index % 20 == 0:

        save_json(CACHE, cache)

        print(
            f"💾 已保存缓存 "
            f"({len(cache)} 条)"
        )

    # 稍微降低请求速度
    time.sleep(0.15)


# 最后保存缓存
save_json(CACHE, cache)


# -----------------------------
# 写入 name_cn
# -----------------------------

changed = 0

for item in data:

    name_en = str(
        item.get("name_en", "")
    ).strip()

    name_cn = str(
        item.get("name_cn", "")
    ).strip()

    if name_cn:
        continue

    if name_en in cache:

        item["name_cn"] = cache[name_en]
        changed += 1


# -----------------------------
# 保存 JSON
# -----------------------------

save_json(INPUT, data)


print()
print("=" * 60)
print("完成")
print("=" * 60)
print("本次新增翻译:", translated)
print("翻译失败:", failed)
print("写入中文名:", changed)
print("缓存总数:", len(cache))
print("=" * 60)
