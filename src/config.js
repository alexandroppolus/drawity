var jscpConfig = {

    defConfig: {
        historyLimit: 6,
        
        width: 500,
        height: 400,
        minWidth: 8,
        minHeight: 8,
        margin: 16,
        
        openDDFiles: false,
        
        /* config for BG image */
        bgTileSize: 8,
        bgTileColor1: '#c9c9c9',
        bgTileColor2: '#fefefe'
    },
    
    toolOptionsConfig: {
        color: {
            defValue: '#000000',
            check: graphUtils.color.checkColor,
            translate: graphUtils.color.format
        },
        fillColor: {
            defValue: '#dddddd',
            check: graphUtils.color.checkColor,
            translate: graphUtils.color.format
        },
        
        penForm: {
            defValue: 'round',
            check: ['round', 'square']
        },
        lineCap: {
            defValue: 'round',
            check: ['round', 'butt', 'square']
        },
        lineJoin: {
            defValue: 'round',
            check: ['round', 'miter', 'bevel']
        },
        lineWidth: {
            defValue: 1,
            check: utils.checkNumber(1, 100, true)
        },
        
        rectRadius: {
            defValue: 8,
            check: utils.checkNumber(1, 100, true)
        },
        
        drawPattern: {
            defValue: '',
            check: graphUtils.patterns.checkName
        },
        
        fillType: {
            defValue: 'replace',
            check: ['replace']
        },
        
        fillAlpha: {
            defValue: 'cyry',
            check: ['cyry', 'cnrn', 'cyrn', 'cnry']
        },
        
        picker: {
            defValue: 'color',
            check: ['color', 'fillColor']
        },
        /*
        drawPen: {
            defValue: 'stroke',
            check: ['stroke', 'erase']
        },
        */
        drawLine: {
            defValue: 'stroke',
            check: ['stroke', 'erase', 'parterase']
        },
        drawShape: {
            defValue: 'both',
            check: ['stroke', 'fill', 'both', 'erase', 'parterase']
        },
        
        curve: {
            defValue: 'bezier3',
            check: ['line', 'bezier2', 'bezier3', 'arc']
        },
        
        curveApplyOptions: {
            defValue: true,
            check: 'boolean'
        },
        
        fontBold: {
            defValue: false,
            check: 'boolean'
        },
        fontItalic: {
            defValue: false,
            check: 'boolean'
        },
        fontSize: {
            defValue: 16,
            check: utils.checkNumber(5, 100, true)
        },
        fontFamily: {
            defValue: 'sans-serif'
        }
    },
    
    constValues: {
        minWidth: 1,
        minHeight: 1
    }
};