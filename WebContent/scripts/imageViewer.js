(function ($)
    {
        let $imageViewer = null;
        let $imageCanvas = null;
        let $annotationContain = null;
        let $annotationCanvas = null;
        let $annotationScrollPaneAPI = null;
        let $watermarkCanvas = null;
        let $tempCanvas = null;
        let $annoEditDialog = null;
        let $image;

        let $toolBar = {
            id: {
                btnFitHeight: "btnFitHeight",
                btnFitWidth: "btnFitWidth",
                btnFullSize: "btnFullSize",
                btnZoomIn: "btnZoomIn",
                btnZoomOut: "btnZoomOut",
                btnRotateCW: "btnRotateCW",
                btnRotateCCW: "btnRotateCCW",
                btnPrint: "btnPrint",
                btnShowAnno: "btnShowAnno",
                btnHideAnno: "btnHideAnno",
                btnEditAnno: "btnEditAnno",
                btnDelAnno: "btnDelAnno",
                btnPrev: "btnPrev",
                btnNext: "btnNext",
                btnUnMax: "btnUnMax",
                btnMax: "btnMax"
            },
            css: {
                btnFitHeight: "fa-arrows-v",
                btnFitWidth: "fa-arrows-h",
                btnFullSize: "fa-arrows",
                btnZoomIn: "fa-search-plus",
                btnZoomOut: "fa-search-minus",
                btnRotateCW: "fa-repeat",
                btnRotateCCW: "fa-undo",
                btnPrint: "fa-print",
                btnShowAnno: "fa-eye",
                btnHideAnno: "fa-eye-slash",
                btnEditAnno: "fa-pencil-square-o",
                btnDelAnno: "fa-trash-o",
                btnPrev: "fa-arrow-up",
                btnNext: "fa-arrow-down",
                btnUnMax: "fa-window-restore",
                btnMax: "fa-window-maximize"
            },
            titles: {
                btnFitHeight: "最適高度",
                btnFitWidth: "最適寬度",
                btnFullSize: "原圖",
                btnZoomIn: "放大",
                btnZoomOut: "縮小",
                btnRotateCW: "旋轉",
                btnRotateCCW: "旋轉",
                btnPrint: "列印",
                btnShowAnno: "顯示註記",
                btnHideAnno: "隱藏註記",
                btnEditAnno: "新增註記",
                btnDelAnno: "刪除註記",
                btnPrev: "上一頁",
                btnNext: "下一頁",
                btnUnMax: "還原",
                btnMax: "最大化"
            }
        };

        let $importVariable = {
            viewerWidth : null,
            viewerHeight : null,
            displayAfterLoad : false,
            showAnnotationTool : true,
            waterMarkText : null,
            imageServerUrl : null
        };

        $.fn.showViewer = function (option)
        {
            $importVariable = $.extend($importVariable,option);

            let imageCanvas = document.createElement("canvas");
            imageCanvas.setAttribute('id','firstCanvas;');
            imageCanvas.setAttribute('width',$importVariable.viewerWidth+'px');
            imageCanvas.setAttribute('height',$importVariable.viewerHeight+'px');
            document.getElementById("Viewer").appendChild(canvas);


            console.log(document.getElementById("Viewer"));
        }






    })(jQuery);