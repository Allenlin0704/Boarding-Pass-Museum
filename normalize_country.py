import json


# ==============================
# 国家正式中文名
# ==============================

COUNTRY_MAP = {

    # 亚洲
    "CN": "中华人民共和国",
    "China": "中华人民共和国",

    "JP": "日本国",
    "Japan": "日本国",

    "KR": "大韩民国",
    "South Korea": "大韩民国",

    "SG": "新加坡共和国",
    "Singapore": "新加坡共和国",

    "HK": "中华人民共和国香港特别行政区",
    "Hong Kong": "中华人民共和国香港特别行政区",

    "MO": "中华人民共和国澳门特别行政区",
    "Macau": "中华人民共和国澳门特别行政区",


    # 北美
    "US": "美利坚合众国",
    "United States": "美利坚合众国",

    "CA": "加拿大",
    "Canada": "加拿大",


    # 欧洲
    "GB": "大不列颠及北爱尔兰联合王国",
    "United Kingdom": "大不列颠及北爱尔兰联合王国",

    "FR": "法兰西共和国",
    "France": "法兰西共和国",

    "DE": "德意志联邦共和国",
    "Germany": "德意志联邦共和国",

    "IT": "意大利共和国",
    "Italy": "意大利共和国",

    "ES": "西班牙王国",
    "Spain": "西班牙王国",

    "NL": "荷兰王国",
    "Netherlands": "荷兰王国",

    "CH": "瑞士联邦",
    "Switzerland": "瑞士联邦",


    # 大洋洲
    "AU": "澳大利亚联邦",
    "Australia": "澳大利亚联邦",

    "NZ": "新西兰",
    "New Zealand": "新西兰",


    # 中东
    "AE": "阿拉伯联合酋长国",
    "United Arab Emirates": "阿拉伯联合酋长国",

    "SA": "沙特阿拉伯王国",
    "Saudi Arabia": "沙特阿拉伯王国",


}


def update_file(path):

    print("处理:", path)

    with open(path, "r", encoding="utf-8") as f:
        data=json.load(f)


    count=0


    for item in data:

        country=item.get("country","")

        if country in COUNTRY_MAP:

            item["country_cn"]=COUNTRY_MAP[country]

            count+=1


    with open(path,"w",encoding="utf-8") as f:

        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )


    print("更新数量:",count)



update_file(
    "public/data/airports-global.json"
)


update_file(
    "public/data/airlines-global.json"
)


print("完成")
