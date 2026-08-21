import json
import os
import time
from deep_translator import GoogleTranslator

INPUT = "public/data/airports-global.json"
BACKUP = "public/data/airports-global.backup.json"
CACHE = "airports-translation-cache.json"

translator = GoogleTranslator(
    source="en",
    target="zh-CN"
)

# ISO 3166-1 alpha-2 国家/地区代码
# 常见代码直接本地映射，避免浪费翻译请求
COUNTRIES = {
    "AF":"阿富汗","AL":"阿尔巴尼亚","DZ":"阿尔及利亚","AS":"美属萨摩亚",
    "AD":"安道尔","AO":"安哥拉","AI":"安圭拉","AQ":"南极洲",
    "AG":"安提瓜和巴布达","AR":"阿根廷","AM":"亚美尼亚","AW":"阿鲁巴",
    "AU":"澳大利亚","AT":"奥地利","AZ":"阿塞拜疆","BS":"巴哈马",
    "BH":"巴林","BD":"孟加拉国","BB":"巴巴多斯","BY":"白俄罗斯",
    "BE":"比利时","BZ":"伯利兹","BJ":"贝宁","BM":"百慕大",
    "BT":"不丹","BO":"玻利维亚","BQ":"荷兰加勒比区","BA":"波斯尼亚和黑塞哥维那",
    "BW":"博茨瓦纳","BV":"布韦岛","BR":"巴西","IO":"英属印度洋领地",
    "BN":"文莱","BG":"保加利亚","BF":"布基纳法索","BI":"布隆迪",
    "CV":"佛得角","KH":"柬埔寨","CM":"喀麦隆","CA":"加拿大",
    "KY":"开曼群岛","CF":"中非共和国","TD":"乍得","CL":"智利",
    "CN":"中国","CX":"圣诞岛","CC":"科科斯群岛","CO":"哥伦比亚",
    "KM":"科摩罗","CG":"刚果共和国","CD":"刚果民主共和国","CK":"库克群岛",
    "CR":"哥斯达黎加","CI":"科特迪瓦","HR":"克罗地亚","CU":"古巴",
    "CW":"库拉索","CY":"塞浦路斯","CZ":"捷克","DK":"丹麦",
    "DJ":"吉布提","DM":"多米尼克","DO":"多米尼加共和国","EC":"厄瓜多尔",
    "EG":"埃及","SV":"萨尔瓦多","GQ":"赤道几内亚","ER":"厄立特里亚",
    "EE":"爱沙尼亚","SZ":"斯威士兰","ET":"埃塞俄比亚","FK":"福克兰群岛",
    "FO":"法罗群岛","FJ":"斐济","FI":"芬兰","FR":"法国",
    "GF":"法属圭亚那","PF":"法属波利尼西亚","TF":"法属南部领地",
    "GA":"加蓬","GM":"冈比亚","GE":"格鲁吉亚","DE":"德国",
    "GH":"加纳","GI":"直布罗陀","GR":"希腊","GL":"格陵兰",
    "GD":"格林纳达","GP":"瓜德罗普","GU":"关岛","GT":"危地马拉",
    "GG":"根西岛","GN":"几内亚","GW":"几内亚比绍","GY":"圭亚那",
    "HT":"海地","HM":"赫德岛和麦克唐纳群岛","VA":"梵蒂冈","HN":"洪都拉斯",
    "HK":"中国香港","HU":"匈牙利","IS":"冰岛","IN":"印度",
    "ID":"印度尼西亚","IR":"伊朗","IQ":"伊拉克","IE":"爱尔兰",
    "IM":"马恩岛","IL":"以色列","IT":"意大利","JM":"牙买加",
    "JP":"日本","JE":"泽西岛","JO":"约旦","KZ":"哈萨克斯坦",
    "KE":"肯尼亚","KI":"基里巴斯","KP":"朝鲜","KR":"韩国",
    "KW":"科威特","KG":"吉尔吉斯斯坦","LA":"老挝","LV":"拉脱维亚",
    "LB":"黎巴嫩","LS":"莱索托","LR":"利比里亚","LY":"利比亚",
    "LI":"列支敦士登","LT":"立陶宛","LU":"卢森堡","MO":"中国澳门",
    "MG":"马达加斯加","MW":"马拉维","MY":"马来西亚","MV":"马尔代夫",
    "ML":"马里","MT":"马耳他","MH":"马绍尔群岛","MQ":"马提尼克",
    "MR":"毛里塔尼亚","MU":"毛里求斯","YT":"马约特","MX":"墨西哥",
    "FM":"密克罗尼西亚","MD":"摩尔多瓦","MC":"摩纳哥","MN":"蒙古",
    "ME":"黑山","MS":"蒙特塞拉特","MA":"摩洛哥","MZ":"莫桑比克",
    "MM":"缅甸","NA":"纳米比亚","NR":"瑙鲁","NP":"尼泊尔",
    "NL":"荷兰","NC":"新喀里多尼亚","NZ":"新西兰","NI":"尼加拉瓜",
    "NE":"尼日尔","NG":"尼日利亚","NU":"纽埃","NF":"诺福克岛",
    "MK":"北马其顿","MP":"北马里亚纳群岛","NO":"挪威","OM":"阿曼",
    "PK":"巴基斯坦","PW":"帕劳","PS":"巴勒斯坦","PA":"巴拿马",
    "PG":"巴布亚新几内亚","PY":"巴拉圭","PE":"秘鲁","PH":"菲律宾",
    "PN":"皮特凯恩群岛","PL":"波兰","PT":"葡萄牙","PR":"波多黎各",
    "QA":"卡塔尔","RE":"留尼汪","RO":"罗马尼亚","RU":"俄罗斯",
    "RW":"卢旺达","BL":"圣巴泰勒米","SH":"圣赫勒拿","KN":"圣基茨和尼维斯",
    "LC":"圣卢西亚","MF":"法属圣马丁","PM":"圣皮埃尔和密克隆",
    "VC":"圣文森特和格林纳丁斯","WS":"萨摩亚","SM":"圣马力诺",
    "ST":"圣多美和普林西比","SA":"沙特阿拉伯","SN":"塞内加尔",
    "RS":"塞尔维亚","SC":"塞舌尔","SL":"塞拉利昂","SG":"新加坡",
    "SX":"荷属圣马丁","SK":"斯洛伐克","SI":"斯洛文尼亚","SB":"所罗门群岛",
    "SO":"索马里","ZA":"南非","GS":"南乔治亚岛和南桑威奇群岛",
    "SS":"南苏丹","ES":"西班牙","LK":"斯里兰卡","SD":"苏丹",
    "SR":"苏里南","SJ":"斯瓦尔巴和扬马延","SE":"瑞典","CH":"瑞士",
    "SY":"叙利亚","TW":"中国台湾","TJ":"塔吉克斯坦","TZ":"坦桑尼亚",
    "TH":"泰国","TL":"东帝汶","TG":"多哥","TK":"托克劳",
    "TO":"汤加","TT":"特立尼达和多巴哥","TN":"突尼斯","TR":"土耳其",
    "TM":"土库曼斯坦","TC":"特克斯和凯科斯群岛","TV":"图瓦卢",
    "UG":"乌干达","UA":"乌克兰","AE":"阿联酋","GB":"英国",
    "US":"美国","UM":"美国本土外小岛屿","UY":"乌拉圭","UZ":"乌兹别克斯坦",
    "VU":"瓦努阿图","VE":"委内瑞拉","VN":"越南","VG":"英属维尔京群岛",
    "VI":"美属维尔京群岛","WF":"瓦利斯和富图纳","EH":"西撒哈拉",
    "YE":"也门","ZM":"赞比亚","ZW":"津巴布韦",
    "XK":"科索沃"
}


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


