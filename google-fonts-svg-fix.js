// SVGエクスポート関数の修正コード
// メインJSファイルの該当部分を以下のコードに置き換えてください

// SVGエクスポート関数
exportAsSVG: function(size) {
  // SVG作成
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  // 背景（透過設定がオフの場合のみ）
  if (!app.settings.transparentBackground) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('fill', app.settings.backgroundColor);
    svg.appendChild(rect);
  }

  // スケール係数
  const scaleFactor = size / BASE_CANVAS_SIZE;

  // 使用されているフォントを収集
  const usedFonts = [];
  app.layers.filter(layer => !layer.isGhost && layer.type === 'text').forEach(layer => {
    if (layer.params.font && layer.params.font !== 'serif' && layer.params.font !== 'sans-serif') {
      usedFonts.push(layer.params.font);
    }
  });

  // 重複を除去
  const uniqueFonts = [...new Set(usedFonts)];

  // defs要素とstyle要素の作成
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  let styleContent = '';

  // フォントURLのマッピング
  const fontUrlMapping = {
    'noto-serif-jp': 'Noto+Serif+JP',
    'noto-sans-jp': 'Noto+Sans+JP',
    'zcool-kuaile': 'ZCOOL+KuaiLe',
    'hina-mincho': 'Hina+Mincho',
    'reggae-one': 'Reggae+One',
    'dot-gothic': 'DotGothic16',
    'hachi-maru-pop': 'Hachi+Maru+Pop',
    'new-tegomin': 'New+Tegomin',
    'stick': 'Stick',
    'yomogi': 'Yomogi',
    'zen-old-mincho': 'Zen+Old+Mincho',
    'nothing-you-could-do': 'Nothing+You+Could+Do',
    'league-script': 'League+Script',
    'special-elite': 'Special+Elite',
    'libre-barcode-39': 'Libre+Barcode+39',
    'padauk': 'Padauk',
    'rampart-one': 'Rampart+One'
  };

  // フォントファミリーのマッピング
  const fontFamilyMapping = {
    'noto-serif-jp': '"Noto Serif JP", serif',
    'noto-sans-jp': '"Noto Sans JP", sans-serif',
    'zcool-kuaile': '"ZCOOL KuaiLe", sans-serif',
    'hina-mincho': '"Hina Mincho", serif',
    'reggae-one': '"Reggae One", cursive',
    'dot-gothic': '"DotGothic16", sans-serif',
    'hachi-maru-pop': '"Hachi Maru Pop", cursive',
    'new-tegomin': '"New Tegomin", serif',
    'stick': '"Stick", sans-serif',
    'yomogi': '"Yomogi", cursive',
    'zen-old-mincho': '"Zen Old Mincho", serif',
    'nothing-you-could-do': '"Nothing You Could Do", cursive',
    'league-script': '"League Script", cursive',
    'special-elite': '"Special Elite", cursive',
    'libre-barcode-39': '"Libre Barcode 39", monospace',
    'padauk': '"Padauk", sans-serif',
    'rampart-one': '"Rampart One", cursive'
  };

  if (uniqueFonts.length > 0) {
    // Google Fontsのインポート
    const fontNames = uniqueFonts
      .map(font => fontUrlMapping[font])
      .filter(name => name !== undefined);

    if (fontNames.length > 0) {
      // @importルールを追加
      styleContent += `@import url("https://fonts.googleapis.com/css2?family=${fontNames.join('&family=')}&display=swap");\n`;
    }

    // 各フォントのクラスを定義
    uniqueFonts.forEach(font => {
      if (fontFamilyMapping[font]) {
        styleContent += `.font-${font} { font-family: ${fontFamilyMapping[font]}; }\n`;
      }
    });

    // スタイル要素にコンテンツを設定
    style.textContent = styleContent;
    defs.appendChild(style);
    svg.appendChild(defs);
  }

  // 全てのレイヤーをSVG要素に変換
  app.layers.filter(layer => !layer.isGhost).forEach(layer => {
    const layerSvg = this.createSVGFromLayer(layer, size, scaleFactor, uniqueFonts);
    if (layerSvg) {
      svg.appendChild(layerSvg);
    }
  });

  // シリアライズ
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(svgBlob, 'magic-circle.svg');
},

// レイヤーからSVG要素を作成
createSVGFromLayer: function(layer, size, scaleFactor, fontsList) {
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2;
  
  switch(layer.type) {
    case 'circle':
      return this.createCircleSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    case 'shapes':
      return this.createShapesSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    case 'lines':
      return this.createLinesSVG(layer, centerX, centerY, maxRadius, scaleFactor);
    case 'text':
      return this.createTextSVG(layer, centerX, centerY, maxRadius, scaleFactor, fontsList);
    default:
      return null;
  }
},

