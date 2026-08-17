/**
 * BoardingPass
 * Global airline / airport data importer
 *
 * 输入：
 *   scripts/source-data/airports.csv
 *   scripts/source-data/airlines.dat
 *
 * 输出：
 *   data/airports-global.json
 *   data/airlines-global.json
 *
 * 注意：
 * 原始数据不会被修改。
 * 现有 airlines.json / airports.json 也不会被覆盖。
 */

const fs = require("fs");
const path = require("path");


// ========================================
// 路径
// ========================================

const SOURCE_DIR =
    path.join(
        __dirname,
        "source-data"
    );

const DATA_DIR =
    path.join(
        __dirname,
        "..",
        "data"
    );

const AIRPORT_SOURCE =
    path.join(
        SOURCE_DIR,
        "airports.csv"
    );

const AIRLINE_SOURCE =
    path.join(
        SOURCE_DIR,
        "airlines.dat"
    );

const AIRPORT_OUTPUT =
    path.join(
        DATA_DIR,
        "airports-global.json"
    );

const AIRLINE_OUTPUT =
    path.join(
        DATA_DIR,
        "airlines-global.json"
    );


// ========================================
// CSV 单行解析
// ========================================

function parseCSVLine(line) {

    const result = [];

    let current = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            }

            else {

                insideQuotes =
                    !insideQuotes;

            }

        }

        else if (
            char === "," &&
            !insideQuotes
        ) {

            result.push(
                current
            );

            current = "";

        }

        else {

            current += char;

        }

    }


    result.push(
        current
    );


    return result;

}


// ========================================
// 读取机场
// ========================================

function importAirports() {

    console.log("");
    console.log(
        "开始处理机场数据..."
    );


    if (
        !fs.existsSync(
            AIRPORT_SOURCE
        )
    ) {

        throw new Error(
            "找不到 airports.csv"
        );

    }


    const csv =
        fs.readFileSync(
            AIRPORT_SOURCE,
            "utf8"
        );


    const lines =
        csv
            .split(/\r?\n/)
            .filter(
                line =>
                    line.trim() !== ""
            );


    if (
        lines.length < 2
    ) {

        throw new Error(
            "airports.csv 没有有效数据"
        );

    }


    const headers =
        parseCSVLine(
            lines[0]
        );


    const airports = [];


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const values =
            parseCSVLine(
                lines[i]
            );


        const row = {};


        headers.forEach(
            (
                header,
                index
            ) => {

                row[header] =
                    values[index] ||
                    "";

            }
        );


        const type =
            row.type ||
            "";


        const allowedTypes = [

            "large_airport",
            "medium_airport",
            "small_airport",
            "closed_airport"

        ];


        if (
            !allowedTypes.includes(
                type
            )
        ) {

            continue;

        }


        const active =
            type !==
            "closed_airport";


        const passenger =

            type ===
                "large_airport"

            ||

            type ===
                "medium_airport"

            ||

            (
                type ===
                    "small_airport"
                &&
                row.scheduled_service ===
                    "yes"
            )

            ||

            type ===
                "closed_airport";


        airports.push({

            id:
                Number(
                    row.id
                ),

            name_cn:
                "",

            name_en:
                row.name ||
                "",

            iata:
                String(
                    row.iata_code ||
                    ""
                )
                .toUpperCase(),

            icao:
                String(
                    row.icao_code ||
                    ""
                )
                .toUpperCase(),

            city_cn:
                "",

            city_en:
                row.municipality ||
                "",

            country_cn:
                "",

            country:
                row.iso_country ||
                "",

            active:
                active,

            passenger:
                passenger

        });

    }


    // ====================================
    // 机场去重
    // ====================================

    const seen =
        new Set();

    const uniqueAirports = [];


    for (
        const airport
        of airports
    ) {

        const key =

            airport.iata
            ||

            airport.icao
            ||

            `ID-${airport.id}`;


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(
            key
        );

        uniqueAirports.push(
            airport
        );

    }


    fs.writeFileSync(

        AIRPORT_OUTPUT,

        JSON.stringify(
            uniqueAirports,
            null,
            2
        ),

        "utf8"

    );


    console.log(
        `机场原始记录：${lines.length - 1}`
    );

    console.log(
        `机场最终记录：${uniqueAirports.length}`
    );

    console.log(
        "✅ airports-global.json 已生成"
    );

}


// ========================================
// 读取 airlines.dat
// ========================================

function importAirlines() {

    console.log("");
    console.log(
        "开始处理航司数据..."
    );


    if (
        !fs.existsSync(
            AIRLINE_SOURCE
        )
    ) {

        throw new Error(
            "找不到 airlines.dat"
        );

    }


    const text =
        fs.readFileSync(
            AIRLINE_SOURCE,
            "utf8"
        );


    const lines =
        text
            .split(/\r?\n/)
            .filter(
                line =>
                    line.trim() !== ""
            );


    const airlines = [];


    for (
        const line
        of lines
    ) {

        const values =
            line.split(",");


        if (
            values.length < 8
        ) {

            continue;

        }


        /*
         * OpenFlights airlines.dat:
         *
         * 0 airline ID
         * 1 name
         * 2 alias
         * 3 IATA
         * 4 ICAO
         * 5 callsign
         * 6 country
         * 7 active
         */


        const id =
            values[0] || "";


        const name =
            values[1] || "";


        const iata =
            values[3] || "";


        const icao =
            values[4] || "";


        const callsign =
            values[5] || "";


        const country =
            values[6] || "";


        const active =
            values[7] !== "N";


        airlines.push({

            id:
                Number(
                    id
                ),

            name_cn:
                "",

            name_en:
                name,

            iata:
                iata
                    .replace(
                        /"/g,
                        ""
                    )
                    .trim()
                    .toUpperCase(),

            icao:
                icao
                    .replace(
                        /"/g,
                        ""
                    )
                    .trim()
                    .toUpperCase(),

            callsign:
                callsign
                    .replace(
                        /"/g,
                        ""
                    )
                    .trim(),

            country_cn:
                "",

            country:
                country
                    .replace(
                        /"/g,
                        ""
                    )
                    .trim(),

            active:
                active,

            passenger:
                true

        });

    }


    // ====================================
    // 航司去重
    // ====================================

    const seen =
        new Set();

    const uniqueAirlines = [];


    for (
        const airline
        of airlines
    ) {

        const key =

            airline.iata
            ||

            airline.icao
            ||

            `ID-${airline.id}`;


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(
            key
        );

        uniqueAirlines.push(
            airline
        );

    }


    fs.writeFileSync(

        AIRLINE_OUTPUT,

        JSON.stringify(
            uniqueAirlines,
            null,
            2
        ),

        "utf8"

    );


    console.log(
        `航司原始记录：${lines.length}`
    );

    console.log(
        `航司最终记录：${uniqueAirlines.length}`
    );

    console.log(
        "✅ airlines-global.json 已生成"
    );

}


// ========================================
// 主程序
// ========================================

function main() {

    console.log("");

    console.log(
        "======================================"
    );

    console.log(
        "BoardingPass Global Data Importer"
    );

    console.log(
        "======================================"
    );


    importAirports();

    importAirlines();


    console.log("");

    console.log(
        "======================================"
    );

    console.log(
        "✅ 全球数据导入完成"
    );

    console.log(
        "======================================"
    );

    console.log("");

}


try {

    main();

}

catch (error) {

    console.error("");

    console.error(
        "❌ 导入失败："
    );

    console.error(
        error.message
    );

    console.error("");

    process.exit(1);

}