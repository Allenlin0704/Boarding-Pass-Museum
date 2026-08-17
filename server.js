const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;


app.use(express.json());


app.use(
    express.static(
        path.join(__dirname,"public")
    )
);



app.use(
    "/data",
    express.static(
        path.join(__dirname,"public","data")
    )
);



app.get("/",(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});



app.listen(PORT,()=>{

console.log(
`BoardingPassMuseum running at http://localhost:${PORT}`
);

});