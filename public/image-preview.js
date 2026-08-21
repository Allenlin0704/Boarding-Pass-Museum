// =====================================
// BoardingPassMuseum
// Universal Image Preview
// =====================================


function openImagePreview(src){

    let overlay =
        document.getElementById(
            "imagePreviewOverlay"
        );


    if(!overlay){

        overlay =
            document.createElement("div");


        overlay.id =
            "imagePreviewOverlay";


        overlay.className =
            "image-preview-overlay";


        overlay.innerHTML = `

        <button
            class="image-preview-close"
            type="button"
        >
            ×
        </button>


        <img
            class="image-preview-large"
            alt="图片预览"
        >

        `;


        document.body.appendChild(
            overlay
        );


        overlay.addEventListener(
            "click",
            e=>{

                if(
                    e.target === overlay ||
                    e.target.classList.contains(
                        "image-preview-close"
                    )
                ){

                    closeImagePreview();

                }

            }
        );


        document.addEventListener(
            "keydown",
            e=>{

                if(
                    e.key==="Escape"
                ){

                    closeImagePreview();

                }

            }
        );

    }


    const img =
        overlay.querySelector(
            ".image-preview-large"
        );


    img.src = src;


    overlay.classList.add(
        "show"
    );

}




function closeImagePreview(){

    const overlay =
        document.getElementById(
            "imagePreviewOverlay"
        );


    if(overlay){

        overlay.classList.remove(
            "show"
        );

    }

}
