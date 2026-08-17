/**
 * BoardingPassMuseum
 * 全球航司 / 机场数据预处理工具
 *
 * 目前先建立统一的数据格式。
 * 后续拿到全球原始数据后，再由这个脚本批量转换。
 */

const fs = require("fs");
const path = require("path");


// ============================
// 路径
// ============================

const DATA_DIR =
    path.join(__dirname, "..", "data");


// ============================
// 读取 JSON
// ============================

function readJSON(filename) {

    const filePath =
        path.join(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {

        throw new Error(
            `找不到文件：${filename}`
        );

    }


    const content =
        fs.readFileSync(
            filePath,
            "utf8"
        );


    return JSON.parse(content);

}


// ============================
// 保存 JSON
// ============================

function saveJSON(
    filename,
    data
) {

    const filePath =
        path.join(DATA_DIR, filename);


    fs.writeFileSync(

        filePath,

        JSON.stringify(
            data,
            null,
            2
        ),

        "utf8"

    );

}


// ============================
// 航司标准化
// ============================

function normalizeAirline(
    item,
    index
) {

    return {

        id:
            item.id ||
            index + 1,

        name_cn:
            item.name_cn ||
            "",

        name_en:
            item.name_en ||
            "",

        iata:
            (item.iata || "")
                .toUpperCase(),

        icao:
            (item.icao || "")
                .toUpperCase(),

        callsign:
            item.callsign ||
            "",

        country_cn:
            item.country_cn ||
            "",

        country:
            item.country ||
            "",

        active:
            item.active !== false,

        passenger:
            item.passenger !== false

    };

}


// ============================
// 机场标准化
// ============================

function normalizeAirport(
    item,
    index
) {

    return {

        id:
            item.id ||
            index + 1,

        name_cn:
            item.name_cn ||
            "",

        name_en:
            item.name_en ||
            "",

        iata:
            (item.iata || "")
                .toUpperCase(),

        icao:
            (item.icao || "")
                .toUpperCase(),

        city_cn:
            item.city_cn ||
            "",

        city_en:
            item.city_en ||
            "",

        country_cn:
            item.country_cn ||
            "",

        country:
            item.country ||
            "",

        active:
            item.active !== false,

        passenger:
            item.passenger !== false

    };

}


// ============================
// 去重
// ============================

function removeDuplicates(
    data,
    fields
) {

    const seen =
        new Set();

    const result = [];


    for (
        const item of data
    ) {

        const key =
            fields
                .map(
                    field =>
                        String(
                            item[field] || ""
                        )
                        .toUpperCase()
                        .trim()
                )
                .join("|");


        if (
            key === "|||"
        ) {

            result.push(item);

            continue;

        }


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(key);

        result.push(item);

    }


    return result;

}


// ============================
// 主程序
// ============================

function main() {

    console.log("");
    console.log(
        "=============================="
    );
    console.log(
        "BPMuseum 数据预处理"
    );
    console.log(
        "=============================="
    );
    console.log("");


    // --------------------------
    // 航司
    // --------------------------

    const airlines =
        readJSON(
            "airlines.json"
        );


    const normalizedAirlines =
        airlines.map(
            normalizeAirline
        );


    const cleanAirlines =
        removeDuplicates(
            normalizedAirlines,
            [
                "iata",
                "icao"
            ]
        );


    saveJSON(
        "airlines.json",
        cleanAirlines
    );


    console.log(
        `航司：${airlines.length} → ${cleanAirlines.length}`
    );


    // --------------------------
    // 机场
    // --------------------------

    const airports =
        readJSON(
            "airports.json"
        );


    const normalizedAirports =
        airports.map(
            normalizeAirport
        );


    const cleanAirports =
        removeDuplicates(
            normalizedAirports,
            [
                "iata",
                "icao"
            ]
        );


    saveJSON(
        "airports.json",
        cleanAirports
    );


    console.log(
        `机场：${airports.length} → ${cleanAirports.length}`
    );


    console.log("");
    console.log(
        "数据预处理完成。"
    );
    console.log("");

}


try {

    main();

}
catch (error) {

    console.error("");
    console.error(
        "❌ 数据处理失败："
    );
    console.error(
        error.message
    );
    console.error("");

    process.exit(1);

}