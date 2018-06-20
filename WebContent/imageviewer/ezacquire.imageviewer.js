(function ($)
	{
	    let $imageViewer = null;
	    let $imageContain = null;
	    let $imageCanvas = null;
	    let $imageScrollPaneAPI = null;
	    let $annotationContain = null;
	    let $annotationCanvas = null;
	    let $annotationScrollPaneAPI = null;
	    let $watermarkCanvas = null;
	    let $tempCanvas = null;

	    let $annoEditDialog = null;

	    let $image;

    // $annoArray 用來放 annotation
    // 每個 annotation 的內容為
    // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
    // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色

        let $annoArray = null;

        let $toolBtns = {
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
                btnPrev: "fa-arrow-left",
                btnNext: "fa-arrow-right",
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
    let DisplayMode = { FitWidth: 0, FitHeight: 1, FitWindow: 2, FullSize: 3 };
    let MouseMode = {None: 0, Zoom: 1, Move: 2};
    let AnnoMode = {None: 0, Edit: 1, Del: 2};
    //外部傳入影像資訊
    let $imageInfo = { docId: "", formId: "", currentPage: "", viewPage: "", totalPage: "" };

    let $mouseTrack = { startX: 0, startY: 0, endX: 0, endY: 0};

    let $variable = {
        //=============================
        //預設Viewer大小
        viewerWidth: 1000,
        viewerHeight: 600,
        //影像來源
        imageServerUrl: 'Home/GetImage',
        //=============================
        waterMarkText: '',
        waterMarkFont: 'bold 60pt Calibri',
        waterMarkFillColor: '#ff0000',
        waterMarkFillAlpha: 0.4,
        waterMarkRotateAngle: 45,

        displayAfterLoad: true,

        zoomRectFillStyle: 'rgba(255, 255, 125, 0.4)',
        zoomRectLineWidth: 2,
        zoomRectLineColor: '#ff0000',

        // 沒有 tool 就沒有 annotation
        showAnnotationTool: false,
        annotationDefaultBGColor: '#ffff7d',
        annotationDefaultTextColor: '#000000',
        annotationDefaultLineColor: '#ff0000',
        annotationDefaultFont: '16pt Arial',
        annotationDrawAlpha: 0.4,
        annotationTextMargin: 5,

        showPrint: false,

        showToolBar: true,

        _wapperId: '',

        //每次縮小
        _scaleDistance: 0.05,
        //最大縮放比例
        _maxScale: 1,
        //最小縮放比例
        _minScale: 0.2,
        _currentScale: 1,

        // 原圖長寬
        _oriImageWidth : null,
        _oriImageHeight : null,

        // 記錄影像的長寬
        _imageWidth: 1,
        _imageHeight: 1,

        _centerX: 1,
        _centerY: 1,

        _shiftX: 0,
        _shiftY: 0,

        _starPtX: 0,
        _starPtY: 0,

        _canvasDisplayWidth: 0,
        _canvasDisplayHeight: 0,

        _rotate: 0,
        _displayMode: DisplayMode.FullSize,

        _drawZoomRect: false,
        _drawAnnotation: false,
        _showAnnotation: false,

        _mouseMode: MouseMode.None,

        _annoMode: AnnoMode.None,

        _newX: 0, _newY: 0
    };

    $.fn.imageviewer = function (options) {
        //起始Function
        this.init = function (options) {
            //參數設定 extend:將$settings用options OverWrite
            $variable = $.extend($variable, options);
            $variable._showAnnotation = $variable.showAnnotationTool;

            $imageViewer = this;

            /*  myId - toolbar
                     - viewerPanel - annotationContain - annotationCanvas (z-index: 4, 所有滑鼠在這一層 listener)
                                   - tempCanvas (z-index: 3)
                                   - watermarkCanvas (z-index: 2)
                                   - imageContain - imageCanvas (z-index: 1)
            */

            $(this).css({
                width : $variable.viewerWidth,
                height : $variable.viewerHeight
            });
            $variable._wapperId = $(this).attr("id");
            let viewerPanelId = `${$variable._wapperId}-PANEL`;
            $(`#${$variable._wapperId}`).append(`<div id='${viewerPanelId}'></div>`);

            $watermarkCanvas = document.createElement("canvas");
            $watermarkCanvas.setAttribute('style', `width:${$variable.viewerWidth}px; height:${$variable.viewerHeight}px; position:absolute; z-index:2;`);
            $watermarkCanvas.width = $variable.viewerWidth;
            $watermarkCanvas.height = $variable.viewerHeight;
            document.getElementById(viewerPanelId).appendChild($watermarkCanvas);
            if ($variable.waterMarkText !== '') { $function._drawWaterMark();}

            $tempCanvas = document.createElement("canvas");
            $tempCanvas.setAttribute('style', `width:${$variable.viewerWidth}px; height:${$variable.viewerHeight}px; position:absolute; z-index:3;`);
            $tempCanvas.width = $variable.viewerWidth;
            $tempCanvas.height = $variable.viewerHeight;
            document.getElementById(viewerPanelId).appendChild($tempCanvas);

            let imageDivId = `${$variable._wapperId}-IMAGEDIV`;
            $(`#${viewerPanelId}`).append(`<div id='${imageDivId}' style='position:absolute'></div>`);
            $imageCanvas = document.createElement("canvas");
            document.getElementById(imageDivId).appendChild($imageCanvas);
            $imageContain = $(`#${imageDivId}`);
            $imageContain.css(
            {
                width:  $variable.viewerWidth,
                height: $variable.viewerHeight,
                paddingLeft: 0,
                paddingRight: 0,
                "z-index": 1,
                "text-align": "center",
                overflow: "auto"
            });
            $imageScrollPaneAPI = $imageContain.jScrollPane({ showArrows: false }).data('jsp');

            let drawDivId = `${$variable._wapperId}-DRAWDIV`;
            $(`#${viewerPanelId}`).append(`<div id='${drawDivId}' style='position:absolute;'></div>`);
            $annotationCanvas = document.createElement("canvas");
            document.getElementById(drawDivId).appendChild($annotationCanvas);
            $annotationContain = $(`#${drawDivId}`);
            $annotationContain.css({
                width: $variable.viewerWidth,
                height: $variable.viewerHeight,
                paddingLeft: 0,
                paddingRight: 0,
                "z-index": 4,
                "text-align": "center",
                overflow: "auto"
            });

            $annotationScrollPaneAPI = $annotationContain
                .bind('jsp-scroll-x', function(event, scrollPositionX) {
                    $imageScrollPaneAPI.scrollToX(scrollPositionX);
                })
                .bind('jsp-scroll-y', function(event, scrollPositionY) {
                    $imageScrollPaneAPI.scrollToY(scrollPositionY);
				})
                .jScrollPane({ showArrows: false }).data('jsp');

            $('canvas').bind("contextmenu", function (e) { return false; });
            $(`#${imageDivId}`).bind("contextmenu", function (e) { return false; });
            $(`#${drawDivId}`).bind("contextmenu", function (e) { return false; });

            $annotationCanvas.addEventListener('mousedown', function (e) {
                $mouseTrack.startX = e.offsetX;
                $mouseTrack.startY = e.offsetY;
                $mouseTrack.endX = e.offsetX;
                $mouseTrack.endY = e.offsetY;

                if (e.button === 2) { $variable._mouseMode = MouseMode.Zoom; }
                else if (e.button === 0) { $variable._mouseMode = MouseMode.Move; }
                else { $variable._mouseMode = MouseMode.None; }

                console.log(`mouse btn:${e.button}, offsetX:${e.offsetX}, offsetY:${e.offsetY}`);
            });

            $annotationCanvas.addEventListener('mousemove', function (e) {

                switch ($variable._mouseMode) {
                    case MouseMode.Zoom :
                        $mouseTrack.endX = e.offsetX;
                        $mouseTrack.endY = e.offsetY;

                        $function._drawRectangleInTempCanvas($function._toActualAxisX($mouseTrack.startX), $function._toActualAxisY($mouseTrack.startY), ($mouseTrack.endX - $mouseTrack.startX)/$variable._currentScale, ($mouseTrack.endY - $mouseTrack.startY)/$variable._currentScale, true, false);
                        break;
                    case MouseMode.Move :
                        _newX = $annotationScrollPaneAPI.getContentPositionX() - (e.offsetX - $mouseTrack.startX);
                        _newX = _newX < 0 ? 0 : (_newX > ($variable._canvasDisplayWidth-$variable.viewerWidth) ?  ($variable._canvasDisplayWidth-$variable.viewerWidth) : _newX);
                        _newY = $annotationScrollPaneAPI.getContentPositionY() - (e.offsetY - $mouseTrack.startY);
                        _newY = _newY < 0 ? 0 : (_newY > ($variable._canvasDisplayHeight-$variable.viewerHeight) ?  ($variable._canvasDisplayHeight-$variable.viewerHeight) : _newY);

                        $annotationScrollPaneAPI.scrollToX(_newX);
                        $annotationScrollPaneAPI.scrollToY(_newY);
                        $imageScrollPaneAPI.scrollToX(_newX);
                        $imageScrollPaneAPI.scrollToY(_newY);
                        $mouseTrack.startX = e.offsetX;
                        $mouseTrack.startY = e.offsetY;
                        break;
                }
            });

            $annotationCanvas.addEventListener('mouseup', function (e) {
                switch ($variable._mouseMode) {
                    case MouseMode.Zoom :
                        if ($variable._annoMode === AnnoMode.Edit) {
                            $annoEditDialog.open();
                        } else {
                            $mouseTrack.endX = e.offsetX;
                            $mouseTrack.endY = e.offsetY;

                            $function._clearTempCanvas();

                            let x = $mouseTrack.startX < $mouseTrack.endX ? $mouseTrack.startX : $mouseTrack.endX;
                            let y = $mouseTrack.startY < $mouseTrack.endY ? $mouseTrack.startY : $mouseTrack.endY;
                            $function._zoomArea($function._toActualAxisX(x), $function._toActualAxisY(y), Math.abs($mouseTrack.endX - $mouseTrack.startX)/$variable._currentScale, Math.abs($mouseTrack.endY - $mouseTrack.startY)/$variable._currentScale);
                        }
                        break;
                    case MouseMode.Move :
                        let _newX = $annotationScrollPaneAPI.getContentPositionX() - (e.offsetX - $mouseTrack.startX);
                        _newX = _newX < 0 ? 0 : (_newX > ($variable._canvasDisplayWidth-$variable.viewerWidth) ?  ($variable._canvasDisplayWidth-$variable.viewerWidth) : _newX);
                        let _newY = $annotationScrollPaneAPI.getContentPositionY() - (e.offsetY - $mouseTrack.startY);
                        _newY = _newY < 0 ? 0 : (_newY > ($variable._canvasDisplayHeight-$variable.viewerHeight) ?  ($variable._canvasDisplayHeight-$variable.viewerHeight) : _newY);

                        $annotationScrollPaneAPI.scrollToX(_newX);
                        $annotationScrollPaneAPI.scrollToY(_newY);
                        $imageScrollPaneAPI.scrollToX(_newX);
                        $imageScrollPaneAPI.scrollToY(_newY);
                        $mouseTrack.startX = e.offsetX;
                        $mouseTrack.startY = e.offsetY;
                        break;
                }
                $variable._mouseMode = MouseMode.None;

            });

            if ($variable.showToolBar) {
                $(`#${viewerPanelId}`).before($function._renderToolBar());

                $(`#${$variable._wapperId}-btnFitHeight`).click(function () {
                    $function.fitHeight();
                });
                $(`#${$variable._wapperId}-btnFitWidth`).click(function () {
                    $function.fitWidth();
                });
                $(`#${$variable._wapperId}-btnFullSize`).click(function () {
                    $function.fullSize();
                });
                $(`#${$variable._wapperId}-btnZoomIn`).click(function () {
                    $function.scaleUp();
                });
                $(`#${$variable._wapperId}-btnZoomOut`).click(function () {
                    $function.scaleDown();
                });
                $(`#${$variable._wapperId}-btnRotateCW`).click(function () {
                    $function.rorateCW();
                });
                $(`#${$variable._wapperId}-btnRotateCCW`).click(function () {
                    $function.rorateCCW();
                });
                $(`#${$variable._wapperId}-btnPrev`).click(function () {
                    $function.prev();
                });
                $(`#${$variable._wapperId}-btnNext`).click(function () {
                    $function.next();
                });
                $(`#${$variable._wapperId}-btnShowAnno`).click(function () {
                    $variable._showAnnotation = true;

                    // todo
                    // 1. 切換 btn 的顯示與否
                    $(`#${$variable._wapperId}-btnShowAnno`).hide();
                    $(`#${$variable._wapperId}-btnHideAnno`).show();
                    // 2. 把 annotation 畫上
                    $function._redrawAnnotationCanvas();
                });
                $(`#${$variable._wapperId}-btnHideAnno`).click(function () {
                    $variable._showAnnotation = false;

                    // todo
                    // 1. 切換 btn 的顯示與否
                    $(`#${$variable._wapperId}-btnHideAnno`).hide();
                    $(`#${$variable._wapperId}-btnShowAnno`).show();
                    // 2. 把 annotation 清掉
                    $function._clearAnnotationCanvas();
                });
                $(`#${$variable._wapperId}-btnEditAnno`).click(function () {
                    if ($variable._annoMode !== AnnoMode.Edit) {
                        $variable._annoMode = AnnoMode.Edit;
                        $(`#${$variable._wapperId}-btnEditAnno`).addClass("btn-active").removeClass("btn-default");
                    } else {
                        $variable._annoMode = AnnoMode.None;
                        $(`#${$variable._wapperId}-btnEditAnno`).addClass("btn-default").removeClass("btn-active");
                    }
                });
            }
        };

        this.init(options);

        //註冊 function
        $imageViewer = $.extend($imageViewer, $function);

        // Annotation 編輯的對話框
        $annoEditDialog = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: [],
            //closeLabel: "Close",
            cssClass: ['custom-class-1', 'custom-class-2'],
            onOpen: function() {
                console.log('modal open');
            },
            onClose: function() {
                console.log('modal closed');
            },
            beforeClose: function() {
                // here's goes some logic
                // e.g. save content before closing the modal
                return true; // close the modal
                //return false; // nothing happens
            }
        });

        $annoEditDialog.setContent(
            `<div class='tab'>
               <button class='tablinks' id='tabText'>Text</button>
               <button class='tablinks' id='tabColor'>Color</button>
             </div>
             <div id='Text' class='tabcontent'>
               <textarea rows='4' cols='70' style='border-radius: 4px;' id='${$variable._wapperId}_AnnoText'></textarea>
             </div>
             <div id='Color' class='tabcontent'>
               "Background color: <input name='bgColor' type='color' value='${$variable.annotationDefaultBGColor}'/><br/>
               "Text color: <input name='textColor' type='color' value='${$variable.annotationDefaultTextColor}'/><br/>
             </div>`);
        $("#tabText").click(function (e) {
            $function._showTab(e, 'Text');
        });
        $("#tabColor").click(function (e) {
            $function._showTab(e, 'Color');
        });
        document.getElementById("tabText").click();

        $annoEditDialog.addFooterBtn('Cancel', 'tingle-btn tingle-btn--primary', function() {
            // here goes some logic
            $annoEditDialog.close();
        });
        $annoEditDialog.addFooterBtn('Save', 'tingle-btn tingle-btn--default', function() {
            // here goes some logic
            $annoEditDialog.close();
        });
        return $imageViewer;
    };

    //Functions
    let $function = {
        //=============================
        //取圖
        loadImage: function(docObject) {
            if (docObject.docId !== $imageInfo.docId && $variable.showAnnotationTool) {
                $function.loadAnnotation();
            }
            $imageInfo = docObject;

            $.ajax({
                type : 'POST',
                url : "imageServlet",
                data : {username : 'T130002', password : '123'},
                success : function () {
                    let url = document.location.href
                        .replace("demo.html", `imageServlet?docId=${$imageInfo.docId}&currentPage=${$imageInfo.currentPage}&type=tiff`);
                    $function.loadImageFromURL(url);
                }
            });
        },

        loadImageFromURL: function(url) {
            $variable._rotate = 0;
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', url);
            xhr.onload = function (e) {
                let t0 = performance.now();
                let tiff = new Tiff({buffer: xhr.response});
                $variable._oriImageWidth = tiff.width();
                $variable._oriImageHeight = tiff.height();
                $variable._imageWidth = $variable._oriImageWidth;
                $variable._imageHeight = $variable._oriImageHeight;
                let scale_w = $variable.viewerWidth / $variable._imageWidth;
                let scale_h = $variable.viewerHeight / $variable._imageHeight;
                $variable._minScale = scale_h < scale_w ? scale_h : scale_w;

                $imageCanvas.width = $variable._imageWidth ;
                $imageCanvas.height = $variable._imageHeight;

                $annotationCanvas.width = $variable._imageWidth ;
                $annotationCanvas.height = $variable._imageHeight;


                $variable._currentScale = $variable._minScale;

                $variable._centerX = $variable._imageWidth / 2;
                $variable._centerY = $variable._imageHeight / 2;

                $image = new Image();
                $image.onload = function () {
                    let t1 = performance.now();
                    console.log(`Load image decode tiff, took t1-t0 ${t1 - t0} milliseconds.`);
                    let ctx = $imageCanvas.getContext('2d');
                    ctx.drawImage($image, 0, 0);
                    if ($variable.displayAfterLoad) {
                        $function._calcDisplayModeScale();
                        $function._draw();
                    }
                    let t2 = performance.now();
                    console.log(`Load image all done, took t2-t0 ${t2 - t0} milliseconds.`);

                    // 如果要顯示 annotation, 就把 annotation 畫出來
                    if ($variable._showAnnotation) {
                        $function._redrawAnnotationCanvas();
                    }
                };
                $image.src = tiff.toDataURL();
            };
            xhr.send();

            $("#dummy-currentPage").val(`${$imageInfo.currentPage}`);
            $("#dummy-totalPage").text(`/${$imageInfo.totalPage}`);
            return true;
        },

        /*
        loadImageAndZoomArea: function(docObject, x, y, width, height) {
            if (docObject.docId !== $imageInfo.docId && $variable.showAnnotationTool) {
                $function.loadAnnotation();
            }

            if (docObject.currentPage !== $imageInfo.currentPage && docObject.docId !== $imageInfo.docId) {
                $imageInfo = docObject;
                var url = $variable.imageServerUrl + "?docId=" + $imageInfo.docId + "&formId=" + $imageInfo.formId + "&currentPage=" + $imageInfo.currentPage + "&viewPage=" + $imageInfo.viewPage + "&totalPage=" + $imageInfo.totalPage;
        		var xhr = new XMLHttpRequest();
                xhr.responseType = 'arraybuffer';
                xhr.open('GET', url);
                xhr.onload = function (e) {
                    var tiff = new Tiff({buffer: xhr.response});
                    $variable._imageWidth = tiff.width();
                    $variable._imageHeight = tiff.height();
                    var scale_w = $variable.viewerWidth / $variable._imageWidth;
                    var scale_h = $variable.viewerHeight / $variable._imageHeight;
                    $variable._minScale = scale_h < scale_w ? scale_h : scale_w;

                    $imageCanvas.width = $variable._imageWidth ;
                    $imageCanvas.height = $variable._imageHeight;

                    $annotationCanvas.width = $variable._imageWidth ;
                    $annotationCanvas.height = $variable._imageHeight;

                    $image = new Image();
                    $image.src = tiff.toDataURL();

                    $variable._currentScale = $variable._minScale;

                    $function.zoomArea(x, y, width, height);
                };
                xhr.send();
            } else {
                $function.zoomArea(x, y, width, height);
            }
        	return true;
        },
         */

        loadAnnotation: function() {
            // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
            // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色
            $annoArray = [
                { id: 0, page: 1, x: 100, y: 200, width: 100, height: 100, type: 'RECT', text: '這是中文註記', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' },
                { id: 0, page: 1, x: 500, y: 500, width: 200, height: 200, type: 'RECT', text: 'This is annotation', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' }
            ];
        },

        //產生工具列
        _renderToolBar: function() {
            let btnFitHeight = $function._renderButton($toolBtns.id.btnFitHeight);
            let btnFitWidth  = $function._renderButton($toolBtns.id.btnFitWidth);
            let btnFullSize  = $function._renderButton($toolBtns.id.btnFullSize);
            let btnZoomIn    = $function._renderButton($toolBtns.id.btnZoomIn);
            let btnZoomOut   = $function._renderButton($toolBtns.id.btnZoomOut);
            let btnRotateCW  = $function._renderButton($toolBtns.id.btnRotateCW);
            let btnRotateCCW = $function._renderButton($toolBtns.id.btnRotateCCW);
            let btnPrint     = $function._renderButton($toolBtns.id.btnPrint);
            let btnShowAnno  = $function._renderButton($toolBtns.id.btnShowAnno, false);
            let btnHideAnno  = $function._renderButton($toolBtns.id.btnHideAnno);
            let btnEditAnno  = $function._renderButton($toolBtns.id.btnEditAnno);
            let btnDelAnno   = $function._renderButton($toolBtns.id.btnDelAnno);
            let btnPrev      = $function._renderButton($toolBtns.id.btnPrev);
            let btnNext      = $function._renderButton($toolBtns.id.btnNext);
            let btnUnMax     = $function._renderButton($toolBtns.id.btnUnMax);
            let btnMax       = $function._renderButton($toolBtns.id.btnMax);
            /*
                        if (!$settings.showAnnotation) {
                            $settings.showAnnTool = false;
                        }*/
            if (!$variable.showAnnotationTool) {
                btnHideAnno = btnShowAnno = btnEditAnno = btnDelAnno = "";
                $variable._showAnnotation = false;
            } else {
                $variable._showAnnotation = true;
            }

            if (!$variable.showPrint) {btnPrint = "";}

            /*
            if (!$settings.showMaxBtn) {
                btnMax = btnUnMax = "";
            }*/

            let newId = 'dummy';
            let preId = 'dummy2';
            let page = `<span><input type='text' maxlength=3 style='width:24px;' id=${newId}-currentPage /><span class='totalPage' id=${newId}-totalPage>/---</span></span>`;

            return "<div id='" + newId + "-tool-btn-warp' style='background-color:darkgray;'>" + btnFitHeight + btnFitWidth + btnFullSize + btnZoomIn + btnZoomOut + btnRotateCW + btnRotateCCW +  btnPrint + btnShowAnno +   btnHideAnno + btnEditAnno + btnDelAnno + btnPrev + btnNext + page + "<span style='float:right'>" + btnUnMax + btnMax + "</span>" + "</div>";
        },
        // display:none
        _renderButton: function(btnId, show) {
            show = show === undefined ? true : show;

            let space = (btnId === "btnMax" || btnId === "btnUnMax") ? "" : "&nbsp;";
            return "<button type='button' class='tbtn btn-primary' title='" + $toolBtns.titles[btnId] + "' id='" + $variable._wapperId + '-' + btnId + "'" + (show ? " " : " style='display:none;'") + "><i class='fa " + $toolBtns.css[btnId] + " fa-1x'></i></button>" + (show ? space : "");
        },

        fitHeight: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FitHeight;
            $function._calcDisplayModeScale();
            $function._draw();
        },

        fitWidth: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FitWidth;
            $function._calcDisplayModeScale();
            $function._draw();
        },

        fullSize: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FullSize;
            $function._calcDisplayModeScale();
            $function._draw();
        },

        scaleUp: function() {
            $variable._currentScale += 0.05;
            $variable._currentScale = $variable._currentScale > 1 ? 1 : $variable._currentScale;

            $function._calcInScale();
            $function._draw();
        },

        scaleDown: function() {
            $variable._currentScale -= 0.05;
            $variable._currentScale = $variable._currentScale < $variable._minScale ? $variable._minScale : $variable._currentScale;

            $function._calcInScale();
            $function._draw();
        },

        rorateCW: function() {
            $function._rotateImage(90);
            $function._draw();
        },

        rorateCCW: function() {
            $function._rotateImage(-90);
            $function._draw();
        },

        prev: function() {
            $imageInfo.currentPage--;
            let url = document.location.href
                .replace("demo.html", `imageServlet?docId=${$imageInfo.docId}&currentPage=${$imageInfo.currentPage}&type=tiff`);
            $function.loadImageFromURL(url);
            $("#dummy-currentPage").val(`${$imageInfo.currentPage}`);
        },

        next : function() {
            $imageInfo.currentPage++;
            let url = document.location.href
                .replace("demo.html", `imageServlet?docId=${$imageInfo.docId}&currentPage=${$imageInfo.currentPage}&type=tiff`);
            $function.loadImageFromURL(url);
            $("#dummy-currentPage").val(`${$imageInfo.currentPage}`);

        },

        zoomArea: function(x, y, width, height) {
            if ($.isNumeric(x) && $.isNumeric(y) && $.isNumeric(width) && $.isNumeric(height)) {
                $function._zoomArea(x, y, width, height);
                $function._clearTempCanvas();
                //$function._drawRectangle(x, y, width, height, true, true);
                $function._drawRectangleInTempCanvas(x, y, width, height, true, true);
            }
        },



        _calcDisplayModeScale: function() {
            switch ($variable._displayMode) {
                case DisplayMode.FitWidth:
                        $variable._currentScale = $variable.viewerWidth / $variable._imageWidth;
                    break;
                case DisplayMode.FitHeight:
                        $variable._currentScale = $variable.viewerHeight / $variable._imageHeight;
                    break;
                case DisplayMode.FitWindow:
                    let scale1, scale2;
                    scale1 = $variable.viewerWidth / $variable._imageWidth;
                    scale2 = $variable.viewerHeight / $variable._imageHeight;
                    $variable._currentScale = scale1 < scale2 ? scale1 : scale2;
                    break;
                case DisplayMode.FullSize:
                    $variable._currentScale = 1;
                    break;
            }
            $function._calcInScale();
        },

        _calcInScale: function() {
            $variable._canvasDisplayWidth = $variable._imageWidth * $variable._currentScale;
            $variable._canvasDisplayHeight = $variable._imageHeight * $variable._currentScale;
        },

        //框選放大
        _zoomArea: function(x, y, width, height) {
            x = parseInt(x);
            y = parseInt(y);
            width = parseInt(width);
            height = parseInt(height);

            $variable._centerX = x + width / 2;
            $variable._centerY = y + height / 2;

            // 兩者取小倍率(適當倍率) 而且最大是一倍
            let scale1 = $variable.viewerWidth / width;
            let scale2 = $variable.viewerHeight / height;

            $variable._currentScale = scale1 > scale2 ? scale2 : scale1;
            $variable._currentScale = $variable._currentScale > 1 ? 1 : $variable._currentScale;

            $function._calcInScale();
            $function._draw();
        },

        _draw: function() {
            // draw image
            console.log("-------------------------------------------");
            if ($imageScrollPaneAPI.getIsScrollableH()) {
                $imageScrollPaneAPI.scrollToX(0);
                $annotationScrollPaneAPI.scrollToX(0);
            }
            if ($imageScrollPaneAPI.getIsScrollableV()) {
                $imageScrollPaneAPI.scrollToY(0);
                $annotationScrollPaneAPI.scrollToY(0);
            }
            $annotationCanvas.setAttribute('style', 'width:' + $variable._canvasDisplayWidth + 'px; height:' + $variable._canvasDisplayHeight + 'px; margin:0px; z-index: 4');
            $annotationScrollPaneAPI.reinitialise();
            $imageCanvas.setAttribute('style', 'width:' + $variable._canvasDisplayWidth + 'px; height:' + $variable._canvasDisplayHeight + 'px; margin:0px; z-index: 1');
            $imageScrollPaneAPI.reinitialise();

            // move scroll
            if ($imageScrollPaneAPI.getContentWidth() > $variable.viewerWidth) {
                if ($variable._centerX * $variable._currentScale > $variable.viewerWidth / 2) {
                    $imageScrollPaneAPI.scrollToX($variable._centerX * $variable._currentScale - $variable.viewerWidth / 2);
                    $annotationScrollPaneAPI.scrollToX($variable._centerX * $variable._currentScale - $variable.viewerWidth / 2);
                }
            }

            if ($imageScrollPaneAPI.getContentHeight() > $variable.viewerHeight) {
                if ($variable._centerY * $variable._currentScale > $variable.viewerHeight / 2) {
                    $imageScrollPaneAPI.scrollToY($variable._centerY * $variable._currentScale - $variable.viewerHeight / 2);
                    $annotationScrollPaneAPI.scrollToY($variable._centerY * $variable._currentScale - $variable.viewerHeight / 2);
                }
            }
        },

        _drawWaterMark: function() {
            let context = $watermarkCanvas.getContext('2d');
            context.save();
            context.translate($variable.viewerWidth / 2, $variable.viewerHeight / 2);
            context.rotate(Math.PI / 4);
            context.textAlign = 'center';
            context.font = $variable.waterMarkFont;
            context.fillStyle = $variable.waterMarkFillColor;
            context.globalAlpha = $variable.waterMarkFillAlpha;
            context.fillText($variable.waterMarkText, 0, 10);
            context.restore();
        },

        _drawRectangleInTempCanvas: function(x, y, width, height, clearCanvas, fill) {
            clearCanvas = clearCanvas === undefined ? false : clearCanvas;
            fill = fill === undefined ? false : fill;

            let ctx = $tempCanvas.getContext('2d');

            if (clearCanvas){ ctx.clearRect(0, 0, $variable._imageWidth, $variable._imageHeight); }
            ctx.beginPath();

            ctx.rect(x*$variable._currentScale - $imageScrollPaneAPI.getContentPositionX(), y*$variable._currentScale - $imageScrollPaneAPI.getContentPositionY(), width*$variable._currentScale, height*$variable._currentScale);
            if (fill) {
                ctx.fillStyle = $variable.zoomRectFillStyle;
                ctx.fill();
            }
            ctx.lineWidth = $variable.zoomRectLineWidth;
            ctx.strokeStyle = $variable.zoomRectLineColor;
            ctx.stroke();
        },

        _clearTempCanvas: function() {
            let ctx = $tempCanvas.getContext('2d');
            ctx.clearRect(0, 0, $variable._imageWidth, $variable._imageHeight);
        },

        _rotateImage: function(degree) {
            $variable._rotate += degree;
            let tmp = $variable._imageHeight;
            $variable._imageHeight = $variable._imageWidth;
            $variable._imageWidth = tmp;

            let scale_w = $variable.viewerWidth / $variable._imageWidth;
            let scale_h = $variable.viewerHeight / $variable._imageHeight;
            $variable._minScale = scale_h < scale_w ? scale_h : scale_w;
            //$variable._currentScale = $variable._minScale;

            $imageCanvas.width = $variable._imageWidth ;
            $imageCanvas.height = $variable._imageHeight;
            $annotationCanvas.width = $variable._imageWidth ;
            $annotationCanvas.height = $variable._imageHeight;

            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            let ctx = $imageCanvas.getContext('2d');
            ctx.translate($variable._centerX, $variable._centerY);
            ctx.rotate($variable._rotate/180*Math.PI);
            ctx.drawImage($image, -$variable._oriImageWidth/2, -$variable._oriImageHeight/2);
            ctx.rotate(-$variable._rotate/180*Math.PI);
            ctx.translate(-$variable._centerX, -$variable._centerY);

            $function._calcInScale();
        },

        _clearAnnotationCanvas: function() {
            let ctx = $annotationCanvas.getContext('2d');
            ctx.clearRect(0, 0, $variable._imageWidth, $variable._imageHeight);
        },

        _redrawAnnotationCanvas: function() {
            $function._clearAnnotationCanvas();

            // loop annotation list
            for (let i=0; i< $annoArray.length; i++) {
                //if ($annoArray[i].page == $imageInfo.currentPage) {
                    $function._drawAnnotation($annoArray[i]);
                //}
            }
        },

        _drawAnnotation: function(anno) {
            // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
            // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色

            let context = $annotationCanvas.getContext('2d');

            context.beginPath();
            context.rect(anno.x, anno.y, anno.width, anno.height);
            context.fillStyle = anno.bgcolor;
            context.globalAlpha = $variable.annotationDrawAlpha;
            context.fill();
            context.lineWidth = $variable.zoomRectLineWidth;
            context.strokeStyle = anno.linecolor;
            context.stroke();
            context.font = $variable.annotationDefaultFont;
            context.textBaseline = 'top';
            context.fillStyle = anno.fontcolor;
            context.globalAlpha = 1;
            context.fillText(anno.text, anno.x + $variable.annotationTextMargin, anno.y + $variable.annotationTextMargin);
        },

        _toActualAxisX: function(x) { return (x / $variable._currentScale); },

        _toActualAxisY: function(y) { return (y / $variable._currentScale); },

        _showTab: function (evt, tabId) {
            let i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabId).style.display = "block";
            evt.currentTarget.className += " active";
        }
    }
    //=====================================================================================================================
})(jQuery);
