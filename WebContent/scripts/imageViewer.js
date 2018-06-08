(function ($)
    {
        let $toolBar = {
            classes: {
                btnFitHeight: "btnFitHeight", btnFitWidth: "btnFitWidth", btnFullSize: "btnFullSize", btnZoomIn: "btnZoomIn",
                btnZoomOut: "btnZoomOut", btnRotateCW: "btnRotateCW", btnRotateCCW: "btnRotateCCW", btnPrint: "btnPrint",
                btnShowAnno: "btnShowAnno", btnHideAnno: "btnHideAnno", btnEditAnno: "btnEditAnno", btnDelAnno: "btnDelAnno",
                btnPrev: "btnPrev", btnNext: "btnNext", btnUnMax: "btnUnMax", btnMax: "btnMax"
            },
            css: {
                btnFitHeight: "fa-arrows-v", btnFitWidth: "fa-arrows-h", btnFullSize: "fa-arrows", btnZoomIn: "fa-search-plus",
                btnZoomOut: "fa-search-minus", btnRotateCW: "fa-repeat", btnRotateCCW: "fa-undo", btnPrint: "fa-print",
                btnShowAnno: "fa-eye", btnHideAnno: "fa-eye-slash", btnEditAnno: "fa-pencil-square-o", btnDelAnno: "fa-trash-o",
                btnPrev: "fa-arrow-up", btnNext: "fa-arrow-down", btnUnMax: "fa-window-restore", btnMax: "fa-window-maximize"
            },
            titles: {
                btnFitHeight: "最適高度", btnFitWidth: "最適寬度", btnFullSize: "原圖", btnZoomIn: "放大",
                btnZoomOut: "縮小", btnRotateCW: "旋轉", btnRotateCCW: "旋轉", btnPrint: "列印",
                btnShowAnno: "顯示註記", btnHideAnno: "隱藏註記", btnEditAnno: "新增註記", btnDelAnno: "刪除註記",
                btnPrev: "上一頁", btnNext: "下一頁", btnUnMax: "還原", btnMax: "最大化"
            }
        };
        let $innerVar = {
            docId : null,
            docPage : null,
            docUrl : null,
            docType: null,

            imageWidth : null,
            imageHeight : null,
            canvasScale : 1,
            rotateDegree : 0
        };
        let $importVar = {
            viewerWidth : null,
            viewerHeight : null,
            displayAfterLoad : false,
            showAnnotationTool : true,
            waterMarkText : null,
            imageServerUrl : null
        };

        //1.ShowDoc
        //==============================================================================================================
        $.fn.showViewer = function (option)
        {
            $importVar = $.extend($importVar,option);
            $("#Viewer").append(`
                <div id="logIn">
                    <span class='label'>Username:</span><input type='text' id='username' size='20px'>
                    <span class='label'>Password:</span><input type='text' id='password' size='20px'>
                    <span class='label'>DocId:</span><input type='text' id='docId' size='20px'>
                    <span class='label'>DocPage:</span><input type='text' id='docPage' size='20px'>
                    <span class='label'><input id='btnGetImage' type='button' value='getImage'></span>
                </div>
                <div  id='firstToolBar'></div>
                <div id='firstDivImage' style=width:${$importVar.viewerWidth};height:${$importVar.viewerHeight};overflow:auto;text-align:center>
                    <img id="oriImg" style="display: none">
                    <canvas id='firstCanvas'>
                </div>`);
            for (let i in $toolBar.classes) {$("#firstToolBar").append(
                `<button class=${$toolBar.classes[i]} title=${$toolBar.titles[i]}><i class='fa ${$toolBar.css[i]} fa-1x'></i></button>`
            )}
            $("#btnGetImage").click(function () {
                $function.getImage($('#username').val(), $('#password').val(), $('#docId').val(), $('#docPage').val());
            });
            $(".btnFitHeight").click(function () {
                $innerVar.canvasScale = parseInt($("#firstDivImage").css("height"))/$("#oriImg").height();
                $function.scale(document.getElementById("oriImg"),$innerVar.canvasScale);
            });
            $(".btnFitWidth").click(function () {
                $innerVar.canvasScale = parseInt($("#firstDivImage").css("width"))/$("#oriImg").width();
                $function.scale(document.getElementById("oriImg"),$innerVar.canvasScale);
            });
            $(".btnFullSize").click(function () {
                $innerVar.canvasScale = 1;
                $function.scale(document.getElementById("oriImg"),$innerVar.canvasScale);
            });
            $(".btnZoomIn").click(function () {
                $innerVar.canvasScale *= 1.1;
                if ($innerVar.canvasScale >=3){$innerVar.canvasScale = 3}
                $function.scale(document.getElementById("oriImg"),$innerVar.canvasScale);
            });
            $(".btnZoomOut").click(function () {
                $innerVar.canvasScale /= 1.1;
                $function.scale(document.getElementById("oriImg"),$innerVar.canvasScale);
            });
            $(".btnRotateCW").click(function () {
                $innerVar.rotateDegree += 90;
                $function.rotate($innerVar.rotateDegree);
            });
            $(".btnRotateCCW").click(function () {
                $innerVar.rotateDegree -= 90;
                $function.rotate($innerVar.rotateDegree);
            });
        };
        //inner function
        // =============================================================================================================
        let $function =
            {
                getImage : function (Username, Password, DocId, DocPage) {
                    $.ajax({
                        type: "POST",
                        url : "imageServlet",
                        data : {username : Username, password : Password},
                        success : function() {
                            $innerVar.docUrl = document.location.href
                                .replace("index_1.html", `imageServlet?docId=${DocId}&currentPage=${DocPage}&type=tiff`);
                            //取圖
                            //--------------------------------------------------------------------------------------------------
                            let xhr = new XMLHttpRequest();
                            xhr.responseType = "arraybuffer";
                            xhr.open("GET",$innerVar.docUrl);
                            xhr.onload = function() {
                                let tiff = new Tiff({buffer: xhr.response});
                                let canvas = tiff.toCanvas();
                                $("#oriImg").attr("src",canvas.toDataURL());
                                $innerVar.imageWidth = canvas.width;
                                $innerVar.imageHeight = canvas.height;
                                canvas.setAttribute("id","firstCanvas");
                                $("#firstCanvas").replaceWith(canvas);
                            };
                            xhr.send();
                        }
                    });
                },
                scale : function(image,scale) {
                    let cw = image.width;
                    let ch = image.height;
                    let scaleCanvas = document.createElement("canvas");
                    scaleCanvas.setAttribute("id","firstCanvas");
                    scaleCanvas.setAttribute("width",cw*scale);
                    scaleCanvas.setAttribute("height",ch*scale);
                    let ctx = scaleCanvas.getContext("2d");
                    ctx.drawImage(image,0,0,image.width*scale,image.height*scale);
                    $("#firstCanvas").replaceWith(scaleCanvas);
                    console.log(`cw = ${cw} ch = ${ch} csale = ${scale}`);
                },
                rotate : function(degree) {
                    console.log(`rotate degree = ${degree}`)
                },
                temp : function () {

                }
            };
    })(jQuery);