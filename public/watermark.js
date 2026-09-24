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
    let maskMode = false;
    let masking = false;
    let maskStart = null;
    let maskPreview = null;
    const masks = [];

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


    const canvasPoint = e => {
        const rect=canvas.getBoundingClientRect();
        return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};
    };

    canvas.addEventListener(
        "pointerdown",
        function(e){
            const point=canvasPoint(e);
            canvas.setPointerCapture?.(e.pointerId);
            if(maskMode){masking=true;maskStart=point;maskPreview={x:point.x,y:point.y,w:0,h:0};draw();return;}

            dragging = true;

            lastX = point.x;

            lastY = point.y;

        }
    );


    canvas.addEventListener(
        "pointermove",
        function(e){

            const point=canvasPoint(e);

            if(masking&&maskStart){maskPreview={x:Math.min(maskStart.x,point.x),y:Math.min(maskStart.y,point.y),w:Math.abs(point.x-maskStart.x),h:Math.abs(point.y-maskStart.y)};draw();return;}


            if(!dragging)
                return;


            offsetX += point.x - lastX;

            offsetY += point.y - lastY;


            lastX = point.x;

            lastY = point.y;


            draw();


        }
    );


    canvas.addEventListener(
        "pointerup",
        function(){

            if(masking){if(maskPreview&&maskPreview.w>8&&maskPreview.h>8)masks.push(maskPreview);masking=false;maskStart=null;maskPreview=null;draw();updateMaskStatus();return;}

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

        ctx.fillStyle="rgba(10,10,10,.96)";
        masks.forEach(mask=>ctx.fillRect(mask.x,mask.y,mask.w,mask.h));
        if(maskPreview){ctx.fillStyle="rgba(10,10,10,.72)";ctx.fillRect(maskPreview.x,maskPreview.y,maskPreview.w,maskPreview.h);ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(2,canvas.width/500);ctx.strokeRect(maskPreview.x,maskPreview.y,maskPreview.w,maskPreview.h);}





        drawWatermark();


    }

    const maskModeBtn=document.getElementById("maskModeBtn"),undoMaskBtn=document.getElementById("undoMaskBtn"),clearMasksBtn=document.getElementById("clearMasksBtn"),maskStatus=document.getElementById("maskStatus");
    function updateMaskStatus(){if(maskStatus)maskStatus.textContent=maskMode?`遮挡模式：已添加 ${masks.length} 处，请继续拖动框选`:`图片移动模式：已遮挡 ${masks.length} 处`;if(maskModeBtn)maskModeBtn.textContent=maskMode?"完成遮挡":"开始遮挡";canvas.style.cursor=maskMode?"crosshair":"grab";}
    maskModeBtn?.addEventListener("click",()=>{maskMode=!maskMode;dragging=false;masking=false;maskPreview=null;updateMaskStatus();draw();});
    undoMaskBtn?.addEventListener("click",()=>{masks.pop();updateMaskStatus();draw();});
    clearMasksBtn?.addEventListener("click",()=>{masks.length=0;updateMaskStatus();draw();});
    canvas.style.touchAction="none";
    updateMaskStatus();







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
