const imageInput = document.getElementById("ticketImage");
const canvas = document.getElementById("watermarkCanvas");

if (imageInput && canvas) {

    const ctx = canvas.getContext("2d");

    const scaleInput = document.getElementById("imageScale");

    const watermarkText =
        document.getElementById("watermarkText");

    const watermarkOpacity =
        document.getElementById("watermarkOpacity");

    const watermarkSize =
        document.getElementById("watermarkSize");

    const watermarkPosition =
        document.getElementById("watermarkPosition");


    let img = new Image();

    let scale = 1;

    let offsetX = 0;
    let offsetY = 0;


    let dragging = false;

    let lastX = 0;
    let lastY = 0;



    imageInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            if (!file) return;


            const reader = new FileReader();


            reader.onload = function(e){


                img.onload = function(){


                    // 保持原图比例

                    canvas.width = img.width;

                    canvas.height = img.height;


                    scale = 1;

                    offsetX = 0;

                    offsetY = 0;


                    draw();


                };


                img.src = e.target.result;


            };


            reader.readAsDataURL(file);


        }
    );





    // 缩放

    scaleInput.addEventListener(
        "input",
        function(){

            scale = Number(this.value);

            draw();

        }
    );






    // 拖动图片


    canvas.addEventListener(
        "mousedown",
        function(e){

            dragging = true;

            lastX = e.offsetX;

            lastY = e.offsetY;

        }
    );


    canvas.addEventListener(
        "mousemove",
        function(e){


            if(!dragging)
                return;


            offsetX += e.offsetX - lastX;

            offsetY += e.offsetY - lastY;


            lastX = e.offsetX;

            lastY = e.offsetY;


            draw();


        }
    );


    canvas.addEventListener(
        "mouseup",
        function(){

            dragging=false;

        }
    );


    canvas.addEventListener(
        "mouseleave",
        function(){

            dragging=false;

        }
    );






    function draw(){


        if(!img.src)
            return;



        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );



        // 图片

        const width =
            img.width * scale;


        const height =
            img.height * scale;



        ctx.drawImage(

            img,

            offsetX,

            offsetY,

            width,

            height

        );





        drawWatermark();


    }







    function drawWatermark(){


        const text =
            watermarkText.value ||
            "Boarding Pass Museum";



        const size =
            Number(watermarkSize.value) || 40;



        const opacity =
            Number(watermarkOpacity.value) || 0.5;



        ctx.font =
            `${size}px Arial`;



        const textWidth =
            ctx.measureText(text).width;



        let x = 40;

        let y = size + 40;



        switch(
            watermarkPosition.value
        ){


            case "top-right":

                x =
                canvas.width -
                textWidth -
                40;

                y =
                size + 40;

                break;



            case "bottom-left":

                x = 40;

                y =
                canvas.height - 40;

                break;



            case "bottom-right":

                x =
                canvas.width -
                textWidth -
                40;

                y =
                canvas.height - 40;

                break;


        }





        // 水印背景

        ctx.fillStyle =
        `rgba(0,0,0,${opacity})`;


        ctx.fillRect(

            x - 15,

            y - size - 10,

            textWidth + 30,

            size + 25

        );





        // 水印文字


        ctx.fillStyle =
        "white";


        ctx.fillText(

            text,

            x,

            y

        );


    }







    [
        watermarkText,
        watermarkOpacity,
        watermarkSize,
        watermarkPosition

    ].forEach(
        item => {


            if(item){

                item.addEventListener(
                    "input",
                    draw
                );


                item.addEventListener(
                    "change",
                    draw
                );

            }

        }
    );


}