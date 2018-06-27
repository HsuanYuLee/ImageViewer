(function ($) {
    let $imageContain = null;
    let $imageCanvas = null;
    let $imageScrollPaneAPI = null;

    let $annotationContain = null;
    let $annotationCanvas = null;
    let $annotationScrollPaneAPI = null;

    let $watermarkCanvas = null;

    let $tempContain = null;
    let $tempCanvas = null;
    let $tempScrollPaneAPI = null;

    let $annoEditDialog = null;

    let $image;

    // $annoArray 用來放 annotation
    // 每個 annotation 的內容為
    // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
    // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色

    let $annoArray = null;

    let $toolsBtn = {
        FitHeight: { id: "btnFitHeight", css: "fa-arrows-v",        show: true, title: "最適高度"  },
        FitWidth:  { id: "btnFitWidth",  css: "fa-arrows-h",        show: true, title: "最適寬度"  },
        FullSize:  { id: "btnFullSize",  css: "fa-arrows",          show: true, title: "原圖"     },
        ZoomIn:    { id: "btnZoomIn",    css: "fa-search-plus",     show: true, title: "放大"     },
        ZoomOut:   { id: "btnZoomOut",   css: "fa-search-minus",    show: true, title: "縮小"     },
        RotateCW:  { id: "btnRotateCW",  css: "fa-repeat",          show: true, title: "旋轉"     },
        RotateCCW: { id: "btnRotateCCW", css: "fa-undo",            show: true, title: "旋轉"     },
        Print:     { id: "btnPrint",     css: "fa-print",           show: true, title: "列印"     },
        ShowAnno:  { id: "btnShowAnno",  css: "fa-eye",             show: false,title: "顯示註記"  },
        HideAnno:  { id: "btnHideAnno",  css: "fa-eye-slash",       show: true, title: "隱藏註記"  },
        EditAnno:  { id: "btnEditAnno",  css: "fa-pencil-square-o", show: true, title: "新增註記"  },
        DelAnno:   { id: "btnDelAnno",   css: "fa-trash-o",         show: true, title: "刪除註記"  },
        Prev:      { id: "btnPrev",      css: "fa-arrow-left",      show: true, title: "上一頁"    },
        Next:      { id: "btnNext",      css: "fa-arrow-right",     show: true, title: "下一頁"    },
        UnMax:     { id: "btnUnMax",     css: "fa-window-restore",  show: true, title: "還原"     },
        Max:       { id: "btnMax",       css: "fa-window-maximize", show: false,title: "最大化"    },
    };

    let DisplayMode = { FitWidth: 0, FitHeight: 1, FitWindow: 2, FullSize: 3 };
    let MouseMode = {None: 0, Zoom: 1, Move: 2};
    let AnnoMode = {None: 0, Edit: 1, Del: 2};

    let $mouseTrack = { startX: 0, startY: 0, endX: 0, endY: 0};

    let $importVariable = {
        viewerWidth: 1000,
        viewerHeight: 600,
        //外部傳入影像資訊
        imageServerUrl: '',
        imageInfo : [{ docId: "", formId: "", currentPage: "", viewPage: "", totalPage: "" }],
        //DisplayMode : { FitWidth: 0, FitHeight: 1, FitWindow: 2, FullSize: 3 };
        initDisplayMode : 3,
        waterMarkText : '',
        displayAfterLoad : true,
        // 沒有 tool 就沒有 annotation
        showAnnotationTool: true
    };

    let $variable = {
        waterMarkFont: 'bold 60pt Calibri',
        waterMarkFillColor: '#ff0000',
        waterMarkFillAlpha: 0.4,
        waterMarkRotateAngle: 45,

        zoomRectFillStyle: 'rgba(255, 255, 125, 0.4)',
        zoomRectLineWidth: 2,
        zoomRectLineColor: '#ff0000',
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
        _oriImageWidth : null,    _oriImageHeight : null,

        // 記錄影像的長寬
        _imageWidth: 1, _imageHeight: 1,
        _centerX: 1, _centerY: 1,
        _shiftX: 0, _shiftY: 0,
        _starPtX: 0, _starPtY: 0,

        _canvasDisplayWidth: 0, _canvasDisplayHeight: 0,

        _rotate: 0,
        _displayMode: DisplayMode.FullSize,

        _drawZoomRect: false,
        _drawAnnotation: false,
        _showAnnotation: false,

        _mouseMode: MouseMode.None,

        _annoMode: AnnoMode.None,
        _newX: 0, _newY: 0
    };
//======================================================================================================================
//imageviewer - singleDoc

    $.fn.imageviewer = function (options) {

        $importVariable = $.extend($importVariable, options);
        $variable._showAnnotation = $importVariable.showAnnotationTool;
        /*  myId - toolbar
                 - viewerPanel - annotationContain - annotationCanvas (z-index: 4, 所有滑鼠在這一層 listener)
                               - tempCanvas (z-index: 3)
                               - watermarkCanvas (z-index: 2)
                               - imageContain - imageCanvas (z-index: 1)
        */
//---------------------------------------------------------------------------------------------------------------------
//render toolBar
        $variable._wapperId = $(this).attr("id");
        if ($variable.showToolBar) {
            $(`#${$variable._wapperId}`).append(`<div id="dummy-tool-btn-warp" style="background-color:darkgray;"></div>`);
            if (!$importVariable.showAnnotationTool) {
                $toolsBtn.ShowAnno.show = false;
                $toolsBtn.HideAnno.show = false;
                $toolsBtn.EditAnno.show = false;
                $toolsBtn.DelAnno.show = false;
            }
            for (let i in $toolsBtn) {
                $(`#dummy-tool-btn-warp`).append(`
                <button type="button" id="${$variable._wapperId}-${$toolsBtn[i].id}" class="tbtn btn-primary" title="${$toolsBtn[i].title}" ><i class="fa ${$toolsBtn[i].css} fa-1x"></i></button>`);
                if (!$toolsBtn[i].show) {$(`#${$variable._wapperId}-${$toolsBtn[i].id}`).css({display : 'none'});}
            }
            $(`#${$variable._wapperId}-btnNext`).after(`<span><input type='text' maxlength=3 style='width:24px;' id=dummy-currentPage><span id=dummy-totalPage>/</span></span>`);
            $(`#${$variable._wapperId}-btnUnMax`).css({float : 'right'});
            $(`#${$variable._wapperId}-btnMax`).css({float : 'right'});
        }
//render viewer
        $(`#${$variable._wapperId}`).css({ width : $importVariable.viewerWidth, height : $importVariable.viewerHeight }).append(`
        <div id="${$variable._wapperId}-PANEL">
            <canvas id="watermarkCanvas" width="${$importVariable.viewerWidth}" height="${$importVariable.viewerHeight}" style="width:${$importVariable.viewerWidth}px; height: ${$importVariable.viewerHeight}px; position: absolute; z-index: 2;"></canvas>
            <div id="${$variable._wapperId}-IMAGEDIV" style="width:${$importVariable.viewerWidth}px; height: ${$importVariable.viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 1;">
                <canvas id="imageCanvas"></canvas>
            </div>
            <div id="${$variable._wapperId}-TEMPDIV" style="width:${$importVariable.viewerWidth}px; height: ${$importVariable.viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 3">
                <canvas id="tempCanvas"></canvas>
            </div>
            <div id="${$variable._wapperId}-DRAWDIV" style="width:${$importVariable.viewerWidth}px; height: ${$importVariable.viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 4">
                <canvas id="annotationCanvas"></canvas>
            </div>
        </div>`);
//----------------------------------------------------------------------------------------------------------------------
//set viewer component
        $function.loadImage($importVariable);
        $("#dummy-currentPage").val(`${$importVariable.imageInfo.currentPage}`);
        $("#dummy-totalPage").html(` /${$importVariable.imageInfo.totalPage}`);
        if ($importVariable.imageInfo.currentPage === '1') {$(`#${$variable._wapperId}-btnPrev`).prop('disabled',true);}

        $watermarkCanvas = document.getElementById("watermarkCanvas");
        if ($importVariable.waterMarkText !== '') { $function._drawWaterMark();}

        $imageCanvas = document.getElementById("imageCanvas");
        $imageContain = $(`#${$variable._wapperId}-IMAGEDIV`);
        $imageScrollPaneAPI = $imageContain.jScrollPane({ showArrows: false }).data('jsp');

        $tempCanvas = document.getElementById('tempCanvas');
        $tempContain = $(`#${$variable._wapperId}-TEMPDIV`);
        $tempScrollPaneAPI = $tempContain
            .bind('jsp-scroll-x', function(event, scrollPositionX) {
                $imageScrollPaneAPI.scrollToX(scrollPositionX);
            })
            .bind('jsp-scroll-y', function(event, scrollPositionY) {
                $imageScrollPaneAPI.scrollToY(scrollPositionY);
            })
            .jScrollPane({
                showArrows: false,
                horizontalDragMaxWidth: 0,
                verticalDragMaxHeight: 0
            })
            .data('jsp');

        $annotationCanvas = document.getElementById('annotationCanvas');
        $annotationContain = $(`#${$variable._wapperId}-DRAWDIV`);
        $annotationScrollPaneAPI = $annotationContain
            .bind('jsp-scroll-x', function(event, scrollPositionX) {
                $imageScrollPaneAPI.scrollToX(scrollPositionX);
            })
            .bind('jsp-scroll-y', function(event, scrollPositionY) {
                $imageScrollPaneAPI.scrollToY(scrollPositionY);
            })
            .jScrollPane({ showArrows: false })
            .data('jsp');
//----------------------------------------------------------------------------------------------------------------------
//set toolbar component
        if ($variable.showToolBar) {
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

            $(`#${$variable._wapperId}-btnShowAnno`).click(function () {
                $variable._showAnnotation = true;
                $(`#${$variable._wapperId}-btnShowAnno`).hide();
                $(`#${$variable._wapperId}-btnHideAnno`).show();
                $function._redrawAnnotationCanvas();
            });

            $(`#${$variable._wapperId}-btnHideAnno`).click(function () {
                $variable._showAnnotation = false;
                $(`#${$variable._wapperId}-btnHideAnno`).hide();
                $(`#${$variable._wapperId}-btnShowAnno`).show();
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

            $(`#${$variable._wapperId}-btnPrev`).click(function () {
                $importVariable.imageInfo.currentPage--;
                $function.loadImage($importVariable);
                $("#dummy-currentPage").val(`${$importVariable.imageInfo.currentPage}`);
                $("#dummy-totalPage").html(` /${$importVariable.imageInfo.totalPage}`);
                if ($importVariable.imageInfo.currentPage === 1) {
                    $(`#${$variable._wapperId}-btnPrev`).prop('disabled',true);
                }
                $(`#${$variable._wapperId}-btnNext`).prop('disabled',false);
            });

            $(`#${$variable._wapperId}-btnNext`).click(function () {
                $importVariable.imageInfo.currentPage++;
                $function.loadImage($importVariable);
                $("#dummy-currentPage").val(`${$importVariable.imageInfo.currentPage}`);
                $("#dummy-totalPage").html(` /${$importVariable.imageInfo.totalPage}`);
                if ($importVariable.imageInfo.currentPage === parseInt($importVariable.imageInfo.totalPage)) {
                    $(`#${$variable._wapperId}-btnNext`).prop('disabled',true);
                }
                $(`#${$variable._wapperId}-btnPrev`).prop('disabled',false);
            });

            $(`#${$variable._wapperId}-btnUnMax`).click(function () {
                $importVariable.viewerWidth /= 2;
                $(`#myDiv`).empty().imageviewer();
                $(`#${$variable._wapperId}-btnUnMax`).hide();
                $(`#${$variable._wapperId}-btnMax`).show();
            });

            $(`#${$variable._wapperId}-btnMax`).click(function () {
                $importVariable.viewerWidth *= 2;
                $(`#myDiv`).empty().imageviewer();
                $(`#${$variable._wapperId}-btnMax`).hide();
                $(`#${$variable._wapperId}-btnUnMax`).show();
            });

            $("#dummy-currentPage").keypress(function (e) {
                if(e.which === 13) {
                    let currentPage = $("#dummy-currentPage").val();
                    if (currentPage >= 1 && currentPage <= $importVariable.imageInfo.totalPage) {
                        $importVariable.imageInfo.currentPage = currentPage;
                        $function.loadImage($importVariable);
                        $("#dummy-currentPage").val(`${$importVariable.imageInfo.currentPage}`);
                        $("#dummy-totalPage").html(` /${$importVariable.imageInfo.totalPage}`);
                        $(`#${$variable._wapperId}-btnPrev`).prop('disabled',false);
                        $(`#${$variable._wapperId}-btnNext`).prop('disabled',false);

                        switch (currentPage) {
                            case '1' :
                                $(`#${$variable._wapperId}-btnPrev`).prop('disabled',true);
                                break;
                            case $importVariable.imageInfo.totalPage :
                                $(`#${$variable._wapperId}-btnNext`).prop('disabled',true);
                                break;
                        }
                    }else {
                        alert("error");
                        $("#dummy-currentPage").val(1);
                        $importVariable.imageInfo.currentPage = $("#dummy-currentPage").val();
                        $function.loadImage($importVariable);
                        $("#dummy-currentPage").val(`${$importVariable.imageInfo.currentPage}`);
                        $("#dummy-totalPage").html(` /${$importVariable.imageInfo.totalPage}`);
                        $(`#${$variable._wapperId}-btnPrev`).prop('disabled',true);
                        $(`#${$variable._wapperId}-btnNext`).prop('disabled',false);
                    }
                }
            })
        }
//----------------------------------------------------------------------------------------------------------------------
//Mouse Event
        $annotationContain.bind("contextmenu", function (e) { return false; });
        $annotationCanvas.addEventListener('mousedown', function (e) {

            $mouseTrack.startX = e.offsetX;   $mouseTrack.startY = e.offsetY;

            if (e.button === 2) { $variable._mouseMode = MouseMode.Zoom; }
            else if (e.button === 0) { $variable._mouseMode = MouseMode.Move; }
            else { $variable._mouseMode = MouseMode.None; }
        });

        $annotationCanvas.addEventListener('mousemove', function (e) {
            switch ($variable._mouseMode) {
                case MouseMode.Zoom :
                    $function._drawRectangleInTempCanvas($mouseTrack.startX, $mouseTrack.startY, e.offsetX-$mouseTrack.startX, e.offsetY-$mouseTrack.startY, true, false);
                    break;
                case MouseMode.Move :
                    $variable._newX = $annotationScrollPaneAPI.getContentPositionX() - (e.offsetX - $mouseTrack.startX);
                    $variable._newY = $annotationScrollPaneAPI.getContentPositionY() - (e.offsetY - $mouseTrack.startY);

                    $imageScrollPaneAPI.scrollTo($variable._newX,$variable._newY);
                    $annotationScrollPaneAPI.scrollTo($variable._newX,$variable._newY);
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
                        $function._zoomArea(x/$variable._currentScale, y/$variable._currentScale, Math.abs($mouseTrack.endX - $mouseTrack.startX)/$variable._currentScale, Math.abs($mouseTrack.endY - $mouseTrack.startY)/$variable._currentScale);
                    }
                    break;
                case MouseMode.Move :
                    $imageScrollPaneAPI.scrollTo($variable._newX,$variable._newY);
                    $annotationScrollPaneAPI.scrollTo($variable._newX,$variable._newY);
                    break;
            }
            $variable._mouseMode = MouseMode.None;
        });
//----------------------------------------------------------------------------------------------------------------------
    /*
        // Annotation 編輯的對話框
        if ($annoEditDialog === null) {
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

            $annoEditDialog.setContent(`
            <div class='tab'>
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
        }
    */
    };
//======================================================================================================================
//imageviewer2 - multiDoc
    $.fn.imageviewer2 = function (options) {

        $importVariable = $.extend($importVariable, options);
        $variable._showAnnotation = $importVariable.showAnnotationTool;

        console.log(options);
    };
//======================================================================================================================
//----------------------------------------------------------------------------------------------------------------------
//Functions
    let $function = {
        loadImage: function(docObject) {
            $variable._rotate = 0;

            if (docObject.showAnnotationTool) { $function.loadAnnotation(); }
            let url = `${docObject.imageServerUrl}?docId=${docObject.imageInfo.docId}&currentPage=${docObject.imageInfo.currentPage}&type=tiff`;
            console.log(url);

            let xhr = new XMLHttpRequest();
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', url);
            xhr.onload = function () {
                let t0 = performance.now();
                let tiff = new Tiff({buffer: xhr.response});
                $variable._oriImageWidth = tiff.width();             $variable._oriImageHeight = tiff.height();
                $variable._imageWidth = $variable._oriImageWidth;    $variable._imageHeight = $variable._oriImageHeight;

                $imageCanvas.width = $variable._imageWidth ;         $imageCanvas.height = $variable._imageHeight;
                $tempCanvas.width = $variable._imageWidth;           $tempCanvas.height = $variable._imageHeight;
                $annotationCanvas.width = $variable._imageWidth ;    $annotationCanvas.height = $variable._imageHeight;
                $variable._centerX = $variable._imageWidth / 2;      $variable._centerY = $variable._imageHeight / 2;

                let scale_w = docObject.viewerWidth / $variable._imageWidth;
                let scale_h = docObject.viewerHeight / $variable._imageHeight;
                $variable._minScale = scale_h < scale_w ? scale_h : scale_w;

                $image = new Image();
                $image.src = tiff.toDataURL();
                $image.onload = function () {
                    let t1 = performance.now();
                    console.log(`Load image decode tiff, took t1-t0 ${t1 - t0} milliseconds.`);
                    let ctx = $imageCanvas.getContext('2d');
                    ctx.drawImage($image, 0, 0);
                    if (docObject.displayAfterLoad) {
                        $function._calcDisplayModeScale(docObject.initDisplayMode);
                        $function._draw();
                    }
                    let t2 = performance.now();
                    console.log(`Load image all done, took t2-t0 ${t2 - t0} milliseconds.`);

                    // 如果要顯示 annotation, 就把 annotation 畫出來
                    if ($variable._showAnnotation) {
                        $function._redrawAnnotationCanvas();
                    }
                };
            };
            xhr.send();

            $("#dummy-currentPage").val(`${docObject.imageInfo.currentPage}`);
            $("#dummy-totalPage").text(`/${docObject.imageInfo.totalPage}`);
            return true;
        },

        loadAnnotation: function() {
            // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
            // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色
            $annoArray = [
                { id: 0, page: 1, x: 100, y: 200, width: 100, height: 100, type: 'RECT', text: '這是中文註記', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' },
                { id: 0, page: 1, x: 500, y: 500, width: 200, height: 200, type: 'RECT', text: 'This is annotation', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' }
            ];
        },

        fitHeight: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FitHeight;
            $function._calcDisplayModeScale($variable._displayMode);
            $function._draw();
        },

        fitWidth: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FitWidth;
            $function._calcDisplayModeScale($variable._displayMode);
            $function._draw();
        },

        fullSize: function() {
            $variable._centerX = $variable._imageWidth / 2;
            $variable._centerY = $variable._imageHeight / 2;

            $variable._displayMode = DisplayMode.FullSize;
            $function._calcDisplayModeScale($variable._displayMode);
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

        zoomArea: function(x, y, width, height) {
            if ($.isNumeric(x) && $.isNumeric(y) && $.isNumeric(width) && $.isNumeric(height)) {
                $function._zoomArea(x, y, width, height);
                $function._clearTempCanvas();
                //$function._drawRectangle(x, y, width, height, true, true);
                $function._drawRectangleInTempCanvas(x, y, width, height, true, true);
            }
        },

        _calcDisplayModeScale: function(displayMode) {
            switch (displayMode) {
                case DisplayMode.FitWidth:
                        $variable._currentScale = $importVariable.viewerWidth / $variable._imageWidth;
                    break;
                case DisplayMode.FitHeight:
                        $variable._currentScale = $importVariable.viewerHeight / $variable._imageHeight;
                    break;
                case DisplayMode.FitWindow:
                    let scale1, scale2;
                    scale1 = $importVariable.viewerWidth / $variable._imageWidth;
                    scale2 = $importVariable.viewerHeight / $variable._imageHeight;
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
            let scale1 = $importVariable.viewerWidth / width;
            let scale2 = $importVariable.viewerHeight / height;

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
                $tempScrollPaneAPI.scrollToX(0);
                $annotationScrollPaneAPI.scrollToX(0);
            }
            if ($imageScrollPaneAPI.getIsScrollableV()) {
                $imageScrollPaneAPI.scrollToY(0);
                $tempScrollPaneAPI.scrollToY(0);
                $annotationScrollPaneAPI.scrollToY(0);
            }
            $imageCanvas.setAttribute('style', 'width:' + $variable._canvasDisplayWidth + 'px; height:' + $variable._canvasDisplayHeight + 'px; margin:0px; z-index: 1');
            $imageScrollPaneAPI.reinitialise();
            $tempCanvas.setAttribute('style',`width:${$variable._canvasDisplayWidth}px; height:${$variable._canvasDisplayHeight}px; margin:0px; z-index: 3`);
            $tempScrollPaneAPI.reinitialise();
            $annotationCanvas.setAttribute('style', 'width:' + $variable._canvasDisplayWidth + 'px; height:' + $variable._canvasDisplayHeight + 'px; margin:0px; z-index: 4');
            $annotationScrollPaneAPI.reinitialise();

            // move scroll
            if ($imageScrollPaneAPI.getContentWidth() > $importVariable.viewerWidth) {
                if ($variable._centerX * $variable._currentScale > $importVariable.viewerWidth / 2) {
                    $imageScrollPaneAPI.scrollToX($variable._centerX * $variable._currentScale - $importVariable.viewerWidth / 2);
                    $annotationScrollPaneAPI.scrollToX($variable._centerX * $variable._currentScale - $importVariable.viewerWidth / 2);
                }
            }

            if ($imageScrollPaneAPI.getContentHeight() > $importVariable.viewerHeight) {
                if ($variable._centerY * $variable._currentScale > $importVariable.viewerHeight / 2) {
                    $imageScrollPaneAPI.scrollToY($variable._centerY * $variable._currentScale - $importVariable.viewerHeight / 2);
                    $annotationScrollPaneAPI.scrollToY($variable._centerY * $variable._currentScale - $importVariable.viewerHeight / 2);
                }
            }
        },

        _drawWaterMark: function() {
            let context = $watermarkCanvas.getContext('2d');
            context.save();
            context.translate($importVariable.viewerWidth / 2, $importVariable.viewerHeight / 2);
            context.rotate(Math.PI / 4);
            context.textAlign = 'center';
            context.font = $variable.waterMarkFont;
            context.fillStyle = $variable.waterMarkFillColor;
            context.globalAlpha = $variable.waterMarkFillAlpha;
            context.fillText($importVariable.waterMarkText, 0, 10);
            context.restore();
        },

        _drawRectangleInTempCanvas: function(x, y, width, height, clearCanvas, fill) {
            clearCanvas = clearCanvas === undefined ? false : clearCanvas;
            fill = fill === undefined ? false : fill;

            let ctx = $tempCanvas.getContext('2d');

            if (clearCanvas){ ctx.clearRect(0, 0, $variable._imageWidth, $variable._imageHeight); }
            ctx.beginPath();

            ctx.rect((x-$imageScrollPaneAPI.getContentPositionX())/$variable._currentScale, (y-$imageScrollPaneAPI.getContentPositionY())/$variable._currentScale, width/$variable._currentScale, height/$variable._currentScale);
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

            let scale_w = $importVariable.viewerWidth / $variable._imageWidth;
            let scale_h = $importVariable.viewerHeight / $variable._imageHeight;
            $variable._minScale = scale_h < scale_w ? scale_h : scale_w;

            $imageCanvas.width =      $variable._imageWidth;          $imageCanvas.height =      $variable._imageHeight;
            $tempCanvas.width =       $variable._imageWidth;          $tempCanvas.height =       $variable._imageHeight;
            $annotationCanvas.width = $variable._imageWidth ;         $annotationCanvas.height = $variable._imageHeight;

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
})(jQuery);