def translate_text(text, label):
    for attempt in range(3):
        try:
            result = translator.translate(text)

            if result:
                print(f"{label}: {text} -> {result}")
                return result

        except Exception as e:
            print(
                f"⚠️ {label}翻译失败 "
                f"({attempt + 1}/3): {text}"
            )
            print("   ", e)
            time.sleep(3)

    print(f"❌ 暂时跳过: {text}")
    return None


# =====================================
# 读取数据
# =====================================

data = load_json(INPUT)

print()
print("=" * 65)
print("BoardingPassMuseum 机场中文化")
print("=" * 65)
print("机场记录:", len(data))


# =====================================
# 原始备份
# =====================================

if not os.path.exists(BACKUP):
    save_json(BACKUP, data)
    print("✅ 已创建原始机场数据备份")


# =====================================
# 翻译缓存
# =====================================

if os.path.exists(CACHE):
    cache = load_json(CACHE)
else:
    cache = {
        "city": {},
        "airport": {}
    }


# =====================================
# 国家代码
# =====================================

country_changed = 0
country_unknown = set()

for item in data:

    if str(item.get("country_cn", "")).strip():
        continue

    code = str(
        item.get("country", "")
    ).strip().upper()

    if not code:
        continue

    if code in COUNTRIES:
        item["country_cn"] = COUNTRIES[code]
        country_changed += 1
    else:
        country_unknown.add(code)