// 文字レイヤーをSVGに変換
createTextSVG: function(layer, centerX, centerY, maxRadius, scaleFactor, fontsList) {
  const { text, font, textSize, radius, spacing, offset, rotation, mode, color, direction = 'ltr' } = layer.params;
  const actualRadius = radius * maxRadius;
  const actualSize = textSize * scaleFactor;
  
  // グループ要素を作成
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('fill', color);
  
  // 元の配列を変更せずに新しい配列を作成
  const chars = text.split('');
  let displayChars = chars;
  
  // 配置モードに応じて文字を配置
  switch (mode) {
    case 'loop':
      // 文字間の角度を計算 - 文字サイズ比に対応
      const minAngle = 0.5; // 最小角度
      const spaceAngle = (textSize * spacing / actualRadius) * (180 / Math.PI);
      const charAngle = Math.max(spaceAngle, minAngle);
      
      // 全体の長さを計算
      const totalChars = chars.length;
      const totalLength = totalChars * charAngle;
      
      // 実際に描画する文字数に制限
      const maxDisplayChars = 1000;
      const maxChars = Math.min(Math.ceil(360 / charAngle), maxDisplayChars);
      
      // 描画開始角度
      let startAngle = offset + 270 - (totalLength / 2);
      
      // 全周に収まる数を計算
      const maxRepeatCount = Math.ceil(maxChars / totalChars);
      const repeatCount = Math.min(Math.ceil(360 / (totalChars * charAngle)), maxRepeatCount);
      
      // 右から左の場合は順序を反転
      if (direction === 'rtl') {
        displayChars = chars.slice().reverse();
      }
      
      // 文字を描画
      let totalDrawnChars = 0;
      for (let r = 0; r < repeatCount; r++) {
        for (let i = 0; i < totalChars; i++) {
          if (totalDrawnChars >= maxDisplayChars) break;
          
          const char = displayChars[i];
          const angle = startAngle + (i + r * totalChars) * charAngle;
          
          if ((i + r * totalChars) * charAngle > 360) break;
          
          const pos = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
          
          // テキスト要素を作成
          const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textElement.setAttribute('x', '0');
          textElement.setAttribute('y', '0');
          textElement.setAttribute('font-size', actualSize);
          
          // フォントをクラスとして設定
          if (fontsList && fontsList.includes(font)) {
            textElement.setAttribute('class', `font-${font}`);
          } else {
            textElement.setAttribute('font-family', layer.getFontFamily(font));
          }
          
          textElement.setAttribute('text-anchor', 'middle');
          textElement.setAttribute('dominant-baseline', 'middle');
          
          // 文字回転
          let textRotation = angle + 90 + rotation;
          textElement.setAttribute('transform', `translate(${pos.x}, ${pos.y}) rotate(${textRotation})`);
          
          textElement.textContent = char;
          group.appendChild(textElement);
          
          totalDrawnChars++;
        }
      }
      break;
      
    case 'single':
      // 文字間の角度を計算
      const minAngleSingle = 0.5;
      const spaceAngleSingle = (textSize * spacing / actualRadius) * (180 / Math.PI);
      const singleCharAngle = Math.max(spaceAngleSingle, minAngleSingle);
      
      // 全体の長さを計算
      const totalCharsSingle = chars.length;
      const singleTotalLength = totalCharsSingle * singleCharAngle;
      
      // 描画開始角度
      let singleStartAngle = offset + 270 - (singleTotalLength / 2);
      
      // 文字数制限
      const maxDisplayCharsSingle = 1000;
      const displayCharsSingle = Math.min(totalCharsSingle, maxDisplayCharsSingle);
      
      // 右から左の場合は順序を反転
      if (direction === 'rtl') {
        displayChars = chars.slice().reverse();
      }
      
      // 文字を描画
      for (let i = 0; i < displayCharsSingle; i++) {
        const char = displayChars[i];
        const angle = singleStartAngle + i * singleCharAngle;
        const pos = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
        
        // テキスト要素を作成
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', '0');
        textElement.setAttribute('y', '0');
        textElement.setAttribute('font-size', actualSize);
        
        // フォントをクラスとして設定
        if (fontsList && fontsList.includes(font)) {
          textElement.setAttribute('class', `font-${font}`);
        } else {
          textElement.setAttribute('font-family', layer.getFontFamily(font));
        }
        
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        
        // 文字回転
        let textRotation = angle + 90 + rotation;
        textElement.setAttribute('transform', `translate(${pos.x}, ${pos.y}) rotate(${textRotation})`);
        
        textElement.textContent = char;
        group.appendChild(textElement);
      }
      break;
      
    case 'equal':
      // 文字数制限
      const totalCharsEqual = chars.length;
      const maxDisplayCharsEqual = 1000;
      const displayCharsEqual = Math.min(totalCharsEqual, maxDisplayCharsEqual);
      
      // 全周を文字数で分割
      const equalCharAngle = 360 / displayCharsEqual;
      
      // 描画開始角度
      let equalStartAngle = offset + 270;
      
      // 右から左の場合は順序を反転
      if (direction === 'rtl') {
        displayChars = chars.slice().reverse();
      }
      
      // 文字を描画
      for (let i = 0; i < displayCharsEqual; i++) {
        const char = displayChars[i];
        const angle = equalStartAngle + i * equalCharAngle;
        const pos = Utils.polarToCartesian(centerX, centerY, actualRadius, angle);
        
        // テキスト要素を作成
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', '0');
        textElement.setAttribute('y', '0');
        textElement.setAttribute('font-size', actualSize);
        
        // フォントをクラスとして設定
        if (fontsList && fontsList.includes(font)) {
          textElement.setAttribute('class', `font-${font}`);
        } else {
          textElement.setAttribute('font-family', layer.getFontFamily(font));
        }
        
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        
        // 文字回転
        let textRotation = angle + 90 + rotation;
        textElement.setAttribute('transform', `translate(${pos.x}, ${pos.y}) rotate(${textRotation})`);
        
        textElement.textContent = char;
        group.appendChild(textElement);
      }
      break;
  }
  
  return group;
},
