(function($)
{
    let $docNum = 0;
    let $viewers = [100];
    let $viewer =
        {
            docId : null,
            docType : null,
            docUrl : null,
            Page : 1,
            totalPage : null,
            imageWidth : null,
            imageHeight : null,
            editWidth : null,
            editHeight : null,

            scrollBarWidth : 17,
            divWidth : null,
            divHeight : null,
            rotateDegree : 90,
            totalRotate : 0,
            ZoomInScale : 1,

            focusX : 0,
            focusY : 0,
            focusWidth : 0,
            focusHeight : 0,
            focusZoomInScale : null,

            tagBtnClicked : false,
            tagX : 0,
            tagY : 0,
            tagWidth : 0,
            tagHeight : 0,
            tagZoomInScale : null,

            clickType : null,
            clickStartX : 0,
            clickStartY : 0,
            clickStartPageX : 0,
            clickStartPageY : 0,
            clickStartScrollX : 0,
            clickStartScrollY : 0,

            scrollX : 0,
            scrollY : 0,
        }



})(jQuery);