print("国家中文名已填:", country_changed)

if country_unknown:
    print(
        "⚠️ 未识别国家代码:",
        ", ".join(sorted(country_unknown))
    )


# =====================================
# 建立唯一城市列表
# =====================================

cities = sorted({
    str(x.get("city_en", "")).strip()
    for x in data
    if (
        str(x.get("city_en", "")).strip()
        and not str(x.get("city_cn", "")).strip()
    )
})

print("需要处理的唯一城市:", len(cities))
print("城市缓存:", len(cache["city"]))


# =====================================
# 城市翻译
# =====================================

for index, city in enumerate(cities, 1):

    if city in cache["city"]:
        continue

    result = translate_text(
        city,
        "城市"
    )

    if result:
        cache["city"][city] = result

    if index % 20 == 0:
        save_json(CACHE, cache)
        print(
            f"💾 城市缓存已保存 "
            f"({len(cache['city'])})"
        )

    time.sleep(0.15)


save_json(CACHE, cache)


# =====================================
# 写入城市中文名
# =====================================

city_changed = 0

for item in data:

    city_en = str(
        item.get("city_en", "")
    ).strip()

    city_cn = str(
        item.get("city_cn", "")
    ).strip()

    if city_cn:
        continue

    if city_en in cache["city"]:
        item["city_cn"] = cache["city"][city_en]
        city_changed += 1


save_json(INPUT, data)

print()
print("城市中文名已写入:", city_changed)


# =====================================
# 建立唯一机场名称列表
# =====================================

airports = sorted({
    str(x.get("name_en", "")).strip()
    for x in data
    if (
        str(x.get("name_en", "")).strip()
        and not str(x.get("name_cn", "")).strip()
    )
})

print("需要处理的唯一机场名称:", len(airports))
print("机场名称缓存:", len(cache["airport"]))


# =====================================
# 机场名称翻译
# =====================================

for index, airport in enumerate(airports, 1):

    if airport in cache["airport"]:
        continue

    result = translate_text(
        airport,
        "机场"
    )

    if result:
        cache["airport"][airport] = result

    if index % 20 == 0:
        save_json(CACHE, cache)
        print(
            f"💾 机场缓存已保存 "
            f"({len(cache['airport'])})"
        )

    time.sleep(0.15)


save_json(CACHE, cache)


# =====================================
# 写入机场中文名
# =====================================

airport_changed = 0

for item in data:

    name_en = str(
        item.get("name_en", "")
    ).strip()

    name_cn = str(
        item.get("name_cn", "")
    ).strip()

    if name_cn:
        continue

    if name_en in cache["airport"]:
        item["name_cn"] = cache["airport"][name_en]
        airport_changed += 1


# =====================================
# 最终保存
# =====================================

save_json(INPUT, data)

print()
print("=" * 65)
print("🎉 机场中文化任务完成")
print("=" * 65)
print("国家中文名:", country_changed)
print("城市中文名:", city_changed)
print("机场中文名:", airport_changed)
print("城市缓存:", len(cache["city"]))
print("机场缓存:", len(cache["airport"]))
print("=" * 65)
